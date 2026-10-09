{{ config(materialized='view', schema='website') }}

WITH event_sessions_stats AS (
    SELECT
        dim_sessions.event_sk,
        COUNT(DISTINCT dim_sessions.session_sk) AS completed_sessions_count
    FROM {{ ref('dim_sessions') }}
    JOIN {{ ref('fact_results') }}
        ON dim_sessions.session_sk = fact_results.session_sk
    GROUP BY dim_sessions.event_sk
)

SELECT
    dim_schedule.year,
    dim_schedule.round_number,
    dim_schedule.event_sk,
    dim_schedule.official_event_name,
    dim_schedule.event_date,
    dim_schedule.circuit_sk,
    country,
    location,
    dim_circuits.event_name AS circuit_name,
    dim_sessions.session_sk AS race_session_sk,
    driver_id,
    driver_full_name AS winner_name,
    driver_abbreviation AS winner_code,
    driver_headshot_url AS winner_headshot_url,
    driver_number AS winner_number,
    team_id,
    team_name,
    team_color,
    laps_completed,
    total_time_seconds,
    CASE
        WHEN total_time_seconds IS NOT NULL THEN
            TO_CHAR(MAKE_INTERVAL(secs => total_time_seconds), 'FMHH24:MI:SS.MS')
        ELSE NULL
    END AS time_formatted,
    COALESCE(event_sessions_stats.completed_sessions_count, 0) AS completed_sessions_count,
    CASE
        WHEN fact_results.finishing_position = 1 THEN 'Completed'
        WHEN COALESCE(event_sessions_stats.completed_sessions_count, 0) > 0 THEN 'In Progress'
        ELSE 'Scheduled'
    END AS race_status
FROM 
    {{ ref('dim_schedule') }} 
JOIN 
    {{ ref('dim_circuits') }}  
    USING(circuit_sk)
LEFT JOIN 
    event_sessions_stats
    ON event_sessions_stats.event_sk = dim_schedule.event_sk
LEFT JOIN 
    {{ ref('dim_sessions') }} 
    ON dim_sessions.event_sk = dim_schedule.event_sk
    AND dim_sessions.session_name = 'Race'
LEFT JOIN 
    {{ ref('fact_results') }} 
    ON dim_sessions.session_sk = fact_results.session_sk
    AND fact_results.finishing_position = 1
LEFT JOIN 
    {{ ref('dim_drivers') }} 
    USING(driver_id)
LEFT JOIN 
    {{ ref('dim_constructors') }} 
    USING(team_id)
WHERE 
    round_number > 0
ORDER BY 
    year, 
    round_number
