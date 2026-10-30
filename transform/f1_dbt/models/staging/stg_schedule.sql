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
        source.RoundNumber AS round_number,
        COALESCE(
            mapping.circuit_id,
            LOWER(REGEXP_REPLACE(REPLACE(source.Location, ' ', '_'), r'[^a-zA-Z0-9_]', ''))
        ) AS circuit_id,
        COALESCE(circuits.country, source.Country) AS country,
        COALESCE(circuits.location, source.Location) AS location,
        REGEXP_REPLACE(
            source.OfficialEventName,
            r'\s+\d{4}$',
            ''
        ) AS official_event_name,
        source.EventDate AS event_date,
        source.EventName AS event_name,
        source.EventFormat AS event_format,
        source.Session1 AS session_1,
        source.Session1DateUtc AS session_1_date_utc,
        source.Session2 AS session_2,
        source.Session2DateUtc AS session_2_date_utc,
        source.Session3 AS session_3,
        source.Session3DateUtc AS session_3_date_utc,
        source.Session4 AS session_4,
        source.Session4DateUtc AS session_4_date_utc,
        source.Session5 AS session_5,
        source.Session5DateUtc AS session_5_date_utc,
        source.F1ApiSupport AS f1_api_support,
        source.extracted_at
    FROM
        source
    LEFT JOIN circuit_mapping AS mapping
        ON  source.Country  = mapping.raw_country
        AND source.Location = mapping.raw_location
        AND source.year BETWEEN mapping.start_year AND mapping.end_year
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
        session_1_date_utc,
        session_2,
        session_2_date_utc,
        session_3,
        session_3_date_utc,
        {{ clean_null_string('session_4') }},
        session_4_date_utc,
        {{ clean_null_string('session_5') }},
        session_5_date_utc,
        f1_api_support,
        extracted_at
    FROM
        renamed_columns   
),

typed_data AS (
    SELECT
        CAST(year AS INT64) AS year,
        CAST(round_number AS INT64) AS round_number,
        CAST(circuit_id AS STRING) AS circuit_id,
        CAST(country AS STRING) AS country,
        CAST(location AS STRING) AS location,
        CAST(official_event_name AS STRING) AS official_event_name,
        DATE(TIMESTAMP_MICROS(CAST(event_date / 1000 AS INT64))) AS event_date,
        CAST(event_name AS STRING) AS event_name,
        CAST(event_format AS STRING) AS event_format,
        CAST(session_1 AS STRING) AS session_1,
        TIMESTAMP_MICROS(CAST(session_1_date_utc / 1000 AS INT64)) AS session_1_date,
        TIMESTAMP_MICROS(CAST(session_1_date_utc / 1000 AS INT64)) AS session_1_date_utc,
        DATETIME(TIMESTAMP_MICROS(CAST(session_1_date_utc / 1000 AS INT64)), 'America/Sao_Paulo') AS session_1_date_brt,
        CAST(session_2 AS STRING) AS session_2,
        TIMESTAMP_MICROS(CAST(session_2_date_utc / 1000 AS INT64)) AS session_2_date,
        TIMESTAMP_MICROS(CAST(session_2_date_utc / 1000 AS INT64)) AS session_2_date_utc,
        DATETIME(TIMESTAMP_MICROS(CAST(session_2_date_utc / 1000 AS INT64)), 'America/Sao_Paulo') AS session_2_date_brt,
        CAST(session_3 AS STRING) AS session_3,
        TIMESTAMP_MICROS(CAST(session_3_date_utc / 1000 AS INT64)) AS session_3_date,
        TIMESTAMP_MICROS(CAST(session_3_date_utc / 1000 AS INT64)) AS session_3_date_utc,
        DATETIME(TIMESTAMP_MICROS(CAST(session_3_date_utc / 1000 AS INT64)), 'America/Sao_Paulo') AS session_3_date_brt,
        CAST(session_4 AS STRING) AS session_4,
        TIMESTAMP_MICROS(CAST(session_4_date_utc / 1000 AS INT64)) AS session_4_date,
        TIMESTAMP_MICROS(CAST(session_4_date_utc / 1000 AS INT64)) AS session_4_date_utc,
        DATETIME(TIMESTAMP_MICROS(CAST(session_4_date_utc / 1000 AS INT64)), 'America/Sao_Paulo') AS session_4_date_brt,
        CAST(session_5 AS STRING) AS session_5,  
        TIMESTAMP_MICROS(CAST(session_5_date_utc / 1000 AS INT64)) AS session_5_date,
        TIMESTAMP_MICROS(CAST(session_5_date_utc / 1000 AS INT64)) AS session_5_date_utc,
        DATETIME(TIMESTAMP_MICROS(CAST(session_5_date_utc / 1000 AS INT64)), 'America/Sao_Paulo') AS session_5_date_brt,
        CAST(f1_api_support AS BOOL) AS f1_api_support,
        CAST(extracted_at AS TIMESTAMP) AS extracted_at
    FROM
        cleaning_data  
)

SELECT * FROM typed_data
