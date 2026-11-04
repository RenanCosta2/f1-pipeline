{{ config(materialized='view', schema='website') }}

WITH team_race_points AS (
    SELECT
        year,
        team_id,
        event_sk,
        MAX(COALESCE(points, 0)) AS best_car_race_points,
        ROW_NUMBER() OVER (
            PARTITION BY year, team_id
            ORDER BY MAX(COALESCE(points, 0)) DESC
        ) AS best_car_race_rank
    FROM
        {{ ref('fact_results') }}
    JOIN
        {{ ref('dim_sessions') }}
        USING(session_sk)
    JOIN
        {{ ref('dim_schedule') }}
        USING(event_sk)
    WHERE
        session_name = 'Race'
        AND team_id IS NOT NULL
    GROUP BY
        year,
        team_id,
        event_sk
),

team_valid_points AS (
    SELECT
        year,
        team_id,
        SUM(CASE WHEN best_car_race_rank <= 6 THEN best_car_race_points ELSE 0 END) AS top_6_best_car_points,
        SUM(best_car_race_points) AS total_best_car_points
    FROM
        team_race_points
    GROUP BY
        year,
        team_id
),

constructor_standings AS (
    SELECT
        year,
        team_id,
        team_name,
        team_color,
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
        AND team_name IS NOT NULL
    GROUP BY
        year,
        team_id,
        team_name,
        team_color
)

SELECT
    standings.year,
    standings.team_name,
    standings.team_color,
    standings.sprint_wins,
    standings.race_wins,
    standings.total_wins,
    standings.sprint_podiums,
    standings.race_podiums,
    standings.total_podiums,
    standings.sprint_points,
    standings.race_points,
    standings.total_points,
    DENSE_RANK() OVER (
        PARTITION BY standings.year 
        ORDER BY 
            CASE
                WHEN standings.year = 2007 AND standings.team_id = 'mclaren' THEN -1
                WHEN standings.year BETWEEN 1958 AND 1965 THEN COALESCE(valid_pts.top_6_best_car_points, 0)
                WHEN standings.year BETWEEN 1966 AND 1978 THEN COALESCE(valid_pts.total_best_car_points, 0)
                ELSE standings.total_points
            END DESC, 
            standings.total_wins DESC, 
            standings.total_podiums DESC
    ) AS championship_position
FROM
    constructor_standings AS standings
LEFT JOIN
    team_valid_points AS valid_pts
    ON standings.year = valid_pts.year
    AND standings.team_id = valid_pts.team_id
