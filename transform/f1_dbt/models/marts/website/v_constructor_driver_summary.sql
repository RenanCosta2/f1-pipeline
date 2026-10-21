{{ config(materialized='view', schema='website') }}

WITH driver_team_race_metrics AS (
    SELECT
        results.team_id,
        results.driver_id,
        COUNT(DISTINCT schedule.year) AS seasons_count,
        MIN(schedule.year) AS first_season,
        MAX(schedule.year) AS last_season,
        STRING_AGG(DISTINCT schedule.year::TEXT, ', ' ORDER BY schedule.year::TEXT ASC) AS seasons_list,

        -- Participações
        COUNT(DISTINCT CASE WHEN sessions.session_name = 'Race' THEN sessions.event_sk END) AS gps_raced,
        COUNT(DISTINCT CASE 
            WHEN sessions.session_name IN ('Race', 'Sprint', 'Qualifying', 'Sprint Qualifying', 'Sprint Shootout') 
            THEN sessions.event_sk 
        END) AS competitive_gps,

        -- Vitórias
        COUNT(CASE WHEN sessions.session_name = 'Race' AND results.finishing_position = 1 THEN 1 END) AS race_wins,
        COUNT(CASE WHEN sessions.session_name = 'Sprint' AND results.finishing_position = 1 THEN 1 END) AS sprint_wins,
        COUNT(CASE WHEN (sessions.session_name = 'Race' OR sessions.session_name = 'Sprint') AND results.finishing_position = 1 THEN 1 END) AS total_wins,

        -- Pole Positions
        COUNT(CASE WHEN sessions.session_name = 'Qualifying' AND results.grid_position = 1 THEN 1 END) AS race_poles,
        COUNT(CASE WHEN sessions.session_name = 'Sprint' AND results.grid_position = 1 THEN 1 END) AS sprint_poles,

        -- Pódios
        COUNT(CASE WHEN sessions.session_name = 'Race' AND results.finishing_position <= 3 THEN 1 END) AS race_podiums,
        COUNT(CASE WHEN sessions.session_name = 'Sprint' AND results.finishing_position <= 3 THEN 1 END) AS sprint_podiums,
        COUNT(CASE WHEN (sessions.session_name = 'Race' OR sessions.session_name = 'Sprint') AND results.finishing_position <= 3 THEN 1 END) AS total_podiums,

        -- Pontos
        COUNT(CASE WHEN sessions.session_name = 'Race' AND results.finishing_position <= 10 THEN 1 END) AS points_finishes,
        SUM(CASE WHEN sessions.session_name = 'Race' THEN COALESCE(results.points, 0) ELSE 0 END) AS race_points,
        SUM(CASE WHEN sessions.session_name = 'Sprint' THEN COALESCE(results.points, 0) ELSE 0 END) AS sprint_points,
        SUM(COALESCE(results.points, 0)) AS total_points,

        -- Melhores Resultados
        MIN(CASE WHEN sessions.session_name = 'Race' THEN results.finishing_position END) AS best_finish_position,
        MIN(CASE WHEN sessions.session_name = 'Race' THEN results.grid_position END) AS best_grid_position,

        -- Abandonos (DNFs)
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
        ON results.session_sk = sessions.session_sk
    JOIN 
        {{ ref('dim_schedule') }} AS schedule 
        ON sessions.event_sk = schedule.event_sk
    WHERE 
        results.team_id IS NOT NULL
    GROUP BY 
        results.team_id,
        results.driver_id
),

-- Voltas mais rápidas do piloto correndo pela equipe
driver_team_fastest_laps AS (
    SELECT 
        race_results.team_id,
        ranked_laps.driver_id,
        COUNT(*) AS fastest_laps
    FROM (
        SELECT 
            sessions.session_sk,
            laps.driver_id,
            ROW_NUMBER() OVER (
                PARTITION BY sessions.event_sk 
                ORDER BY laps.lap_time_seconds ASC
            ) AS fastest_lap_rank
        FROM 
            {{ ref('fact_laps') }} AS laps
        JOIN 
            {{ ref('dim_sessions') }} AS sessions 
            ON laps.session_sk = sessions.session_sk
        WHERE 
            sessions.session_name = 'Race'
            AND laps.lap_time_seconds IS NOT NULL
    ) AS ranked_laps
    JOIN 
        {{ ref('fact_results') }} AS race_results 
        ON ranked_laps.session_sk = race_results.session_sk 
        AND ranked_laps.driver_id = race_results.driver_id
    WHERE 
        ranked_laps.fastest_lap_rank = 1
        AND race_results.team_id IS NOT NULL
    GROUP BY 
        race_results.team_id,
        ranked_laps.driver_id
),

-- Títulos mundiais de piloto conquistados correndo por esta equipe
driver_team_titles AS (
    SELECT
        driver_season_summary.team_id,
        driver_season_summary.driver_id,
        COUNT(CASE WHEN driver_season_summary.championship_position = 1 AND driver_season_summary.is_season_completed THEN 1 END) AS driver_titles_with_team
    FROM
        {{ ref('v_driver_season_summary') }} AS driver_season_summary
    WHERE
        driver_season_summary.team_id IS NOT NULL
    GROUP BY
        driver_season_summary.team_id,
        driver_season_summary.driver_id
)

SELECT
    driver_metrics.team_id,
    constructors.team_name,
    constructors.team_color,
    driver_metrics.driver_id,
    drivers.broadcast_name,
    drivers.driver_abbreviation,
    drivers.driver_full_name,
    drivers.driver_nationality,
    drivers.driver_headshot_url,

    -- Temporadas e Corridas
    driver_metrics.seasons_count,
    driver_metrics.first_season,
    driver_metrics.last_season,
    driver_metrics.seasons_list,
    driver_metrics.gps_raced,
    driver_metrics.competitive_gps,

    -- Títulos e Vitórias
    COALESCE(driver_titles.driver_titles_with_team, 0) AS driver_titles_with_team,
    driver_metrics.race_wins,
    driver_metrics.sprint_wins,
    driver_metrics.total_wins,

    -- Poles
    driver_metrics.race_poles,
    driver_metrics.sprint_poles,

    -- Pódios e Pontos
    driver_metrics.race_podiums,
    driver_metrics.sprint_podiums,
    driver_metrics.total_podiums,
    COALESCE(driver_fastest_laps.fastest_laps, 0) AS fastest_laps,
    driver_metrics.points_finishes,
    driver_metrics.race_points,
    driver_metrics.sprint_points,
    driver_metrics.total_points,

    -- Melhores Posições e Abandonos
    driver_metrics.best_finish_position,
    driver_metrics.best_grid_position,
    driver_metrics.total_dnfs,

    -- Rankings do Piloto dentro da História da Equipe
    DENSE_RANK() OVER (PARTITION BY driver_metrics.team_id ORDER BY driver_metrics.total_points DESC, driver_metrics.total_wins DESC) AS rank_in_team_points,
    DENSE_RANK() OVER (PARTITION BY driver_metrics.team_id ORDER BY driver_metrics.race_wins DESC, driver_metrics.total_points DESC) AS rank_in_team_wins,
    DENSE_RANK() OVER (PARTITION BY driver_metrics.team_id ORDER BY driver_metrics.gps_raced DESC) AS rank_in_team_gps,
    DENSE_RANK() OVER (PARTITION BY driver_metrics.team_id ORDER BY COALESCE(driver_titles.driver_titles_with_team, 0) DESC, driver_metrics.total_wins DESC) AS rank_in_team_titles
FROM
    driver_team_race_metrics AS driver_metrics
JOIN
    {{ ref('dim_constructors') }} AS constructors 
    ON driver_metrics.team_id = constructors.team_id
JOIN
    {{ ref('dim_drivers') }} AS drivers 
    ON driver_metrics.driver_id = drivers.driver_id
LEFT JOIN
    driver_team_fastest_laps AS driver_fastest_laps
    ON driver_metrics.team_id = driver_fastest_laps.team_id
    AND driver_metrics.driver_id = driver_fastest_laps.driver_id
LEFT JOIN
    driver_team_titles AS driver_titles
    ON driver_metrics.team_id = driver_titles.team_id
    AND driver_metrics.driver_id = driver_titles.driver_id
ORDER BY
    driver_metrics.team_id,
    driver_metrics.total_points DESC

