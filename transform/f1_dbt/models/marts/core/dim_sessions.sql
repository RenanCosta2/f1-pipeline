{{ config(materialized='table', schema='gold') }}

SELECT DISTINCT
    {{ dbt_utils.generate_surrogate_key(['year', 'round_number', 'official_event_name', 'session_number', 'session_date']) }} AS session_sk,
    {{ dbt_utils.generate_surrogate_key(['year', 'round_number', 'official_event_name', 'event_date']) }} AS event_sk,
    session_number,
    session_name,
    CASE
        WHEN session_name ILIKE '%Practice 1%' THEN 'FP1'
        WHEN session_name ILIKE '%Practice 2%' THEN 'FP2'
        WHEN session_name ILIKE '%Practice 3%' THEN 'FP3'
        WHEN session_name ILIKE '%Sprint Shootout%' OR session_name ILIKE '%Sprint Qualifying%' THEN 'SQ'
        WHEN session_name ILIKE '%Sprint%' THEN 'S'
        WHEN session_name ILIKE '%Qualifying%' THEN 'Q'
        WHEN session_name ILIKE '%Race%' THEN 'R'
        ELSE UPPER(session_name)
    END AS session_type,
    session_date, 
    session_date_utc, 
    session_date_brt
FROM 
    {{ ref('stg_schedule') }}
CROSS JOIN LATERAL (
    VALUES
        (1, session_1, session_1_date, session_1_date_utc, session_1_date_brt),
        (2, session_2, session_2_date, session_2_date_utc, session_2_date_brt),
        (3, session_3, session_3_date, session_3_date_utc, session_3_date_brt),
        (4, session_4, session_4_date, session_4_date_utc, session_4_date_brt),
        (5, session_5, session_5_date, session_5_date_utc, session_5_date_brt)
) AS sessions(session_number, session_name, session_date, session_date_utc, session_date_brt)
WHERE
    session_name IS NOT NULL
    AND session_date IS NOT NULL
    AND session_date_utc IS NOT NULL
    AND session_date_brt IS NOT NULL
