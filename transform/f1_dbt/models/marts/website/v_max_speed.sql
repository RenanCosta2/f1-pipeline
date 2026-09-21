{{ config(materialized='view', schema='website') }}

SELECT
    year,
    round_number,
    official_event_name,
    session_name,
    driver_full_name,
    team_name,
    MAX(speed_trap) AS max_speed_trap,
    MAX(speed_int_p1) AS max_speed_i1,
    MAX(speed_int_p2) AS max_speed_i2,
    MAX(speed_finish_line) AS max_speed_fl
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
GROUP BY
    year,
    round_number,
    official_event_name,
    session_name,
    driver_full_name,
    team_name