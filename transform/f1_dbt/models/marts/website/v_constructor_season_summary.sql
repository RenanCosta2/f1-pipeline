{{ config(materialized='view', schema='website') }}

WITH completed_seasons AS (
    SELECT 
        schedule.year
    FROM 
        {{ ref('dim_schedule') }} AS schedule
    JOIN 
        {{ ref('dim_sessions') }} AS sessions 
        USING (event_sk)
    JOIN 
        {{ ref('fact_results') }} AS results 
        USING (session_sk)
    WHERE 
        sessions.session_name = 'Race'
    GROUP BY 
        schedule.year
    HAVING 
        MAX(schedule.round_number) = (
            SELECT 
                MAX(sub_schedule.round_number)
            FROM 
                {{ ref('dim_schedule') }} AS sub_schedule
            WHERE 
                sub_schedule.year = schedule.year
        )
),

team_season_drivers AS (
    SELECT
        driver_totals.year,
        driver_totals.team_id,
        TO_JSON_STRING(ARRAY_AGG(
            STRUCT(
                drivers.driver_id,
                drivers.driver_full_name,
                drivers.driver_abbreviation,
                drivers.driver_headshot_url,
                driver_totals.gps_raced,
                driver_totals.points
            ) ORDER BY driver_totals.points DESC, driver_totals.gps_raced DESC
        )) AS drivers_lineup,
        COUNT(DISTINCT driver_totals.driver_id) AS drivers_used_count
    FROM 
    (
        SELECT
            schedule.year,
            results.team_id,
            results.driver_id,
            COUNT(DISTINCT CASE WHEN sessions.session_name = 'Race' THEN schedule.event_sk END) AS gps_raced,
            SUM(COALESCE(results.points, 0)) AS points
        FROM 
            {{ ref('fact_results') }} AS results
        JOIN 
            {{ ref('dim_sessions') }} AS sessions 
            USING (session_sk)
        JOIN 
            {{ ref('dim_schedule') }} AS schedule 
            USING (event_sk)
        WHERE 
            sessions.session_name IN ('Race', 'Sprint', 'Qualifying')
            AND results.team_id IS NOT NULL
        GROUP BY 
            schedule.year,
            results.team_id,
            results.driver_id
    ) AS driver_totals
    JOIN 
        {{ ref('dim_drivers') }} AS drivers 
        USING (driver_id)
    GROUP BY
        driver_totals.year,
        driver_totals.team_id
),

race_fastest_laps AS (
    SELECT 
        schedule.year,
        sessions.event_sk,
        laps.team_id,
        ROW_NUMBER() OVER (
            PARTITION BY sessions.event_sk 
            ORDER BY MIN(laps.lap_time_seconds) ASC
        ) AS lap_rank
    FROM 
        {{ ref('fact_laps') }} AS laps
    JOIN 
        {{ ref('dim_sessions') }} AS sessions 
        USING (session_sk)
    JOIN 
        {{ ref('dim_schedule') }} AS schedule 
        USING (event_sk)
    WHERE 
        sessions.session_name = 'Race' 
        AND laps.lap_time_seconds IS NOT NULL
    GROUP BY 
        schedule.year,
        sessions.event_sk, 
        laps.team_id
),

season_fastest_laps AS (
    SELECT
        year,
        team_id,
        COUNT(CASE WHEN lap_rank = 1 THEN 1 END) AS fastest_laps
    FROM
        race_fastest_laps
    GROUP BY
        year,
        team_id
),

qualifying_sessions AS (
    SELECT
        session_sk,
        10 + CEIL((MAX(finishing_position) - 10) / 2.0) AS q2_cutoff
    FROM
        {{ ref('fact_results') }} AS results
    JOIN
        {{ ref('dim_sessions') }} AS sessions 
        USING (session_sk)
    WHERE
        sessions.session_name = 'Qualifying'
    GROUP BY
        session_sk
),

-- Métricas exclusivas calculadas corrida a corrida (sem risco de multiplicar linhas)
team_race_metrics AS (
    SELECT
        schedule.year,
        results.team_id,
        sessions.event_sk,

        -- Dobradinha (1-2 no GP)
        CASE WHEN COUNT(CASE WHEN results.finishing_position IN (1, 2) THEN 1 END) = 2 THEN 1 ELSE 0 END AS is_one_two,

        -- Pódio Duplo (ambos no pódio)
        CASE WHEN COUNT(CASE WHEN results.finishing_position <= 3 THEN 1 END) = 2 THEN 1 ELSE 0 END AS is_double_podium,

        -- Pontuação Dupla (ambos no top 10)
        CASE WHEN COUNT(CASE WHEN results.finishing_position <= 10 THEN 1 END) = 2 THEN 1 ELSE 0 END AS is_double_points,

        -- Primeira Fila (1-2 no Grid)
        CASE WHEN COUNT(CASE WHEN results.grid_position IN (1, 2) THEN 1 END) = 2 THEN 1 ELSE 0 END AS is_front_row_lockout
    FROM 
        {{ ref('fact_results') }} AS results
    JOIN
        {{ ref('dim_sessions') }} AS sessions 
        USING (session_sk)
    JOIN
        {{ ref('dim_schedule') }} AS schedule 
        USING (event_sk)
    WHERE 
        sessions.session_name = 'Race'
        AND results.team_id IS NOT NULL
    GROUP BY 
        schedule.year,
        results.team_id,
        sessions.event_sk
),

team_race_aggregates AS (
    SELECT
        year,
        team_id,
        SUM(is_one_two) AS total_one_two,
        SUM(is_double_podium) AS total_double_podium,
        SUM(is_double_points) AS total_double_points,
        SUM(is_front_row_lockout) AS total_front_row
    FROM
        team_race_metrics
    GROUP BY
        year,
        team_id
),

team_season_metrics AS (
    SELECT
        schedule.year,
        teams.team_id,
        teams.team_name,
        teams.team_color,

        -- Participações na Temporada
        COUNT(DISTINCT CASE WHEN sessions.session_name = 'Race' THEN schedule.event_sk END) AS total_gps,
        COUNT(DISTINCT CASE 
            WHEN sessions.session_name IN ('Race', 'Sprint', 'Qualifying', 'Sprint Qualifying', 'Sprint Shootout') 
            THEN schedule.event_sk 
        END) AS competitive_gps,

        -- Vitórias
        COUNT(CASE WHEN results.finishing_position = 1 AND sessions.session_name = 'Race' THEN 1 END) AS race_wins,
        COUNT(CASE WHEN results.finishing_position = 1 AND sessions.session_name = 'Sprint' THEN 1 END) AS sprint_wins,
        COUNT(CASE WHEN results.finishing_position = 1 AND sessions.session_name IN ('Race', 'Sprint') THEN 1 END) AS total_wins,

        -- Pole Positions
        COUNT(CASE WHEN results.grid_position = 1 AND sessions.session_name = 'Race' THEN 1 END) AS race_poles,
        COUNT(CASE WHEN results.grid_position = 1 AND sessions.session_name = 'Sprint' THEN 1 END) AS sprint_poles,
        COUNT(
            CASE 
                WHEN 
                    sessions.session_name = 'Race' 
                    AND results.grid_position = 1 
                    AND results.finishing_position = 1 
                THEN 1 
        END) AS poles_to_win,
        
        -- Pódios
        COUNT(CASE WHEN results.finishing_position <= 3 AND sessions.session_name = 'Race' THEN 1 END) AS race_podiums,
        COUNT(CASE WHEN results.finishing_position <= 3 AND sessions.session_name = 'Sprint' THEN 1 END) AS sprint_podiums,
        COUNT(CASE WHEN results.finishing_position <= 3 AND sessions.session_name IN ('Race', 'Sprint') THEN 1 END) AS total_podiums,

        -- Aparições nas qualis (ao menos um carro no Q2 / Q3)
        COUNT(DISTINCT CASE WHEN sessions.session_name = 'Qualifying' AND results.finishing_position <= quali.q2_cutoff THEN schedule.event_sk END) AS q2_appearences,
        COUNT(DISTINCT CASE WHEN sessions.session_name = 'Qualifying' AND results.finishing_position <= 10 THEN schedule.event_sk END) AS q3_appearences,

        -- Pontos
        SUM(CASE WHEN sessions.session_name = 'Race' THEN results.points ELSE 0 END) AS race_points,
        SUM(CASE WHEN sessions.session_name = 'Sprint' THEN results.points ELSE 0 END) AS sprint_points,
        SUM(COALESCE(results.points, 0)) AS total_points,

        -- Melhores Resultados
        MIN(CASE WHEN sessions.session_name = 'Race' AND results.finishing_position > 0 THEN results.finishing_position END) AS best_finish_position,
        MIN(CASE WHEN sessions.session_name = 'Race' AND results.grid_position > 0 THEN results.grid_position END) AS best_grid_position,

        -- Abandonos (DNFs totais combinados dos 2 carros)
        COUNT(CASE 
            WHEN sessions.session_name = 'Race' 
             AND results.status NOT IN ('Finished', 'Lapped') 
             AND results.status NOT LIKE '+%' 
            THEN 1 
        END) AS total_dnfs
    FROM 
        {{ ref('fact_results') }} AS results
    JOIN
        {{ ref('dim_sessions') }} AS sessions 
        USING (session_sk)
    JOIN
        {{ ref('dim_schedule') }} AS schedule 
        USING (event_sk)
    JOIN
        {{ ref('dim_constructors') }} AS teams 
        USING (team_id)
    LEFT JOIN
        qualifying_sessions AS quali
        USING (session_sk)
    GROUP BY
        schedule.year,
        teams.team_id,
        teams.team_name,
        teams.team_color
)

SELECT
    metrics.*,
    COALESCE(race_agg.total_one_two, 0) AS total_one_two,
    COALESCE(race_agg.total_double_podium, 0) AS total_double_podium,
    COALESCE(race_agg.total_double_points, 0) AS total_double_points,
    COALESCE(race_agg.total_front_row, 0) AS total_front_row,
    COALESCE(fastest.fastest_laps, 0) AS fastest_laps,
    CASE 
        WHEN metrics.race_poles > 0 
        THEN ROUND((CAST(metrics.poles_to_win AS NUMERIC) / metrics.race_poles) * 100, 2) 
        ELSE NULL 
    END AS pole_to_win_rate,
    CASE WHEN completed.year IS NOT NULL THEN TRUE ELSE FALSE END AS is_season_completed,
    DENSE_RANK() OVER (
        PARTITION BY metrics.year 
        ORDER BY metrics.total_points DESC, metrics.race_wins DESC, metrics.race_podiums DESC
    ) AS championship_position,
    lineup.drivers_lineup,
    COALESCE(lineup.drivers_used_count, 0) AS drivers_used_count
FROM
    team_season_metrics AS metrics
LEFT JOIN
    team_race_aggregates AS race_agg
    ON metrics.year = race_agg.year
    AND metrics.team_id = race_agg.team_id
LEFT JOIN
    team_season_drivers AS lineup
    ON metrics.year = lineup.year 
    AND metrics.team_id = lineup.team_id
LEFT JOIN
    season_fastest_laps AS fastest
    ON metrics.year = fastest.year
    AND metrics.team_id = fastest.team_id
LEFT JOIN
    completed_seasons AS completed
    ON metrics.year = completed.year
WHERE
    metrics.competitive_gps > 0