WITH source AS (
    SELECT * FROM {{ source('bronze', 'laps') }}
),


renamed_columns AS (
    SELECT
        year AS season_year,
        gp AS round_number,
        session AS session_type,
        Time AS session_time,
        Driver AS driver,
        DriverNumber AS driver_number,
        LapTime AS lap_time,
        LapNumber AS lap_number,
        Stint AS stint,
        PitOutTime AS pit_out_time,
        PitInTime AS pit_in_time,
        Sector1Time AS sector_1_time,
        Sector2Time AS sector_2_time,
        Sector3Time AS sector_3_time,
        Sector1SessionTime AS sector_1_session_time,
        Sector2SessionTime AS sector_2_session_time,
        Sector3SessionTime AS sector_3_session_time,
        SpeedI1 AS speed_int_p1,
        SpeedI2 AS speed_int_p2,
        SpeedFL AS speed_finish_line,
        SpeedST AS speed_trap,
        IsPersonalBest AS is_personal_best,
        Compound AS compound,
        TyreLife AS tyre_life,
        FreshTyre AS fresh_tyre,
        Team AS team,
        LapStartTime AS lap_start_time,
        LapStartDate AS lap_start_datetime,
        TrackStatus AS track_status,
        Position AS position,
        Deleted AS deleted,
        DeletedReason AS deleted_reason,
        FastF1Generated AS fast_f1_generated,
        IsAccurate AS is_accurate,
        extracted_at
    FROM
        source
),

distinct_track_statuses AS (
    SELECT DISTINCT TrackStatus AS track_status FROM source
),

track_status_descriptions AS (
    SELECT
        track_status,
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
            FROM UNNEST(SPLIT(track_status, '')) AS digit
            WHERE digit != ''
        ) AS track_status_description
    FROM distinct_track_statuses
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
        track_status_description,
        position,
        deleted,
        {{ clean_null_string('deleted_reason') }},
        fast_f1_generated,
        is_accurate,
        extracted_at
    FROM
        renamed_columns
    LEFT JOIN
        track_status_descriptions
        USING (track_status)
),

typed_data AS (
    SELECT
        CAST(season_year AS INT64) AS season_year,
        CAST(round_number AS INT64) AS round_number,
        CAST(session_type AS STRING) AS session_type,
        ROUND(CAST(session_time / 1000000000.0 AS NUMERIC), 3) AS session_time_seconds,
        CAST(driver AS STRING) AS driver,
        CAST(driver_number AS INT64) AS driver_number,
        ROUND(CAST(lap_time / 1000000000.0 AS NUMERIC), 3) AS lap_time_seconds,
        CAST(lap_number AS INT64) AS lap_number,
        CAST(stint AS INT64) AS stint,
        ROUND(CAST(pit_out_time / 1000000000.0 AS NUMERIC), 3) AS pit_out_time_seconds,
        ROUND(CAST(pit_in_time / 1000000000.0 AS NUMERIC), 3) AS pit_in_time_seconds,
        ROUND(CAST(sector_1_time / 1000000000.0 AS NUMERIC), 3) AS sector_1_time_seconds,
        ROUND(CAST(sector_2_time / 1000000000.0 AS NUMERIC), 3) AS sector_2_time_seconds,
        ROUND(CAST(sector_3_time / 1000000000.0 AS NUMERIC), 3) AS sector_3_time_seconds,
        ROUND(CAST(sector_1_session_time / 1000000000.0 AS NUMERIC), 3) AS sector_1_session_time_seconds,
        ROUND(CAST(sector_2_session_time / 1000000000.0 AS NUMERIC), 3) AS sector_2_session_time_seconds,
        ROUND(CAST(sector_3_session_time / 1000000000.0 AS NUMERIC), 3) AS sector_3_session_time_seconds,
        CAST(speed_int_p1 AS FLOAT64) AS speed_int_p1,
        CAST(speed_int_p2 AS FLOAT64) AS speed_int_p2,
        CAST(speed_finish_line AS FLOAT64) AS speed_finish_line,
        CAST(speed_trap AS FLOAT64) AS speed_trap,
        CAST(is_personal_best AS BOOL) AS is_personal_best,
        CAST(compound AS STRING) AS compound,
        CAST(tyre_life AS INT64) AS tyre_life,
        CAST(fresh_tyre AS BOOL) AS fresh_tyre,
        CAST(team AS STRING) AS team,
        ROUND(CAST(lap_start_time / 1000000000.0 AS NUMERIC), 3) AS lap_start_time_seconds,
        TIMESTAMP_MICROS(CAST(lap_start_datetime / 1000 AS INT64)) AS lap_start_datetime,
        CAST(track_status AS STRING) AS track_status,
        CAST(is_all_track_clear AS BOOL) AS is_all_track_clear,
        CAST(is_track_clear AS BOOL) AS is_track_clear,
        CAST(has_yellow_flag AS BOOL) AS has_yellow_flag,
        CAST(has_safety_car AS BOOL) AS has_safety_car,
        CAST(has_red_flag AS BOOL) AS has_red_flag,
        CAST(has_vsc AS BOOL) AS has_vsc,
        CAST(track_status_description AS STRING) AS track_status_description,
        CAST(position AS INT64) AS position,
        CAST(deleted AS BOOL) AS deleted,
        CAST(deleted_reason AS STRING) AS deleted_reason,
        CAST(fast_f1_generated AS BOOL) AS fast_f1_generated,
        CAST(is_accurate AS BOOL) AS is_accurate,
        CAST(extracted_at AS TIMESTAMP) AS extracted_at
    FROM
        cleaning_data
)

SELECT * FROM typed_data