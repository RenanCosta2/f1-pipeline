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
        sessions.event_sk,
        results.driver_id,
        results.finishing_position AS sprint_grid_position
    FROM 
        {{ ref('fact_results') }} AS results
    JOIN 
        {{ ref('dim_sessions') }} AS sessions 
        USING (session_sk)
    WHERE 
        sessions.session_name IN ('Sprint Qualifying', 'Sprint Shootout')
),

ranked_results AS (
    SELECT
        results.session_sk,
        results.driver_id,
        results.team_id,
        results.driver_number,
        results.points,
        results.grid_position,
        COALESCE(
            results.finishing_position,
            CASE 
                WHEN fastest_lap.lap_time_seconds IS NOT NULL THEN
                    DENSE_RANK() OVER (
                        PARTITION BY results.session_sk 
                        ORDER BY CASE WHEN fastest_lap.lap_time_seconds IS NULL THEN 1 ELSE 0 END, fastest_lap.lap_time_seconds ASC
                    )
            END
        ) AS finishing_position,
        fastest_lap.stops,
        results.q1_time_seconds,
        results.q2_time_seconds,
        results.q3_time_seconds,
        CASE 
            WHEN sessions.session_name IN ('Qualifying', 'Sprint Qualifying', 'Sprint Shootout') THEN
                COALESCE(
                    results.q3_time_seconds,
                    results.q2_time_seconds,
                    results.q1_time_seconds,
                    fastest_lap.lap_time_seconds
                )
            ELSE fastest_lap.lap_time_seconds
        END AS lap_time_seconds,
        results.status,
        results.laps_completed,
        final_time.final_session_time_seconds
    FROM
        {{ ref('fact_results') }} AS results
    JOIN
        {{ ref('dim_sessions') }} AS sessions
        USING(session_sk)
    LEFT JOIN 
        driver_session_fastest_lap AS fastest_lap
        USING(session_sk, driver_id, team_id)
    LEFT JOIN 
        driver_final_time AS final_time
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
                        WHEN dim_sessions.session_name = 'Sprint' THEN sprint_grid.sprint_grid_position
                        ELSE quali_grid.quali_grid_position
                    END
                )
            ELSE NULL
        END AS grid_position,
        CASE 
            WHEN dim_sessions.session_name IN ('Race', 'Sprint') THEN
                COALESCE(
                    ranked_results.grid_position,
                    CASE 
                        WHEN dim_sessions.session_name = 'Sprint' THEN sprint_grid.sprint_grid_position
                        ELSE quali_grid.quali_grid_position
                    END
                ) - finishing_position
            ELSE NULL
        END AS delta_position,
        stops,
        q1_time_seconds,
        q2_time_seconds,
        q3_time_seconds,
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
        event_qualifying_grid AS quali_grid
        ON quali_grid.event_sk = dim_schedule.event_sk 
        AND quali_grid.driver_id = ranked_results.driver_id
    LEFT JOIN
        event_sprint_grid AS sprint_grid
        ON sprint_grid.event_sk = dim_schedule.event_sk 
        AND sprint_grid.driver_id = ranked_results.driver_id
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
                WHEN fp_gap_seconds IS NOT NULL AND fp_gap_seconds >= 0 THEN
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
    
    {{ format_lap_time('q1_time_seconds') }} AS q1,
    {{ format_lap_time('q2_time_seconds') }} AS q2,
    {{ format_lap_time('q3_time_seconds') }} AS q3,
    {{ format_lap_time('lap_time_seconds') }} AS best_lap,
    status,
    laps_completed
FROM 
    race_results_base
