{{ config(materialized='view', schema='website') }}

WITH base_results AS (
    SELECT
        session_sk,
        year,
        round_number,
        official_event_name,
        session_number,
        session_name,
        team_id,
        team_name,
        team_color,
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
    WHERE
        points IS NOT NULL
    GROUP BY
        session_sk,
        year,
        round_number,
        official_event_name,
        session_number,
        session_name,
        team_id,
        team_name,
        team_color
)

SELECT
    year,
    round_number,
    official_event_name,
    session_name,
    team_name,
    team_color,
    points,
    
    SUM(points) OVER (
        PARTITION BY year, team_id 
        ORDER BY round_number, session_number
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_team_points

FROM 
    base_results