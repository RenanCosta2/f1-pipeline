{{ config(materialized='table') }}

WITH source AS (
    SELECT * FROM {{ source('bronze', 'results') }}
),

overrides AS (
    SELECT * FROM {{ ref('driver_overrides') }}
),

renamed_columns AS (
    SELECT
        year AS season_year,
        gp AS round_number,
        session AS session_type,
        "DriverNumber" AS driver_number,
        "BroadcastName" AS broadcast_name,
        "Abbreviation" AS driver_abbreviation,
        COALESCE(overrides.standardized_driver_id, "DriverId") AS driver_id,
        "TeamName" AS team_name,
        "TeamColor" AS team_color,
        "TeamId" AS team_id,
        "FirstName" AS driver_first_name,
        "LastName" AS driver_last_name,
        COALESCE(overrides.standardized_full_name, "FullName") AS driver_full_name,
        "HeadshotUrl" AS driver_headshot_url,
        "CountryCode" AS driver_nationality,
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
    FROM
        source
    LEFT JOIN overrides
        ON source."FullName" = overrides.raw_driver_name
),

cleaning_data AS (
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
        {{ clean_null_string('driver_nationality') }},
        finishing_position,
        {{ clean_null_string('classified_position') }},
        grid_position,
        {{ clean_null_time('q1_time') }},
        {{ clean_null_time('q2_time') }},
        {{ clean_null_time('q3_time') }},
        {{ clean_null_time('total_time') }},
        {{ clean_null_string('status') }},
        points,
        laps_completed,
        extracted_at
    FROM
        renamed_columns
),

normalized_driver_name AS (
    SELECT
        *,
        TRANSLATE(
            driver_full_name,
            'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
            'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
        ) AS clean_full_name,
        TRANSLATE(
            driver_last_name,
            'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
            'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
        ) AS clean_last_name
    FROM
        cleaning_data
),

enriched_driver_id AS (
    SELECT
        *,
        COALESCE(
            FIRST_VALUE(driver_id) OVER (
                PARTITION BY clean_full_name
                ORDER BY (driver_id IS NULL), season_year DESC, extracted_at DESC
            ),
            CASE 
                WHEN clean_full_name = FIRST_VALUE(clean_full_name) OVER (
                    PARTITION BY clean_last_name 
                    ORDER BY season_year ASC, extracted_at ASC
                )
                THEN LOWER(REGEXP_REPLACE(clean_last_name, '\s+', '_', 'g'))
                
                ELSE LOWER(REGEXP_REPLACE(clean_full_name, '\s+', '_', 'g'))
            END
        ) AS final_driver_id
    FROM
        normalized_driver_name
),

enriched_team_id AS (
    SELECT
        *,
        COALESCE(
            FIRST_VALUE(team_id) OVER (
                PARTITION BY team_name
                ORDER BY (team_id IS NULL), season_year DESC, extracted_at DESC
            ), 
            LOWER(REGEXP_REPLACE(team_name, '\s+', '_', 'g'))
        ) AS final_team_id
    FROM
        enriched_driver_id
),

standardized_data AS (
    SELECT
        season_year,
        round_number,
        session_type,
        driver_number,
        broadcast_name,
        driver_abbreviation,
        final_driver_id AS driver_id,

        FIRST_VALUE(team_name) OVER (
            PARTITION BY final_team_id
            ORDER BY (team_name IS NULL), season_year DESC, extracted_at DESC
        ) AS team_name,
        
        FIRST_VALUE(team_color) OVER (
            PARTITION BY final_team_id
            ORDER BY (team_color IS NULL), season_year DESC, extracted_at DESC
        ) AS team_color,

        final_team_id AS team_id,

        FIRST_VALUE(driver_first_name) OVER (
            PARTITION BY final_driver_id
            ORDER BY (driver_first_name IS NULL), season_year DESC, extracted_at DESC
        ) AS driver_first_name,

        FIRST_VALUE(driver_last_name) OVER (
            PARTITION BY final_driver_id
            ORDER BY (driver_last_name IS NULL), season_year DESC, extracted_at DESC
        ) AS driver_last_name,

        FIRST_VALUE(clean_full_name) OVER (
            PARTITION BY final_driver_id
            ORDER BY (clean_full_name IS NULL), season_year DESC, extracted_at DESC
        ) AS driver_full_name,

        FIRST_VALUE(driver_headshot_url) OVER (
            PARTITION BY final_driver_id
            ORDER BY (driver_headshot_url IS NULL), season_year DESC, extracted_at DESC
        ) AS driver_headshot_url,

        FIRST_VALUE(driver_nationality) OVER (
            PARTITION BY final_driver_id
            ORDER BY (driver_nationality IS NULL), season_year DESC, extracted_at DESC
        ) AS driver_nationality,
        
        finishing_position,
        classified_position,

        CASE
            WHEN classified_position ~ '^[0-9]+$' THEN 'Classified'
            WHEN classified_position = 'R' THEN 'Retired'
            WHEN classified_position = 'D' THEN 'Diqualified'
            WHEN classified_position = 'E' THEN 'Exluded'
            WHEN classified_position = 'W' THEN 'Withdrawn'
            WHEN classified_position = 'F' THEN 'Failed to Qualify'
            WHEN classified_position = 'N' THEN 'Not Classified'
        END AS classification_status,

        grid_position,
        q1_time,
        q2_time,
        q3_time,
        total_time,
        status,
        points,
        laps_completed,
        extracted_at
    FROM 
        enriched_team_id
),

typed_data AS (
    SELECT
        season_year::INT,
        round_number::INT,
        session_type::VARCHAR(3),
        driver_number::INT,
        broadcast_name::VARCHAR,
        driver_abbreviation::VARCHAR(3),
        driver_id::VARCHAR,
        team_name::VARCHAR,
        team_color::VARCHAR,
        team_id::VARCHAR,
        driver_first_name::VARCHAR,
        driver_last_name::VARCHAR,
        driver_full_name::VARCHAR,
        driver_headshot_url::VARCHAR,
        driver_nationality::VARCHAR,
        finishing_position::INT,
        classified_position::VARCHAR,
        classification_status::VARCHAR,
        grid_position::INT,
        ROUND((q1_time / 1000000000.0)::NUMERIC, 3) AS q1_time_seconds,
        ROUND((q2_time / 1000000000.0)::NUMERIC, 3) AS q2_time_seconds,
        ROUND((q3_time / 1000000000.0)::NUMERIC, 3) AS q3_time_seconds,
        ROUND((total_time / 1000000000.0)::NUMERIC, 3) AS total_time_seconds,
        status::VARCHAR,
        points::FLOAT,
        laps_completed::INT,
        extracted_at::DATE
    FROM
        standardized_data
)

SELECT * FROM typed_data