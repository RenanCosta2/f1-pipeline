{{ config(materialized='table', schema='gold') }}

SELECT DISTINCT
    {{ dbt_utils.generate_surrogate_key(['year', 'round_number', 'official_event_name', 'session_number', 'session_date']) }} AS session_sk,
    {{ dbt_utils.generate_surrogate_key(['year', 'round_number', 'official_event_name', 'event_date']) }} AS event_sk,
    session_number,
    session_name,
    CASE
        WHEN LOWER(session_name) LIKE '%practice 1%' THEN 'FP1'
        WHEN LOWER(session_name) LIKE '%practice 2%' THEN 'FP2'
        WHEN LOWER(session_name) LIKE '%practice 3%' THEN 'FP3'
        WHEN LOWER(session_name) LIKE '%sprint shootout%' OR LOWER(session_name) LIKE '%sprint qualifying%' THEN 'SQ'
        WHEN LOWER(session_name) LIKE '%sprint%' THEN 'S'
        WHEN LOWER(session_name) LIKE '%qualifying%' THEN 'Q'
        WHEN LOWER(session_name) LIKE '%race%' THEN 'R'
        ELSE UPPER(session_name)
    END AS session_type,
    session_date, 
    session_date_utc, 
    session_date_brt
FROM 
    {{ ref('stg_schedule') }}
CROSS JOIN UNNEST([
    STRUCT(1 AS session_number, session_1 AS session_name, session_1_date AS session_date, session_1_date_utc AS session_date_utc, session_1_date_brt AS session_date_brt),
    STRUCT(2, session_2, session_2_date, session_2_date_utc, session_2_date_brt),
    STRUCT(3, session_3, session_3_date, session_3_date_utc, session_3_date_brt),
    STRUCT(4, session_4, session_4_date, session_4_date_utc, session_4_date_brt),
    STRUCT(5, session_5, session_5_date, session_5_date_utc, session_5_date_brt)
]) AS sessions
WHERE
    session_name IS NOT NULL
    AND session_date_utc IS NOT NULL
    AND session_date_brt IS NOT NULL
