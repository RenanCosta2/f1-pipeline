{{ config(materialized='view', schema='website') }}

WITH base_results AS (
    SELECT
        session_sk,
        year,
        round_number,
        country,
        location,
        official_event_name,
        event_name,
        session_number,
        session_name,
        driver_id,
        driver_full_name,
        team_id,
        team_name,
        team_color,
        finishing_position,
        points
    FROM
        {{ ref('fact_results') }}
    LEFT JOIN
        {{ ref('dim_drivers') }}
        USING(driver_id)
    LEFT JOIN
        {{ ref('dim_constructors') }}
        USING(team_id)
    LEFT JOIN
        {{ ref('dim_sessions') }}
        USING(session_sk)
    LEFT JOIN
        {{ ref('dim_schedule') }}
        USING(event_sk)
    LEFT JOIN
        {{ ref('dim_circuits') }}
        USING(circuit_sk)
    WHERE
        points IS NOT NULL
)

SELECT
    year,
    round_number,
    country,
    location,
    official_event_name,
    event_name,
    session_name,
    driver_full_name,
    team_name,
    team_color,
    finishing_position,
    CASE WHEN finishing_position = 1 AND session_name = 'Race' THEN 1 ELSE 0 END AS is_race_win,
    CASE WHEN finishing_position = 1 AND session_name = 'Sprint' THEN 1 ELSE 0 END AS is_sprint_win,
    CASE WHEN finishing_position <= 3 AND session_name = 'Race' THEN 1 ELSE 0 END AS is_race_podium,
    CASE WHEN finishing_position <= 3 AND session_name = 'Sprint' THEN 1 ELSE 0 END AS is_sprint_podium,
    CASE WHEN finishing_position = 1 THEN 1 ELSE 0 END AS is_win,
    CASE WHEN finishing_position <= 3 THEN 1 ELSE 0 END AS is_podium,
    points,
    
    SUM(points) OVER (
        PARTITION BY year, driver_id 
        ORDER BY round_number, session_number
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_driver_points

FROM 
    base_results
