{{ config(materialized='table', schema='gold') }}

SELECT DISTINCT
    {{ dbt_utils.generate_surrogate_key(['year', 'round_number', 'official_event_name', 'event_date']) }} AS event_sk,
    year,
    round_number,
    official_event_name,
    {{ dbt_utils.generate_surrogate_key(['country', 'location', 'event_name']) }} AS circuit_sk,
    event_date,
    event_format
FROM 
    {{ ref('stg_schedule') }}