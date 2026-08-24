{{ config(materialized='table') }}

WITH source AS (
    SELECT * FROM {{ source('bronze', 'schedule') }}
),

renamed_columns AS (
    SELECT
        year,
        "RoundNumber" AS round_number,
        "Country" AS country,
        "Location" AS location,
        "OfficialEventName" AS official_event_name,
        "EventDate" AS event_date,
        "EventName" AS event_name,
        "EventFormat" AS event_format,
        "Session1" AS session_1,
        "Session1Date" AS session_1_date,
        "Session1DateUtc" AS session_1_date_utc,
        "Session2" AS session_2,
        "Session2Date" AS session_2_date,
        "Session2DateUtc" AS session_2_date_utc,
        "Session3" AS session_3,
        "Session3Date" AS session_3_date,
        "Session3DateUtc" AS session_3_date_utc,
        "Session4" AS session_4,
        "Session4Date" AS session_4_date,
        "Session4DateUtc" AS session_4_date_utc,
        "Session5" AS session_5,
        "Session5Date" AS session_5_date,
        "Session5DateUtc" AS session_5_date_utc,
        "F1ApiSupport" AS f1_api_support,
        extracted_at
    FROM
        source
),

cleaning_null_data AS (
    SELECT
        year,
        round_number,
        country,
        location,
        official_event_name,
        event_date,
        event_name,
        event_format,
        session_1,
        session_1_date,
        session_1_date_utc,
        session_2,
        session_2_date,
        session_2_date_utc,
        session_3,
        session_3_date,
        session_3_date_utc,
        {{ clean_null_string('session_4') }},
        session_4_date,
        session_4_date_utc,
        {{ clean_null_string('session_5') }},
        session_5_date,
        session_5_date_utc,
        f1_api_support,
        extracted_at
    FROM
        renamed_columns   
),

typed_data AS (
    SELECT
        year::INT,
        round_number::INT,
        country::VARCHAR,
        location::VARCHAR,
        official_event_name::VARCHAR,
        event_date::DATE,
        event_name::VARCHAR,
        event_format::VARCHAR,
        session_1::VARCHAR,
        session_1_date::TIMESTAMP,
        session_1_date_utc::TIMESTAMP,
        session_2::VARCHAR,
        session_2_date::TIMESTAMP,
        session_2_date_utc::TIMESTAMP,
        session_3::VARCHAR,
        session_3_date::TIMESTAMP,
        session_3_date_utc::TIMESTAMP,
        session_4::VARCHAR,
        session_4_date::TIMESTAMP,
        session_4_date_utc::TIMESTAMP,
        session_5::VARCHAR,  
        session_5_date::TIMESTAMP,
        session_5_date_utc::TIMESTAMP,
        f1_api_support::BOOLEAN,
        extracted_at::TIMESTAMP
    FROM
        cleaning_null_data  
)

SELECT * FROM typed_data