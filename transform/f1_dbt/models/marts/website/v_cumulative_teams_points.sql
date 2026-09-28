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
        team_id,
        team_name,
        team_color,
        COUNT(CASE WHEN finishing_position = 1 AND session_name = 'Race' THEN 1 END) AS race_wins,
        COUNT(CASE WHEN finishing_position = 1 AND session_name = 'Sprint' THEN 1 END) AS sprint_wins,
        COUNT(CASE WHEN finishing_position <= 3 AND session_name = 'Race' THEN 1 END) AS race_podiums,
        COUNT(CASE WHEN finishing_position <= 3 AND session_name = 'Sprint' THEN 1 END) AS sprint_podiums,
        COUNT(CASE WHEN finishing_position = 1 THEN 1 END) AS wins,
        COUNT(CASE WHEN finishing_position <= 3 THEN 1 END) AS podiums,
        SUM(points) AS points
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
    GROUP BY
        session_sk,
        year,
        round_number,
        country,
        location,
        official_event_name,
        event_name,
        session_number,
        session_name,
        team_id,
        team_name,
        team_color
)

SELECT
    year,
    round_number,
    country,
    location,
    official_event_name,
    event_name,
    session_name,
    team_name,
    team_color,
    race_wins,
    sprint_wins,
    race_podiums,
    sprint_podiums,
    wins,
    podiums,
    points,
    
    SUM(points) OVER (
        PARTITION BY year, team_id 
        ORDER BY round_number, session_number
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_team_points

FROM 
    base_results