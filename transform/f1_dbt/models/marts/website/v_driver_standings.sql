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

driver_race_points_ranked AS (
    SELECT
        year,
        driver_id,
        SUM(COALESCE(points, 0)) AS event_points,
        ROW_NUMBER() OVER (
            PARTITION BY year, driver_id
            ORDER BY SUM(COALESCE(points, 0)) DESC
        ) AS event_points_rank
    FROM 
        {{ ref('fact_results') }}
    JOIN 
        {{ ref('dim_sessions') }} 
        USING (session_sk)
    JOIN 
        {{ ref('dim_schedule') }} 
        USING (event_sk)
    WHERE 
        session_name IN ('Race', 'Sprint')
    GROUP BY
        year,
        event_sk,
        driver_id
),

driver_valid_championship_points AS (
    SELECT
        year,
        driver_id,
        SUM(CASE
            WHEN year BETWEEN 1950 AND 1953 THEN IF(event_points_rank <= 4, event_points, 0)
            WHEN year IN (1954, 1955, 1956, 1957, 1959, 1961, 1962, 1966) THEN IF(event_points_rank <= 5, event_points, 0)
            WHEN year IN (1958, 1960, 1963, 1964, 1965) THEN IF(event_points_rank <= 6, event_points, 0)
            WHEN year BETWEEN 1981 AND 1990 THEN IF(event_points_rank <= 11, event_points, 0)
            ELSE event_points
        END) AS valid_points
    FROM
        driver_race_points_ranked
    GROUP BY
        year,
        driver_id
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
        ORDER BY 
            CASE 
                WHEN standings.year = 1997 AND standings.driver_id = 'michael_schumacher' THEN -1
                ELSE COALESCE(valid_pts.valid_points, standings.total_points)
            END DESC, 
            standings.total_wins DESC, 
            standings.total_podiums DESC
    ) AS championship_position
FROM
    driver_standings AS standings
LEFT JOIN
    latest_driver_team AS latest_team 
    ON standings.year = latest_team.year 
    AND standings.driver_id = latest_team.driver_id
LEFT JOIN
    driver_valid_championship_points AS valid_pts
    ON standings.year = valid_pts.year
    AND standings.driver_id = valid_pts.driver_id
