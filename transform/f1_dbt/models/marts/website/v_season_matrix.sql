{{ config(materialized='view', schema='website') }}

WITH event_sessions_stats AS (
    SELECT 
        event_sk,
        COUNT(DISTINCT session_sk) AS completed_sessions_count
    FROM 
        {{ ref('dim_sessions') }}
    JOIN 
        {{ ref('fact_results') }}
        USING (session_sk)
    GROUP BY 
        event_sk
),

race_fastest_laps AS (
    SELECT 
        event_sk,
        driver_id,
        MIN(lap_time_seconds) AS best_lap,
        ROW_NUMBER() OVER (
            PARTITION BY event_sk 
            ORDER BY MIN(lap_time_seconds) ASC
        ) AS lap_rank
    FROM 
        {{ ref('fact_laps') }}
    JOIN 
        {{ ref('dim_sessions') }}
        USING (session_sk)
    WHERE 
        session_name = 'Race' 
        AND lap_time_seconds IS NOT NULL
    GROUP BY 
        event_sk, 
        driver_id
),

overall_fastest_lap AS (
    SELECT 
        event_sk, 
        driver_id
    FROM 
        race_fastest_laps
    WHERE 
        lap_rank = 1
),

sprint_results AS (
    SELECT
        event_sk,
        driver_id,
        team_id,
        grid_position AS sprint_grid_position,
        finishing_position AS sprint_finishing_position,
        status AS sprint_status,
        classification_status AS sprint_classification_status,
        classified_position AS sprint_classified_position,
        points AS sprint_points
    FROM 
        {{ ref('fact_results') }}
    JOIN 
        {{ ref('dim_sessions') }} 
        USING (session_sk)
    WHERE 
        session_name = 'Sprint'
),

race_results AS (
    SELECT
        schedule.event_sk,
        results.driver_id,
        results.team_id,
        results.driver_number,
        results.grid_position,
        results.finishing_position,
        results.status,
        results.classification_status,
        results.classified_position,
        results.laps_completed,
        results.points AS race_points,
        (results.grid_position = 1) AS is_pole,
        (fastest_lap.driver_id IS NOT NULL) AS is_fastest_lap
    FROM 
        {{ ref('fact_results') }} AS results
    JOIN 
        {{ ref('dim_sessions') }} AS sessions
        USING (session_sk)
    JOIN 
        {{ ref('dim_schedule') }} AS schedule
        USING (event_sk)
    LEFT JOIN 
        overall_fastest_lap AS fastest_lap
        ON schedule.event_sk = fastest_lap.event_sk
        AND results.driver_id = fastest_lap.driver_id
    WHERE 
        sessions.session_name = 'Race'
),

driver_totals AS (
    SELECT
        schedule.year,
        results.driver_id,
        SUM(results.points) AS total_driver_points,
        COUNT(CASE WHEN results.finishing_position = 1 AND sessions.session_name = 'Race' THEN 1 END) AS total_driver_wins,
        COUNT(CASE WHEN results.finishing_position <= 3 AND sessions.session_name = 'Race' THEN 1 END) AS total_driver_podiums
    FROM 
        {{ ref('fact_results') }} AS results
    JOIN 
        {{ ref('dim_sessions') }} AS sessions
        USING (session_sk)
    JOIN 
        {{ ref('dim_schedule') }} AS schedule
        USING (event_sk)
    WHERE 
        results.points IS NOT NULL
    GROUP BY 
        schedule.year, 
        results.driver_id
),

driver_championship_rank AS (
    SELECT
        year,
        driver_id,
        total_driver_points,
        total_driver_wins,
        total_driver_podiums,
        DENSE_RANK() OVER (
            PARTITION BY year 
            ORDER BY total_driver_points DESC, total_driver_wins DESC, total_driver_podiums DESC
        ) AS championship_position
    FROM 
        driver_totals
),

season_drivers_teams AS (
    SELECT 
        schedule.year,
        results.driver_id,
        results.team_id,
        MAX(results.driver_number) AS driver_number
    FROM 
        {{ ref('fact_results') }} AS results
    JOIN 
        {{ ref('dim_sessions') }} AS sessions
        USING (session_sk)
    JOIN 
        {{ ref('dim_schedule') }} AS schedule
        USING (event_sk)
    WHERE 
        schedule.round_number >= 1
        AND (
            sessions.session_name IN ('Race', 'Sprint')
            OR NOT EXISTS (
                SELECT 1 
                FROM 
                    {{ ref('fact_results') }} AS sub_results
                JOIN 
                    {{ ref('dim_sessions') }} AS sub_sessions
                    USING (session_sk)
                JOIN 
                    {{ ref('dim_schedule') }} AS sub_schedule
                    USING (event_sk)
                WHERE 
                    sub_schedule.year = schedule.year 
                    AND sub_sessions.session_name IN ('Race', 'Sprint')
            )
        )
    GROUP BY 
        schedule.year, 
        results.driver_id, 
        results.team_id
),

season_rounds AS (
    SELECT
        schedule.event_sk,
        schedule.circuit_sk,
        schedule.year,
        schedule.round_number,
        schedule.official_event_name,
        circuits.country,
        circuits.location,
        circuits.event_name,
        EXISTS (
            SELECT 
                1 
            FROM 
                {{ ref('dim_sessions') }} AS sprint_sessions 
            WHERE 
                sprint_sessions.event_sk = schedule.event_sk 
                AND sprint_sessions.session_name = 'Sprint'
        ) AS has_sprint,
        CASE
            WHEN EXISTS (
                SELECT 
                    1 
                FROM 
                    race_results AS sub_race 
                WHERE 
                    sub_race.event_sk = schedule.event_sk 
                    AND sub_race.finishing_position = 1
            ) THEN 'Completed'
            WHEN COALESCE(session_stats.completed_sessions_count, 0) > 0 THEN 'In Progress'
            ELSE 'Scheduled'
        END AS round_status,
        UPPER(SUBSTRING(COALESCE(circuits.country, circuits.location, 'GP'), 1, 3)) AS circuit_short_code
    FROM 
        {{ ref('dim_schedule') }} AS schedule
    JOIN 
        {{ ref('dim_circuits') }} AS circuits 
        USING (circuit_sk)
    LEFT JOIN 
        event_sessions_stats AS session_stats 
        USING (event_sk)
    WHERE 
        schedule.round_number >= 1
)

SELECT 
    season_drivers.year,
    rounds.round_number,
    rounds.circuit_sk,
    rounds.country,
    rounds.location,
    rounds.official_event_name,
    rounds.circuit_short_code,
    rounds.round_status,
    rounds.has_sprint,
    season_drivers.driver_id,
    drivers.driver_full_name,
    drivers.driver_abbreviation,
    season_drivers.driver_number,
    drivers.driver_nationality,
    drivers.driver_headshot_url,
    season_drivers.team_id,
    constructors.team_name,
    constructors.team_color,
    championship_rank.championship_position,
    COALESCE(championship_rank.total_driver_points, 0) AS total_driver_points,
    COALESCE(championship_rank.total_driver_wins, 0) AS total_driver_wins,
    COALESCE(championship_rank.total_driver_podiums, 0) AS total_driver_podiums,
    (race_results.driver_id IS NOT NULL) AS is_participated,
    race_results.grid_position AS race_grid_position,
    race_results.finishing_position AS race_finishing_position,
    race_results.status AS race_status,
    race_results.classification_status,
    race_results.classified_position,
    race_results.laps_completed,
    COALESCE(race_results.race_points, 0) AS race_points,
    sprint_results.sprint_grid_position,
    sprint_results.sprint_finishing_position,
    COALESCE(sprint_results.sprint_points, 0) AS sprint_points,
    COALESCE(race_results.race_points, 0) + COALESCE(sprint_results.sprint_points, 0) AS total_round_points,
    COALESCE(race_results.is_pole, FALSE) AS is_pole,
    COALESCE(race_results.is_fastest_lap, FALSE) AS is_fastest_lap,
    
    -- Categoria e Código da Corrida Principal (CP)
    CASE
        WHEN rounds.round_status = 'Scheduled' THEN 'scheduled'
        WHEN rounds.round_status = 'In Progress' AND race_results.finishing_position IS NULL THEN 'in_progress'
        WHEN race_results.driver_id IS NULL THEN 'not_participated'
        WHEN race_results.classification_status LIKE '%Disqual%' OR race_results.classified_position = 'D' THEN 'dsq'
        WHEN race_results.classification_status = 'Withdrawn' OR race_results.classified_position = 'W' OR race_results.status IN ('Did not start', 'DNS') THEN 'dns'
        WHEN race_results.classification_status = 'Retired' OR race_results.classified_position = 'R' THEN 'retired'
        WHEN race_results.finishing_position = 1 THEN 'p1'
        WHEN race_results.finishing_position = 2 THEN 'p2'
        WHEN race_results.finishing_position = 3 THEN 'p3'
        WHEN race_results.finishing_position BETWEEN 4 AND 10 THEN 'points'
        ELSE 'no_points'
    END AS result_category,
    CASE
        WHEN rounds.round_status = 'Scheduled' THEN NULL
        WHEN rounds.round_status = 'In Progress' AND race_results.finishing_position IS NULL THEN '—'
        WHEN race_results.driver_id IS NULL THEN '—'
        WHEN race_results.classification_status LIKE '%Disqual%' OR race_results.classified_position = 'D' THEN 'DSQ'
        WHEN race_results.classification_status = 'Withdrawn' OR race_results.classified_position = 'W' OR race_results.status IN ('Did not start', 'DNS') THEN 'NL'
        WHEN race_results.classification_status = 'Retired' OR race_results.classified_position = 'R' THEN 'Ret'
        WHEN race_results.classification_status = 'Classified' AND race_results.status NOT IN ('Finished') AND race_results.status NOT LIKE '%Lap%' THEN race_results.finishing_position::text || '†'
        WHEN race_results.finishing_position IS NOT NULL THEN race_results.finishing_position::text
        ELSE '—'
    END AS result_code,

    -- Categoria e Código da Corrida Sprint (CS)
    CASE
        WHEN NOT rounds.has_sprint THEN NULL
        WHEN rounds.round_status = 'Scheduled' THEN 'scheduled'
        WHEN sprint_results.driver_id IS NULL AND rounds.round_status = 'Completed' THEN 'not_participated'
        WHEN sprint_results.driver_id IS NULL THEN 'in_progress'
        WHEN sprint_results.sprint_classification_status LIKE '%Disqual%' OR sprint_results.sprint_classified_position = 'D' THEN 'dsq'
        WHEN sprint_results.sprint_classification_status = 'Withdrawn' OR sprint_results.sprint_classified_position = 'W' OR sprint_results.sprint_status IN ('Did not start', 'DNS') THEN 'dns'
        WHEN sprint_results.sprint_classification_status = 'Retired' OR sprint_results.sprint_classified_position = 'R' THEN 'retired'
        WHEN sprint_results.sprint_finishing_position = 1 THEN 'p1'
        WHEN sprint_results.sprint_finishing_position = 2 THEN 'p2'
        WHEN sprint_results.sprint_finishing_position = 3 THEN 'p3'
        WHEN sprint_results.sprint_finishing_position BETWEEN 4 AND 8 THEN 'points'
        ELSE 'no_points'
    END AS sprint_result_category,
    CASE
        WHEN NOT rounds.has_sprint THEN NULL
        WHEN rounds.round_status = 'Scheduled' THEN NULL
        WHEN sprint_results.driver_id IS NULL AND rounds.round_status = 'Completed' THEN '—'
        WHEN sprint_results.driver_id IS NULL THEN '—'
        WHEN sprint_results.sprint_classification_status LIKE '%Disqual%' OR sprint_results.sprint_classified_position = 'D' THEN 'DSQ'
        WHEN sprint_results.sprint_classification_status = 'Withdrawn' OR sprint_results.sprint_classified_position = 'W' OR sprint_results.sprint_status IN ('Did not start', 'DNS') THEN 'NL'
        WHEN sprint_results.sprint_classification_status = 'Retired' OR sprint_results.sprint_classified_position = 'R' THEN 'Ret'
        WHEN sprint_results.sprint_classification_status = 'Classified' AND sprint_results.sprint_status NOT IN ('Finished') AND sprint_results.sprint_status NOT LIKE '%Lap%' THEN sprint_results.sprint_finishing_position::text || '†'
        WHEN sprint_results.sprint_finishing_position IS NOT NULL THEN sprint_results.sprint_finishing_position::text
        ELSE '—'
    END AS sprint_result_code

FROM 
    season_drivers_teams AS season_drivers
JOIN 
    season_rounds AS rounds 
    ON season_drivers.year = rounds.year
JOIN 
    {{ ref('dim_drivers') }} AS drivers 
    USING (driver_id)
JOIN 
    {{ ref('dim_constructors') }} AS constructors 
    USING (team_id)
LEFT JOIN 
    driver_championship_rank AS championship_rank 
    ON championship_rank.year = season_drivers.year 
    AND championship_rank.driver_id = season_drivers.driver_id
LEFT JOIN 
    race_results AS race_results 
    ON race_results.event_sk = rounds.event_sk 
    AND race_results.driver_id = season_drivers.driver_id 
    AND race_results.team_id = season_drivers.team_id
LEFT JOIN 
    sprint_results AS sprint_results 
    ON sprint_results.event_sk = rounds.event_sk 
    AND sprint_results.driver_id = season_drivers.driver_id 
    AND sprint_results.team_id = season_drivers.team_id
