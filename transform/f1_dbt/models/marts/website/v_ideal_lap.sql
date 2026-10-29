{{ config(
    materialized='table', 
    schema='website'
) }}

WITH driver_best_sectors AS (
    SELECT
        year,
        round_number,
        official_event_name,
        session_number,
        session_name,
        driver_full_name,
        team_name,
        MIN(sector_1_time_seconds) AS best_s1,
        MIN(sector_2_time_seconds) AS best_s2,
        MIN(sector_3_time_seconds) AS best_s3,
        MIN(lap_time_seconds) AS best_lap
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
        is_accurate IS TRUE
        AND deleted IS NOT TRUE
    GROUP BY
        year,
        round_number,
        official_event_name,
        session_number,
        session_name,
        driver_full_name,
        team_name
)
SELECT
    year,
    round_number,
    official_event_name,
    session_number,
    session_name,
    driver_full_name,
    team_name,
    {{ format_lap_time('best_s1') }} AS sector_1,
    {{ format_lap_time('best_s2') }} AS sector_2,
    {{ format_lap_time('best_s3') }} AS sector_3,
    {{ format_lap_time('best_lap') }} AS lap_time,
    {{ format_lap_time('best_lap - (best_s1 + best_s2 + best_s3)') }} AS delta_ideal_lap
FROM
    driver_best_sectors
