{{ config(materialized='table', schema='gold') }}

SELECT
    dim_sessions.session_sk,
    results.driver_id,
    results.team_id,
    laps.driver_number,
    laps.session_time_seconds,
    laps.lap_time_seconds,
    laps.lap_number,
    laps.stint,
    laps.pit_out_time_seconds,
    laps.pit_in_time_seconds,
    laps.sector_1_time_seconds,
    laps.sector_2_time_seconds,
    laps.sector_3_time_seconds,
    laps.sector_1_session_time_seconds,
    laps.sector_2_session_time_seconds,
    laps.sector_3_session_time_seconds,
    laps.speed_int_p1,
    laps.speed_int_p2,
    laps.speed_finish_line,
    laps.speed_trap,
    laps.is_personal_best,
    laps.compound,
    laps.tyre_life,
    laps.fresh_tyre,
    laps.lap_start_time_seconds,
    laps.lap_start_datetime,
    laps.track_status,
    laps.is_all_track_clear,
    laps.is_track_clear,
    laps.has_yellow_flag,
    laps.has_safety_car,
    laps.has_red_flag,
    laps.has_vsc,
    laps.track_status_description,
    laps.position,
    laps.deleted,
    laps.deleted_reason,
    laps.is_accurate
FROM
    {{ ref('stg_laps') }} AS laps
INNER JOIN
    {{ ref('dim_schedule') }} AS dim_schedule
    ON laps.season_year = dim_schedule.year
    AND laps.round_number = dim_schedule.round_number
INNER JOIN
    {{ ref('dim_sessions') }} AS dim_sessions
    ON dim_schedule.event_sk = dim_sessions.event_sk
    AND laps.session_type = dim_sessions.session_type
LEFT JOIN
    {{ ref('stg_results') }} AS results
    ON laps.season_year = results.season_year
    AND laps.round_number = results.round_number
    AND laps.session_type = results.session_type
    AND laps.driver_number = results.driver_number
