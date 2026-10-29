{{ config(
    materialized='table', 
    schema='website'
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

event_qualifying_grid AS (
    SELECT
        sessions.event_sk,
        results.driver_id,
        results.finishing_position AS quali_grid_position
    FROM 
        {{ ref('fact_results') }} AS results
    JOIN 
        {{ ref('dim_sessions') }} AS sessions 
        USING (session_sk)
    WHERE sessions.session_name = 'Qualifying'
),

event_sprint_grid AS (
    SELECT
        dse.event_sk,
        fr.driver_id,
        fr.finishing_position AS sprint_grid_position
    FROM {{ ref('fact_results') }} fr
    JOIN {{ ref('dim_sessions') }} dse USING (session_sk)
    WHERE dse.session_name IN ('Sprint Qualifying', 'Sprint Shootout')
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
                        ORDER BY CASE WHEN f.lap_time_seconds IS NULL THEN 1 ELSE 0 END, f.lap_time_seconds ASC
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
        ranked_results.driver_id,
        circuit_id,
        year,
        round_number,
        country,
        location,
        official_event_name,
        session_name,
        session_number,
        driver_full_name,
        driver_headshot_url,
        driver_number,
        driver_nationality,
        team_name,
        team_color,
        points,
        finishing_position,
        CASE 
            WHEN dim_sessions.session_name IN ('Race', 'Sprint') THEN
                COALESCE(
                    ranked_results.grid_position,
                    CASE 
                        WHEN dim_sessions.session_name = 'Sprint' THEN esg.sprint_grid_position
                        ELSE eqg.quali_grid_position
                    END
                )
            ELSE NULL
        END AS grid_position,
        CASE 
            WHEN dim_sessions.session_name IN ('Race', 'Sprint') THEN
                COALESCE(
                    ranked_results.grid_position,
                    CASE 
                        WHEN dim_sessions.session_name = 'Sprint' THEN esg.sprint_grid_position
                        ELSE eqg.quali_grid_position
                    END
                ) - finishing_position
            ELSE NULL
        END AS delta_position,
        stops,
        lap_time_seconds,
        status,
        laps_completed,
        final_session_time_seconds,

        FIRST_VALUE(laps_completed) OVER (
            PARTITION BY session_sk 
            ORDER BY CASE WHEN finishing_position IS NULL THEN 1 ELSE 0 END, finishing_position ASC
        ) AS leader_laps,
        
        LAG(laps_completed, 1) OVER (
            PARTITION BY session_sk 
            ORDER BY CASE WHEN finishing_position IS NULL THEN 1 ELSE 0 END, finishing_position ASC
        ) AS ahead_laps,
        
        final_session_time_seconds - FIRST_VALUE(final_session_time_seconds) OVER (
            PARTITION BY session_sk 
            ORDER BY CASE WHEN finishing_position IS NULL THEN 1 ELSE 0 END, finishing_position ASC
        ) AS gap_seconds,
        
        ABS(final_session_time_seconds - LAG(final_session_time_seconds, 1) OVER (
            PARTITION BY session_sk 
            ORDER BY CASE WHEN finishing_position IS NULL THEN 1 ELSE 0 END, finishing_position ASC
        )) AS interval_seconds,

        lap_time_seconds - FIRST_VALUE(lap_time_seconds) OVER (
            PARTITION BY session_sk 
            ORDER BY CASE WHEN finishing_position IS NULL THEN 1 ELSE 0 END, finishing_position ASC
        ) AS fp_gap_seconds,

        ABS(lap_time_seconds - LAG(lap_time_seconds, 1) OVER (
            PARTITION BY session_sk 
            ORDER BY CASE WHEN finishing_position IS NULL THEN 1 ELSE 0 END, finishing_position ASC
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
        USING(circuit_id)
    LEFT JOIN 
        event_qualifying_grid eqg
        ON eqg.event_sk = dim_schedule.event_sk AND eqg.driver_id = ranked_results.driver_id
    LEFT JOIN
        event_sprint_grid esg
        ON esg.event_sk = dim_schedule.event_sk AND esg.driver_id = ranked_results.driver_id
)

SELECT
    session_sk,
    driver_id,
    circuit_id,
    year,
    round_number,
    country,
    location,
    official_event_name,
    session_name,
    driver_full_name,
    driver_headshot_url,
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
                    {{ format_gap('fp_gap_seconds') }}
                ELSE '-'
            END
        WHEN finishing_position = 1 THEN 'Leader'
        WHEN 
            leader_laps > laps_completed 
            AND COALESCE(status, '') NOT LIKE '%Lap%' 
            AND status != 'Finished' 
            THEN status
        WHEN leader_laps > laps_completed THEN CONCAT('+', CAST(leader_laps - laps_completed AS STRING), ' Lap(s)')
        WHEN gap_seconds IS NOT NULL THEN {{ format_gap('gap_seconds') }}
        ELSE NULL
    END AS gap_to_leader,
    
    CASE 
        WHEN session_name NOT IN ('Race', 'Sprint') THEN
            CASE 
                WHEN finishing_position = 1 THEN '-'
                WHEN fp_interval_seconds IS NOT NULL THEN
                    {{ format_gap('fp_interval_seconds') }}
                ELSE '-'
            END
        WHEN finishing_position = 1 THEN '-'
        WHEN 
            leader_laps > laps_completed 
            AND COALESCE(status, '') NOT LIKE '%Lap%' 
            AND status != 'Finished' 
            THEN '-'
        WHEN ahead_laps > laps_completed THEN CONCAT('+', CAST(ahead_laps - laps_completed AS STRING), ' Lap(s)')
        WHEN interval_seconds IS NOT NULL THEN
            {{ format_gap('interval_seconds') }}
        ELSE '-'
    END AS interval_to_car_ahead,
    
    {{ format_lap_time('lap_time_seconds') }} AS best_lap,
    status,
    laps_completed
FROM 
    race_results_base
