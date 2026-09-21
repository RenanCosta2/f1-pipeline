{{ config(materialized='view', schema='website') }}

WITH driver_standings AS (
    SELECT
        year,
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
        driver_full_name,
        driver_nationality,
        driver_headshot_url
)

SELECT
    *,
    DENSE_RANK() OVER (
        PARTITION BY year 
        ORDER BY total_points DESC, total_wins DESC, total_podiums DESC
    ) AS championship_position
FROM
    driver_standings