{{ config(materialized='view', schema='website') }}

SELECT
    year,
    round_number,
    official_event_name,
    session_name,
    driver_full_name,
    driver_abbreviation,
    team_name,
    team_color,
    lap_number,
    sector_1_time_seconds,
    sector_2_time_seconds,
    sector_3_time_seconds,
    lap_time_seconds,
    TO_CHAR(MAKE_INTERVAL(secs => lap_time_seconds), 'FMMI:SS:MS') AS lap_time,
    compound,
    tyre_life,
    track_status_description,
    position
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