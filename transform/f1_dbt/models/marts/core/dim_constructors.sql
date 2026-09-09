{{ config(materialized='table', schema='gold') }}

SELECT DISTINCT
  team_id,
  team_name,
  team_color

FROM
  {{ ref('stg_results') }}
WHERE
  team_id IS NOT NULL