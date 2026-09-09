{{ config(materialized='table', schema='gold') }}

SELECT
    dim_sessions.session_sk,
    results.driver_id,
    results.team_id,
    results.driver_number,
    results.q1_time_seconds,
    results.q2_time_seconds,
    results.q3_time_seconds,
    results.total_time_seconds,
    results.classified_position,
    results.classification_status,
    results.grid_position,
    results.finishing_position,
    results.status,
    results.points,
    results.laps_completed
FROM
    {{ ref('stg_results') }} AS results
INNER JOIN
    {{ ref('dim_schedule') }} AS dim_schedule
    ON results.season_year = dim_schedule.year
    AND results.round_number = dim_schedule.round_number
INNER JOIN
    {{ ref('dim_sessions') }} AS dim_sessions
    ON dim_schedule.event_sk = dim_sessions.event_sk
    AND results.session_type = dim_sessions.session_type
