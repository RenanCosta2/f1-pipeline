WITH source AS (
    SELECT * FROM {{ source('bronze', 'schedule') }}
),

circuit_mapping AS (
    SELECT * FROM {{ ref('circuit_mapping') }}
),

seed_circuits AS (
    SELECT * FROM {{ ref('seed_circuits') }}
),

renamed_columns AS (
    SELECT
        source.year,
        source."RoundNumber" AS round_number,
        COALESCE(
            mapping.circuit_id,
            LOWER(REGEXP_REPLACE(REPLACE(source."Location", ' ', '_'), '[^a-zA-Z0-9_]', '', 'g'))
        ) AS circuit_id,
        COALESCE(circuits.country, source."Country") AS country,
        COALESCE(circuits.location, source."Location") AS location,
        REGEXP_REPLACE(
            source."OfficialEventName",
            '\s+\d{4}$',
            ''
        ) AS official_event_name,
        source."EventDate" AS event_date,
        source."EventName" AS event_name,
        source."EventFormat" AS event_format,
        source."Session1" AS session_1,
        source."Session1Date" AS session_1_date,
        source."Session1DateUtc" AS session_1_date_utc,
        source."Session2" AS session_2,
        source."Session2Date" AS session_2_date,
        source."Session2DateUtc" AS session_2_date_utc,
        source."Session3" AS session_3,
        source."Session3Date" AS session_3_date,
        source."Session3DateUtc" AS session_3_date_utc,
        source."Session4" AS session_4,
        source."Session4Date" AS session_4_date,
        source."Session4DateUtc" AS session_4_date_utc,
        source."Session5" AS session_5,
        source."Session5Date" AS session_5_date,
        source."Session5DateUtc" AS session_5_date_utc,
        source."F1ApiSupport" AS f1_api_support,
        source.extracted_at
    FROM
        source
    LEFT JOIN circuit_mapping AS mapping
        ON  source."Country"  = mapping.raw_country
        AND source."Location" = mapping.raw_location
    LEFT JOIN seed_circuits AS circuits
        ON  mapping.circuit_id = circuits.circuit_id
),

cleaning_data AS (
    SELECT
        year,
        round_number,
        circuit_id,
        country,
        location,
        {{ clean_null_string('official_event_name') }},
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
        circuit_id::VARCHAR,
        country::VARCHAR,
        location::VARCHAR,
        official_event_name::VARCHAR,
        event_date::DATE,
        event_name::VARCHAR,
        event_format::VARCHAR,
        session_1::VARCHAR,
        session_1_date::TIMESTAMP,
        session_1_date_utc::TIMESTAMP,
        (session_1_date_utc AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::TIMESTAMP AS session_1_date_brt,
        session_2::VARCHAR,
        session_2_date::TIMESTAMP,
        session_2_date_utc::TIMESTAMP,
        (session_2_date_utc AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::TIMESTAMP AS session_2_date_brt,
        session_3::VARCHAR,
        session_3_date::TIMESTAMP,
        session_3_date_utc::TIMESTAMP,
        (session_3_date_utc AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::TIMESTAMP AS session_3_date_brt,
        session_4::VARCHAR,
        session_4_date::TIMESTAMP,
        session_4_date_utc::TIMESTAMP,
        (session_4_date_utc AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::TIMESTAMP AS session_4_date_brt,
        session_5::VARCHAR,  
        session_5_date::TIMESTAMP,
        session_5_date_utc::TIMESTAMP,
        (session_5_date_utc AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::TIMESTAMP AS session_5_date_brt,
        f1_api_support::BOOLEAN,
        extracted_at::TIMESTAMP
    FROM
        cleaning_data  
)

SELECT * FROM typed_data