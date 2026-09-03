{{ config(materialized='table', schema='gold') }}

SELECT DISTINCT
    {{ dbt_utils.generate_surrogate_key(['country', 'location', 'event_name']) }} AS circuit_sk,
    country,
    location,
    event_name 
FROM 
    {{ ref('stg_schedule') }}
