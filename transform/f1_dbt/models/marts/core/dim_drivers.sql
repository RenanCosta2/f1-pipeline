{{ config(materialized='table', schema='gold') }}

SELECT DISTINCT
  driver_id,
  broadcast_name,
  driver_abbreviation,
  driver_first_name,
  driver_last_name,
  driver_full_name,
  driver_headshot_url,
  driver_nationality

FROM
  {{ ref('stg_results') }}