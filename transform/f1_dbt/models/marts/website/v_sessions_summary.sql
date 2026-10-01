{{ config(
    materialized='table', 
    schema='website',
    post_hook=[
        "CREATE INDEX IF NOT EXISTS idx_sess_sum_lookup ON {{ this }} (year, round_number, session_name)",
        "CREATE INDEX IF NOT EXISTS idx_sess_sum_finish ON {{ this }} (finishing_position)"
    ]
) }}

WITH driver_session_laps AS (
  SELECT
        session_sk,
        driver_id,
        team_id,
        lap_time_seconds,
        MAX(stint) OVER(PARTITION BY session_sk, driver_id) - 1 AS stops,
        ROW_NUMBER() OVER(
            PARTITION BY session_sk, driver_id 
            ORDER BY lap_time_seconds ASC
        ) AS rn
  FROM
    {{ ref('fact_laps') }}
  WHERE
    lap_time_seconds IS NOT NULL
),

driver_session_fastest_lap AS (
    SELECT
        session_sk,
        driver_id,
        team_id,
        lap_time_seconds,
        GREATEST(stops, 0) AS stops
    FROM
      driver_session_laps
    WHERE
      rn = 1
),

driver_final_time AS (
    SELECT
        session_sk,
        driver_id,
        session_time_seconds AS final_session_time_seconds
    FROM (
        SELECT
            session_sk,
            driver_id,
            session_time_seconds,
            ROW_NUMBER() OVER(PARTITION BY session_sk, driver_id ORDER BY lap_number DESC) AS last_lap_rn
        FROM 
            {{ ref('fact_laps') }}
    ) t
    WHERE 
        last_lap_rn = 1
),

ranked_results AS (
    SELECT
        r.session_sk,
        r.driver_id,
        r.team_id,
        r.driver_number,
        r.points,
        r.grid_position,
        COALESCE(
            r.finishing_position,
            CASE 
                WHEN f.lap_time_seconds IS NOT NULL THEN
                    DENSE_RANK() OVER (
                        PARTITION BY r.session_sk 
                        ORDER BY f.lap_time_seconds ASC NULLS LAST
                    )
            END
        ) AS finishing_position,
        f.stops,
        f.lap_time_seconds,
        r.status,
        r.laps_completed,
        dft.final_session_time_seconds
    FROM
        {{ ref('fact_results') }} r
    LEFT JOIN 
        driver_session_fastest_lap f
        USING(session_sk, driver_id, team_id)
    LEFT JOIN 
        driver_final_time dft
        USING(session_sk, driver_id)
),

race_results_base AS (
    SELECT
        session_sk,
        driver_id,
        circuit_sk,
        year,
        round_number,
        country,
        location,
        official_event_name,
        session_name,
        session_number,
        driver_full_name,
        driver_number,
        driver_nationality,
        team_name,
        team_color,
        points,
        finishing_position,
        grid_position,
        grid_position - finishing_position AS delta_position,
        stops,
        lap_time_seconds,
        status,
        laps_completed,
        final_session_time_seconds,

        FIRST_VALUE(laps_completed) OVER (PARTITION BY session_sk ORDER BY finishing_position ASC NULLS LAST) AS leader_laps,
        
        LAG(laps_completed, 1) OVER (PARTITION BY session_sk ORDER BY finishing_position ASC NULLS LAST) AS ahead_laps,
        
        final_session_time_seconds - FIRST_VALUE(final_session_time_seconds) OVER (
            PARTITION BY session_sk ORDER BY finishing_position ASC NULLS LAST
        ) AS gap_seconds,
        
        ABS(final_session_time_seconds - LAG(final_session_time_seconds, 1) OVER (
            PARTITION BY session_sk ORDER BY finishing_position ASC NULLS LAST
        )) AS interval_seconds,

        lap_time_seconds - FIRST_VALUE(lap_time_seconds) OVER (
            PARTITION BY session_sk ORDER BY finishing_position ASC NULLS LAST
        ) AS fp_gap_seconds,

        ABS(lap_time_seconds - LAG(lap_time_seconds, 1) OVER (
            PARTITION BY session_sk ORDER BY finishing_position ASC NULLS LAST
        )) AS fp_interval_seconds

    FROM
        ranked_results
    LEFT JOIN
        {{ ref('dim_drivers') }}
        USING(driver_id)
    LEFT JOIN
        {{ ref('dim_sessions') }}
        USING(session_sk)
    LEFT JOIN 
        {{ ref('dim_constructors') }}
        USING(team_id)
    LEFT JOIN
        {{ ref('dim_schedule') }}
        USING(event_sk)
    LEFT JOIN 
        {{ ref('dim_circuits') }}
        USING(circuit_sk)
)

SELECT
    session_sk,
    driver_id,
    circuit_sk,
    year,
    round_number,
    country,
    location,
    official_event_name,
    session_name,
    driver_full_name,
    driver_number,
    driver_nationality,
    team_name,
    team_color,
    points,
    finishing_position,
    grid_position,
    delta_position,
    stops,
    
    CASE 
        WHEN session_name NOT IN ('Race', 'Sprint') THEN
            CASE 
                WHEN finishing_position = 1 THEN 'Leader'
                WHEN fp_gap_seconds IS NOT NULL THEN
                    CASE 
                        WHEN fp_gap_seconds >= 60 THEN '+' || TO_CHAR(MAKE_INTERVAL(secs => fp_gap_seconds), 'FMMI:SS.MS')
                        ELSE '+' || TO_CHAR(fp_gap_seconds::numeric, 'FM990.000') || 's'
                    END
                ELSE '-'
            END
        WHEN finishing_position = 1 THEN 'Leader'
        WHEN 
            leader_laps > laps_completed 
            AND COALESCE(status, '') NOT LIKE '%Lap%' 
            AND status != 'Finished' 
            THEN status
        WHEN leader_laps > laps_completed THEN '+' || (leader_laps - laps_completed)::text || ' Lap(s)'
        WHEN gap_seconds >= 60 THEN '+' || TO_CHAR(MAKE_INTERVAL(secs => gap_seconds), 'FMMI:SS.MS')
        ELSE '+' || TO_CHAR(gap_seconds::numeric, 'FM990.000') || 's'
    END AS gap_to_leader,
    
    CASE 
        WHEN session_name NOT IN ('Race', 'Sprint') THEN
            CASE 
                WHEN finishing_position = 1 THEN '-'
                WHEN fp_interval_seconds IS NOT NULL THEN
                    CASE 
                        WHEN fp_interval_seconds >= 60 THEN '+' || TO_CHAR(MAKE_INTERVAL(secs => fp_interval_seconds), 'FMMI:SS.MS')
                        ELSE '+' || TO_CHAR(fp_interval_seconds::numeric, 'FM990.000') || 's'
                    END
                ELSE '-'
            END
        WHEN finishing_position = 1 THEN '-'
        WHEN 
            leader_laps > laps_completed 
            AND COALESCE(status, '') NOT LIKE '%Lap%' 
            AND status != 'Finished' 
            THEN '-'
        WHEN ahead_laps > laps_completed THEN '+' || (ahead_laps - laps_completed)::text || ' Lap(s)'
        WHEN interval_seconds IS NOT NULL THEN
            CASE 
                WHEN interval_seconds >= 60 THEN '+' || TO_CHAR(MAKE_INTERVAL(secs => interval_seconds), 'FMMI:SS.MS')
                ELSE '+' || TO_CHAR(interval_seconds::numeric, 'FM990.000') || 's'
            END
        ELSE '-'
    END AS interval_to_car_ahead,
    
    TO_CHAR(MAKE_INTERVAL(secs => lap_time_seconds), 'FMMI:SS.MS') AS best_lap,
    status,
    laps_completed
FROM 
    race_results_base