{{ config(materialized='view', schema='website') }}

WITH driver_session_laps AS (
    SELECT
        session_sk,
        driver_id,
        team_id,
        lap_time_seconds,
        MAX(stint) OVER(PARTITION BY session_sk, driver_id) - 1 AS stops,
        ROW_NUMBER() OVER(
            PARTITION BY session_sk, driver_id 
            ORDER BY lap_time_seconds ASC
        ) AS rn
    FROM
        {{ ref('fact_laps') }}
    WHERE
        lap_time_seconds IS NOT NULL
),

driver_session_fastest_lap AS (
    SELECT
        session_sk,
        driver_id,
        team_id,
        lap_time_seconds,
        GREATEST(stops, 0) AS stops
    FROM
        driver_session_laps
    WHERE
        rn = 1
)

SELECT
    year,
    round_number,
    country,
    location,
    official_event_name,
    session_name,
    driver_full_name,
    driver_number,
    driver_nationality,
    team_name,
    points,
    finishing_position,
    grid_position,
    grid_position - finishing_position AS delta_position,
    stops,
    TO_CHAR(MAKE_INTERVAL(secs => lap_time_seconds), 'FMMI:SS:MS') AS best_lap,
    status,
    laps_completed
FROM
    {{ ref('fact_results') }}
LEFT JOIN
    {{ ref('dim_sessions') }}
    USING(session_sk)
LEFT JOIN
    {{ ref('dim_drivers') }}
    USING(driver_id)
LEFT JOIN
    {{ ref('dim_constructors') }}
    USING(team_id)
LEFT JOIN
    {{ ref('dim_schedule') }}
    USING(event_sk)
LEFT JOIN
    {{ ref('dim_circuits') }}
    USING(circuit_sk)
LEFT JOIN
    driver_session_fastest_lap
    USING(session_sk, driver_id, team_id)