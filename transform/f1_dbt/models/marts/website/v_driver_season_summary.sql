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

latest_driver_team AS (
    SELECT
        year,
        driver_id,
        team_name,
        team_color
    FROM (
        SELECT
            schedule.year,
            results.driver_id,
            teams.team_name,
            teams.team_color,
            ROW_NUMBER() OVER (
                PARTITION BY schedule.year, results.driver_id 
                ORDER BY schedule.round_number DESC
            ) AS rn
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
        WHERE 
            results.team_id IS NOT NULL
    ) ranked
    WHERE 
        rn = 1
),

race_fastest_laps AS (
    SELECT 
        schedule.year,
        sessions.event_sk,
        laps.driver_id,
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
        laps.driver_id
),

season_fastest_laps AS (
    SELECT
        year,
        driver_id,
        COUNT(CASE WHEN lap_rank = 1 THEN 1 END) AS fastest_laps
    FROM
        race_fastest_laps
    GROUP BY
        year,
        driver_id
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

driver_season_metrics AS (
    SELECT
        schedule.year,
        drivers.driver_id,
        drivers.broadcast_name,
        drivers.driver_abbreviation,
        drivers.driver_full_name,
        drivers.driver_nationality,
        drivers.driver_headshot_url,

        -- Participações na Temporada
        COUNT(DISTINCT CASE WHEN sessions.session_name = 'Race' THEN schedule.event_sk END) AS total_gps,
        COUNT(DISTINCT CASE 
            WHEN sessions.session_name IN ('Race', 'Sprint', 'Qualifying', 'Sprint Qualifying', 'Sprint Shootout') 
            THEN schedule.event_sk 
        END) AS competitive_gps,

        -- Vitórias
        COUNT(CASE WHEN results.finishing_position = 1 AND sessions.session_name = 'Race' THEN 1 END) AS race_wins,
        COUNT(CASE WHEN results.finishing_position = 1 AND sessions.session_name = 'Sprint' THEN 1 END) AS sprint_wins,

        -- Pole Positions
        COUNT(CASE WHEN results.grid_position = 1 AND sessions.session_name = 'Race' THEN 1 END) AS race_poles,
        COUNT(CASE WHEN results.grid_position = 1 AND sessions.session_name = 'Sprint' THEN 1 END) AS sprint_poles,
        
        COUNT(CASE WHEN results.finishing_position = 1 AND sessions.session_name IN ('Race', 'Sprint') THEN 1 END) AS total_wins,
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

        -- Aparições nas qualis
        COUNT(CASE WHEN sessions.session_name = 'Qualifying' AND results.finishing_position <= quali.q2_cutoff THEN 1 END ) AS q2_appearences,
        COUNT(CASE WHEN sessions.session_name = 'Qualifying' AND results.finishing_position <= 10 THEN 1 END) AS q3_appearences,

        -- Pontos
        SUM(CASE WHEN sessions.session_name = 'Race' THEN results.points ELSE 0 END) AS race_points,
        SUM(CASE WHEN sessions.session_name = 'Sprint' THEN results.points ELSE 0 END) AS sprint_points,
        SUM(COALESCE(results.points, 0)) AS total_points,

        -- Melhores Resultados
        MIN(CASE WHEN sessions.session_name = 'Race' AND results.finishing_position > 0 THEN results.finishing_position END) AS best_finish_position,
        MIN(CASE WHEN sessions.session_name = 'Race' AND results.grid_position > 0 THEN results.grid_position END) AS best_grid_position,

        -- Abandonos (DNFs reais)
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
        {{ ref('dim_drivers') }} AS drivers 
        USING (driver_id)
    LEFT JOIN
        qualifying_sessions AS quali
        USING (session_sk)
    GROUP BY
        schedule.year,
        drivers.driver_id,
        drivers.broadcast_name,
        drivers.driver_abbreviation,
        drivers.driver_full_name,
        drivers.driver_nationality,
        drivers.driver_headshot_url
)

SELECT
    metrics.*,
    COALESCE(fastest.fastest_laps, 0) AS fastest_laps,
    CASE 
        WHEN poles_to_win > 0 
        THEN ROUND((poles_to_win::NUMERIC / NULLIF(race_poles, 0)) * 100, 2) 
    END AS pole_to_win_rate,
    CASE WHEN completed.year IS NOT NULL THEN TRUE ELSE FALSE END AS is_season_completed,
    DENSE_RANK() OVER (
        PARTITION BY metrics.year 
        ORDER BY metrics.total_points DESC, metrics.race_wins DESC, metrics.race_podiums DESC
    ) AS championship_position,
    COALESCE(latest_team.team_name, 'F1 Team') AS team_name,
    latest_team.team_color
FROM
    driver_season_metrics AS metrics
LEFT JOIN
    latest_driver_team AS latest_team
    ON metrics.year = latest_team.year 
    AND metrics.driver_id = latest_team.driver_id
LEFT JOIN
    season_fastest_laps AS fastest
    ON metrics.year = fastest.year
    AND metrics.driver_id = fastest.driver_id
LEFT JOIN
    completed_seasons AS completed
    ON metrics.year = completed.year
