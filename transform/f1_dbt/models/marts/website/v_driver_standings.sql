{{ config(materialized='view', schema='website') }}

WITH latest_driver_team AS (
    SELECT
        year,
        driver_id,
        team_name,
        team_color
    FROM (
        SELECT
            year,
            driver_id,
            team_name,
            team_color,
            ROW_NUMBER() OVER (
                PARTITION BY year, driver_id 
                ORDER BY round_number DESC
            ) AS rn
        FROM {{ ref('fact_results') }}
        JOIN {{ ref('dim_sessions') }} 
            USING (session_sk)
        JOIN {{ ref('dim_schedule') }} 
            USING (event_sk)
        JOIN {{ ref('dim_constructors') }} 
            USING (team_id)
        WHERE 
            team_id IS NOT NULL
    ) ranked
    WHERE rn = 1
),

driver_standings AS (
    SELECT
        year,
        driver_id,
        driver_headshot_url,
        driver_full_name,
        driver_nationality,
        COUNT(
            CASE 
                WHEN finishing_position = 1 AND session_type = 'S' THEN 1 
            END
        ) AS sprint_wins,
        COUNT(
            CASE 
                WHEN finishing_position = 1 AND session_type = 'R' THEN 1 
            END
        ) AS race_wins,
        COUNT(
            CASE 
                WHEN finishing_position = 1 THEN 1 
            END
        ) AS total_wins,
        COUNT(
            CASE 
                WHEN finishing_position <= 3 AND session_type = 'S' THEN 1 
            END
        ) AS sprint_podiums,
        COUNT(
            CASE 
                WHEN finishing_position <= 3 AND session_type = 'R' THEN 1 
            END
        ) AS race_podiums,
        COUNT(
            CASE 
                WHEN finishing_position <= 3 THEN 1 
            END
        ) AS total_podiums,
        SUM(
            CASE 
                WHEN session_type = 'S' THEN points 
            END
        ) AS sprint_points,
        SUM(
            CASE 
                WHEN session_type = 'R' THEN points 
            END
        ) AS race_points,
        SUM(points) AS total_points
    FROM
        {{ ref('fact_results') }}
    LEFT JOIN
        {{ ref('dim_drivers') }}
        USING(driver_id)
    LEFT JOIN
        {{ ref('dim_sessions') }}
        USING(session_sk)
    LEFT JOIN
        {{ ref('dim_schedule') }}
        USING(event_sk)
    WHERE
        points IS NOT NULL
    GROUP BY
        year,
        driver_id,
        driver_full_name,
        driver_nationality,
        driver_headshot_url
)

SELECT
    standings.*,
    COALESCE(latest_team.team_name, 'F1 Team') AS team_name,
    latest_team.team_color,
    DENSE_RANK() OVER (
        PARTITION BY standings.year 
        ORDER BY standings.total_points DESC, standings.total_wins DESC, standings.total_podiums DESC
    ) AS championship_position
FROM
    driver_standings AS standings
LEFT JOIN
    latest_driver_team AS latest_team 
    ON standings.year = latest_team.year 
    AND standings.driver_id = latest_team.driver_id
