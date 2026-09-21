{{ config(materialized='view', schema='website') }}

SELECT
    year,
    round_number,
    official_event_name,
    session_name,
    driver_full_name,
    team_name,
    stint,
    compound,
    MIN(lap_number) AS lap_start,
    MAX(lap_number) AS lap_end,
    COUNT(lap_number) AS stint_laps_completed,
    TO_CHAR(MAKE_INTERVAL(secs => AVG(lap_time_seconds)), 'FMMI:SS:MS') AS stint_avg_lap_time,
    BOOL_OR(pit_in_time_seconds IS NOT NULL AND has_safety_car IS TRUE) AS pit_under_safety_car,
    BOOL_OR(pit_in_time_seconds IS NOT NULL AND has_vsc IS TRUE) AS pit_under_vsc,
    BOOL_OR(pit_in_time_seconds IS NOT NULL AND has_red_flag IS TRUE) AS pit_under_red_flag
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
GROUP BY
    year,
    round_number,
    official_event_name,
    session_name,
    driver_full_name,
    team_name,
    stint,
    compound
