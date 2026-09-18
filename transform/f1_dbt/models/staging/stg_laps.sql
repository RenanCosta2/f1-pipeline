{{ config(materialized='table') }}

WITH source AS (
    SELECT * FROM {{ source('bronze', 'laps') }}
),


renamed_columns AS (
    SELECT
        year AS season_year,
        gp AS round_number,
        session AS session_type,
        "Time" AS session_time,
        "Driver" AS driver,
        "DriverNumber" AS driver_number,
        "LapTime" AS lap_time,
        "LapNumber" AS lap_number,
        "Stint" AS stint,
        "PitOutTime" AS pit_out_time,
        "PitInTime" AS pit_in_time,
        "Sector1Time" AS sector_1_time,
        "Sector2Time" AS sector_2_time,
        "Sector3Time" AS sector_3_time,
        "Sector1SessionTime" AS sector_1_session_time,
        "Sector2SessionTime" AS sector_2_session_time,
        "Sector3SessionTime" AS sector_3_session_time,
        "SpeedI1" AS speed_int_p1,
        "SpeedI2" AS speed_int_p2,
        "SpeedFL" AS speed_finish_line,
        "SpeedST" AS speed_trap,
        "IsPersonalBest" AS is_personal_best,
        "Compound" AS compound,
        "TyreLife" AS tyre_life,
        "FreshTyre" AS fresh_tyre,
        "Team" AS team,
        "LapStartTime" AS lap_start_time,
        "LapStartDate" AS lap_start_datetime,
        "TrackStatus" AS track_status,
        "Position" AS position,
        "Deleted" AS deleted,
        "DeletedReason" AS deleted_reason,
        "FastF1Generated" AS fast_f1_generated,
        "IsAccurate" AS is_accurate,
        extracted_at
    FROM
        source
),

cleaning_data AS (
    SELECT
        season_year,
        round_number,
        CASE
            WHEN session_type = 'SS' THEN 'SQ'
            ELSE session_type
        END AS session_type,
        {{ clean_null_time('session_time') }},
        driver,
        driver_number,
        {{ clean_null_time('lap_time') }},
        lap_number,
        stint,
        {{ clean_null_time('pit_out_time') }},
        {{ clean_null_time('pit_in_time') }},
        {{ clean_null_time('sector_1_time') }},
        {{ clean_null_time('sector_2_time') }},
        {{ clean_null_time('sector_3_time') }},
        {{ clean_null_time('sector_1_session_time') }},
        {{ clean_null_time('sector_2_session_time') }},
        {{ clean_null_time('sector_3_session_time') }},
        speed_int_p1,
        speed_int_p2,
        speed_finish_line,
        speed_trap,
        is_personal_best,
        {{ clean_null_string('compound') }},
        tyre_life,
        fresh_tyre,
        {{ clean_null_string('team') }},
        {{ clean_null_time('lap_start_time') }},
        lap_start_datetime,
        track_status,
        (track_status = '1') AS is_all_track_clear,
        (track_status LIKE '%1%') AS is_track_clear,
        (track_status LIKE '%2%') AS has_yellow_flag,
        (track_status LIKE '%4%') AS has_safety_car,
        (track_status LIKE '%5%') AS has_red_flag,
        (track_status LIKE '%6%' OR track_status LIKE '%7%') AS has_vsc,
         (
            SELECT STRING_AGG(
                CASE digit
                    WHEN '1' THEN 'Track Clear'
                    WHEN '2' THEN 'Yellow Flag'
                    WHEN '4' THEN 'Safety Car'
                    WHEN '5' THEN 'Red Flag'
                    WHEN '6' THEN 'VSC Deployed'
                    WHEN '7' THEN 'VSC Ending'
                    ELSE digit
                END,
                ', '
            )
            FROM REGEXP_SPLIT_TO_TABLE(track_status, '') AS digit
        ) AS track_status_description,
        position,
        deleted,
        {{ clean_null_string('deleted_reason') }},
        fast_f1_generated,
        is_accurate,
        extracted_at
    from
        renamed_columns
),

typed_data AS (
    SELECT
        season_year::INT,
        round_number::INT,
        session_type::VARCHAR(3),
        ROUND((session_time / 1000000000.0)::NUMERIC, 3) AS session_time_seconds,
        driver::VARCHAR(3),
        driver_number::INT,
        ROUND((lap_time / 1000000000.0)::NUMERIC, 3) AS lap_time_seconds,
        lap_number::INT,
        stint::INT,
        ROUND((pit_out_time / 1000000000.0)::NUMERIC, 3) AS pit_out_time_seconds,
        ROUND((pit_in_time / 1000000000.0)::NUMERIC, 3) AS pit_in_time_seconds,
        ROUND((sector_1_time / 1000000000.0)::NUMERIC, 3) AS sector_1_time_seconds,
        ROUND((sector_2_time / 1000000000.0)::NUMERIC, 3) AS sector_2_time_seconds,
        ROUND((sector_3_time / 1000000000.0)::NUMERIC, 3) AS sector_3_time_seconds,
        ROUND((sector_1_session_time / 1000000000.0)::NUMERIC, 3) AS sector_1_session_time_seconds,
        ROUND((sector_2_session_time / 1000000000.0)::NUMERIC, 3) AS sector_2_session_time_seconds,
        ROUND((sector_3_session_time / 1000000000.0)::NUMERIC, 3) AS sector_3_session_time_seconds,
        speed_int_p1::DOUBLE PRECISION,
        speed_int_p2::DOUBLE PRECISION,
        speed_finish_line::DOUBLE PRECISION,
        speed_trap::DOUBLE PRECISION,
        is_personal_best::BOOLEAN,
        compound::VARCHAR,
        tyre_life::INT,
        fresh_tyre::BOOLEAN,
        team::VARCHAR,
        ROUND((lap_start_time / 1000000000.0)::NUMERIC, 3) AS lap_start_time_seconds,
        lap_start_datetime::TIMESTAMP,
        track_status::VARCHAR,
        is_all_track_clear::BOOLEAN,
        is_track_clear::BOOLEAN,
        has_yellow_flag::BOOLEAN,
        has_safety_car::BOOLEAN,
        has_red_flag::BOOLEAN,
        has_vsc::BOOLEAN,
        track_status_description::VARCHAR,
        position::INT,
        deleted::BOOLEAN,
        deleted_reason::VARCHAR,
        fast_f1_generated::BOOLEAN,
        is_accurate::BOOLEAN,
        extracted_at::TIMESTAMP
    from
        cleaning_data
)

SELECT * FROM typed_data