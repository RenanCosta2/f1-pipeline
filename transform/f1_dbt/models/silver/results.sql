{{ config(materialized='table') }}

WITH source AS (
    SELECT * FROM {{ source('bronze', 'results') }}
),

renamed_columns AS (
    SELECT
        year AS season_year,
        gp AS round_number,
        session AS session_type,
        "DriverNumber" AS driver_number,
        "BroadcastName" AS broadcast_name,
        "Abbreviation" AS driver_abbreviation,
        "DriverId" AS driver_id,
        "TeamName" AS team_name,
        "TeamColor" AS team_color,
        "TeamId" AS team_id,
        "FirstName" AS driver_first_name,
        "LastName" AS driver_last_name,
        "FullName" AS driver_full_name,
        "HeadshotUrl" AS driver_headshot_url,
        "CountryCode" AS country_code,
        "Position" AS finishing_position,
        "ClassifiedPosition" AS classified_position,
        "GridPosition" AS grid_position,
        "Q1" AS q1_time,
        "Q2" AS q2_time,
        "Q3" AS q3_time,
        "Time" AS total_time,
        "Status" AS status,
        "Points" AS points,
        "Laps" AS laps_completed,
        extracted_at
    from
        source
),

cleaning_null_data AS (
    SELECT
        season_year,
        round_number,
        session_type,
        driver_number,
        {{ clean_null_string('broadcast_name') }},
        driver_abbreviation,
        {{ clean_null_string('driver_id') }},
        {{ clean_null_string('team_name') }},
        {{ clean_null_string('team_color') }},
        {{ clean_null_string('team_id') }},
        {{ clean_null_string('driver_first_name') }},
        {{ clean_null_string('driver_last_name') }},
        {{ clean_null_string('driver_full_name') }},
        {{ clean_null_string('driver_headshot_url') }},
        {{ clean_null_string('country_code') }},
        finishing_position,
        classified_position,
        grid_position,
        {{ clean_null_time('q1_time') }},
        {{ clean_null_time('q2_time') }},
        {{ clean_null_time('q3_time') }},
        {{ clean_null_time('total_time') }},
        {{ clean_null_string('status') }},
        points,
        laps_completed,
        extracted_at
    from
        renamed_columns
),

typed_data AS (
    SELECT
        season_year::INT,
        round_number::INT,
        session_type::VARCHAR(3),
        driver_number::INT,
        broadcast_name::VARCHAR,
        driver_abbreviation,
        driver_id::VARCHAR,
        team_name::VARCHAR,
        team_color::VARCHAR,
        team_id::VARCHAR,
        driver_first_name::VARCHAR,
        driver_last_name::VARCHAR,
        driver_full_name::VARCHAR,
        driver_headshot_url::VARCHAR,
        country_code::VARCHAR,
        finishing_position::INT,
        classified_position::VARCHAR,
        grid_position::INT,
        q1_time::BIGINT,
        q2_time::BIGINT,
        q3_time::BIGINT,
        total_time::BIGINT,
        status::VARCHAR,
        points::FLOAT,
        laps_completed::INT,
        extracted_at::DATE
    from
        cleaning_null_data
)

SELECT * FROM typed_data