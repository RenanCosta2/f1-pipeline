{{ config(materialized='view', schema='website') }}

SELECT
    year,
    round_number,
    official_event_name,
    session_name,
    driver_full_name,
    team_name,
    AVG(lap_time_seconds) AS avg_lap_time_seconds,
    TO_CHAR(MAKE_INTERVAL(secs => AVG(lap_time_seconds)), 'FMMI:SS:MS') AS lap_pace,
    STDDEV(lap_time_seconds) AS pace_stddev
FROM
    {{ ref('fact_laps') }}
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
    session_type IN ('S', 'R')
    AND is_all_track_clear IS TRUE
    AND pit_in_time_seconds IS NULL
    AND pit_out_time_seconds IS NULL
    AND is_accurate IS TRUE
GROUP BY
    year,
    round_number,
    official_event_name,
    session_name,
    driver_full_name,
    team_name