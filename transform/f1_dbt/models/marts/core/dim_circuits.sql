{{ config(materialized='table', schema='gold') }}

SELECT
    circuit_id,
    circuit_name,
    circuit_name AS event_name,
    country,
    location,
    track_type
FROM 
    {{ ref('seed_circuits') }}
