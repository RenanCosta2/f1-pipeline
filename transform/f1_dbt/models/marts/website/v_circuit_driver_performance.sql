{{ config(materialized='view', schema='website') }}

WITH race_fastest_laps AS (
    SELECT 
        schedule.circuit_id,
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
        schedule.circuit_id,
        sessions.event_sk, 
        laps.driver_id
),

driver_circuit_fastest_laps AS (
    SELECT
        circuit_id,
        driver_id,
        COUNT(CASE WHEN lap_rank = 1 THEN 1 END) AS fastest_laps
    FROM
        race_fastest_laps
    GROUP BY
        circuit_id,
        driver_id
),

driver_circuit_metrics AS (
    SELECT
        schedule.circuit_id,
        drivers.driver_id,
        drivers.broadcast_name,
        drivers.driver_abbreviation,
        drivers.driver_full_name,
        drivers.driver_nationality,
        drivers.driver_headshot_url,

        -- Participações no Circuito
        COUNT(DISTINCT CASE WHEN sessions.session_name = 'Race' THEN schedule.event_sk END) AS total_gps,
        MIN(schedule.year) AS first_year,
        MAX(schedule.year) AS last_year,

        -- Vitórias
        COUNT(CASE WHEN results.finishing_position = 1 AND sessions.session_name = 'Race' THEN 1 END) AS race_wins,
        COUNT(CASE WHEN results.finishing_position = 1 AND sessions.session_name = 'Sprint' THEN 1 END) AS sprint_wins,
        COUNT(CASE WHEN results.finishing_position = 1 THEN 1 END) AS total_wins,

        -- Pódios
        COUNT(CASE WHEN results.finishing_position <= 3 AND sessions.session_name = 'Race' THEN 1 END) AS race_podiums,
        COUNT(CASE WHEN results.finishing_position <= 3 AND sessions.session_name = 'Sprint' THEN 1 END) AS sprint_podiums,
        COUNT(CASE WHEN results.finishing_position <= 3 THEN 1 END) AS total_podiums,

        -- Pole Positions
        COUNT(CASE WHEN results.grid_position = 1 AND sessions.session_name = 'Race' THEN 1 END) AS race_poles,
        COUNT(CASE WHEN results.grid_position = 1 AND sessions.session_name = 'Sprint' THEN 1 END) AS sprint_poles,

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
    WHERE
        sessions.session_name IN ('Race', 'Sprint')
    GROUP BY
        schedule.circuit_id,
        drivers.driver_id,
        drivers.broadcast_name,
        drivers.driver_abbreviation,
        drivers.driver_full_name,
        drivers.driver_nationality,
        drivers.driver_headshot_url
)

SELECT
    -- Informações do Circuito
    circuits.circuit_id,
    circuits.circuit_name,
    circuits.location,
    circuits.country,
    circuits.track_type,

    -- Informações do Piloto
    metrics.driver_id,
    metrics.broadcast_name,
    metrics.driver_abbreviation,
    metrics.driver_full_name,
    metrics.driver_nationality,
    metrics.driver_headshot_url,

    -- Estatísticas Agregadas no Circuito
    metrics.total_gps,
    metrics.first_year,
    metrics.last_year,
    metrics.total_wins,
    metrics.race_wins,
    metrics.sprint_wins,
    metrics.total_podiums,
    metrics.race_podiums,
    metrics.sprint_podiums,
    metrics.race_poles,
    metrics.sprint_poles,
    COALESCE(fastest.fastest_laps, 0) AS total_fastest_laps,
    metrics.total_points,
    metrics.race_points,
    metrics.sprint_points,
    metrics.best_finish_position,
    metrics.best_grid_position,
    metrics.total_dnfs
FROM
    driver_circuit_metrics AS metrics
JOIN
    {{ ref('dim_circuits') }} AS circuits 
    USING (circuit_id)
LEFT JOIN
    driver_circuit_fastest_laps AS fastest
    ON metrics.circuit_id = fastest.circuit_id
    AND metrics.driver_id = fastest.driver_id
ORDER BY
    circuits.circuit_name ASC,
    metrics.total_wins DESC,
    metrics.total_podiums DESC,
    metrics.total_points DESC
