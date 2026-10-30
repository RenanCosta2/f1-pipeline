{{ config(materialized='view', schema='website') }}

WITH event_sessions_stats AS (
    SELECT 
        sessions.event_sk,
        COUNT(DISTINCT sessions.session_sk) AS completed_sessions_count,
        
        COUNT(CASE 
            WHEN sessions.session_name = 'Race' 
             AND results.status NOT IN ('Finished', 'Lapped') 
             AND results.status NOT LIKE '+%' 
            THEN 1 
        END) AS total_dnfs,

        LOGICAL_OR(sessions.session_name = 'Race' AND results.finishing_position = 1) AS is_race_completed

    FROM 
        {{ ref('dim_sessions') }} AS sessions
    JOIN 
        {{ ref('fact_results') }} AS results
        USING (session_sk)
    GROUP BY 
        sessions.event_sk
),

event_sessions_schedule AS (
    SELECT
        event_sk,
        TO_JSON_STRING(
            ARRAY_AGG(
                STRUCT(
                    session_number,
                    session_name,
                    session_type,
                    FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', session_date_utc) AS session_date_utc,
                    FORMAT_DATETIME('%Y-%m-%dT%H:%M:%S', session_date_brt) AS session_date_brt
                )
                ORDER BY session_number ASC
            )
        ) AS sessions_schedule
    FROM
        {{ ref('dim_sessions') }}
    GROUP BY
        event_sk
),

race_winners AS (
    SELECT
        sessions.event_sk,
        drivers.driver_id AS race_winner_driver_id,
        drivers.driver_full_name AS race_winner_driver,
        drivers.driver_abbreviation AS race_winner_code,
        drivers.driver_headshot_url AS race_winner_headshot_url,
        results.driver_number AS race_winner_number,
        constructors.team_id AS race_winner_team_id,
        constructors.team_name AS race_winner_team,
        constructors.team_color AS race_winner_team_color,
        results.laps_completed AS race_laps_completed,
        results.total_time_seconds AS race_total_time_seconds,
        {{ format_race_time('total_time_seconds') }} AS race_time_formatted
    FROM 
        {{ ref('fact_results') }} AS results
    JOIN
        {{ ref('dim_sessions') }} AS sessions 
        USING (session_sk)
    JOIN 
        {{ ref('dim_drivers') }} AS drivers 
        USING (driver_id)
    JOIN
        {{ ref('dim_constructors') }} AS constructors
        USING (team_id)
    WHERE
        sessions.session_name = 'Race'
        AND results.finishing_position = 1
),

sprint_winners AS (
    SELECT
        sessions.event_sk,
        drivers.driver_id AS sprint_winner_driver_id,
        drivers.driver_full_name AS sprint_winner_driver,
        drivers.driver_abbreviation AS sprint_winner_code,
        drivers.driver_headshot_url AS sprint_winner_headshot_url,
        results.driver_number AS sprint_winner_number,
        constructors.team_id AS sprint_winner_team_id,
        constructors.team_name AS sprint_winner_team,
        constructors.team_color AS sprint_winner_team_color,
        results.laps_completed AS sprint_laps_completed,
        results.total_time_seconds AS sprint_total_time_seconds,
        {{ format_race_time('total_time_seconds') }} AS sprint_time_formatted
    FROM 
        {{ ref('fact_results') }} AS results
    JOIN
        {{ ref('dim_sessions') }} AS sessions 
        USING (session_sk)
    JOIN 
        {{ ref('dim_drivers') }} AS drivers 
        USING (driver_id)
    JOIN
        {{ ref('dim_constructors') }} AS constructors
        USING (team_id)
    WHERE
        sessions.session_name = 'Sprint'
        AND results.finishing_position = 1
),

poles AS (
    SELECT
        sessions.event_sk,
        drivers.driver_full_name AS pole_driver,
        constructors.team_name AS pole_team
    FROM 
        {{ ref('fact_results') }} AS results
    JOIN
        {{ ref('dim_sessions') }} AS sessions 
        USING (session_sk)
    JOIN 
        {{ ref('dim_drivers') }} AS drivers 
        USING (driver_id)
    JOIN
        {{ ref('dim_constructors') }} AS constructors
        USING (team_id)
    WHERE
        sessions.session_name = 'Qualifying'
        AND results.finishing_position = 1
    GROUP BY
        sessions.event_sk,
        drivers.driver_full_name,
        constructors.team_name
),

fastest_laps AS (
    SELECT
        sessions.event_sk,
        drivers.driver_id AS fastest_lap_driver_id,
        drivers.driver_full_name AS fastest_lap_driver,
        drivers.driver_abbreviation AS fastest_lap_code,
        drivers.driver_headshot_url AS fastest_lap_headshot_url,
        constructors.team_name AS fastest_lap_team,
        constructors.team_color AS fastest_lap_team_color,
        laps.lap_time_seconds AS fastest_lap_time_seconds,
        {{ format_lap_time('laps.lap_time_seconds') }} AS fastest_lap_time_formatted
    FROM 
        {{ ref('fact_laps') }} AS laps
    JOIN 
        {{ ref('dim_sessions') }} AS sessions 
        USING (session_sk)
    JOIN 
        {{ ref('dim_drivers') }} AS drivers 
        USING (driver_id)
    JOIN 
        {{ ref('dim_constructors') }} AS constructors 
        USING (team_id)
    WHERE 
        sessions.session_name = 'Race' 
        AND laps.lap_time_seconds IS NOT NULL
        AND laps.lap_time_seconds > 0
    QUALIFY ROW_NUMBER() OVER (PARTITION BY sessions.event_sk ORDER BY laps.lap_time_seconds ASC) = 1
)

SELECT
    schedule.year,
    schedule.round_number,
    schedule.event_sk,
    schedule.circuit_id,
    circuits.circuit_name,
    circuits.country,
    circuits.location,
    circuits.track_type,
    schedule.official_event_name,
    schedule.event_date,
    sessions_schedule.sessions_schedule,

    pole_driver,
    pole_team,
    
    race_winner_driver_id,
    race_winner_driver,
    race_winner_code,
    race_winner_headshot_url,
    race_winner_number,
    race_winner_team_id,
    race_winner_team,
    race_winner_team_color,
    race_laps_completed,
    race_total_time_seconds,
    race_time_formatted,

    fastest_lap_driver_id,
    fastest_lap_driver,
    fastest_lap_code,
    fastest_lap_headshot_url,
    fastest_lap_team,
    fastest_lap_team_color,
    fastest_lap_time_seconds,
    fastest_lap_time_formatted,

    sprint_winner_driver_id,
    sprint_winner_driver,
    sprint_winner_code,
    sprint_winner_headshot_url,
    sprint_winner_number,
    sprint_winner_team_id,
    sprint_winner_team,
    sprint_winner_team_color,
    sprint_laps_completed,
    sprint_total_time_seconds,
    sprint_time_formatted,

    COALESCE(stats.total_dnfs, 0) AS total_dnfs,
    COALESCE(stats.completed_sessions_count, 0) AS completed_sessions_count,
    CASE
        WHEN stats.is_race_completed THEN 'Completed'
        WHEN COALESCE(stats.completed_sessions_count, 0) > 0 THEN 'In Progress'
        ELSE 'Scheduled'
    END AS race_status

FROM
    {{ ref('dim_schedule') }} AS schedule
JOIN
    {{ ref('dim_circuits') }} AS circuits
    USING(circuit_id)
LEFT JOIN 
    event_sessions_stats AS stats 
    ON stats.event_sk = schedule.event_sk
LEFT JOIN
    event_sessions_schedule AS sessions_schedule
    ON sessions_schedule.event_sk = schedule.event_sk
LEFT JOIN
    race_winners
    ON race_winners.event_sk = schedule.event_sk
LEFT JOIN
    sprint_winners
    ON sprint_winners.event_sk = schedule.event_sk
LEFT JOIN
    poles
    ON poles.event_sk = schedule.event_sk
LEFT JOIN
    fastest_laps
    ON fastest_laps.event_sk = schedule.event_sk
WHERE 
    round_number > 0
ORDER BY
    schedule.year DESC,
    schedule.round_number ASC
