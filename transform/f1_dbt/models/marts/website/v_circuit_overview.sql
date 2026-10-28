{{ config(materialized='view', schema='website') }}

WITH circuit_stats AS (
    SELECT
        circuit_id,
        COUNT(CASE WHEN race_status = 'Completed' THEN 1 END) AS total_gps_completed,
        COUNT(round_number) AS total_gps_scheduled,
        MIN(year) AS first_gp_year,
        MAX(year) AS last_gp_year,
        STRING_AGG(DISTINCT year::TEXT, ', ' ORDER BY year::TEXT ASC) AS seasons_list,
        ARRAY_AGG(DISTINCT year ORDER BY year ASC) AS years_held,
        COALESCE(SUM(total_dnfs), 0) AS total_dnfs,
        ROUND(
            COALESCE(AVG(CASE WHEN race_status = 'Completed' THEN total_dnfs END), 0),
            1
        ) AS avg_dnfs_per_race
    FROM
        {{ ref('v_circuit_season_summary') }}
    GROUP BY
        circuit_id
),

-- 1. Piloto com mais Vitórias em GP
top_race_winners AS (
    SELECT DISTINCT ON (circuit_id)
        circuit_id,
        driver_id AS most_wins_driver_id,
        driver_full_name AS most_wins_driver,
        driver_abbreviation AS most_wins_driver_code,
        driver_nationality AS most_wins_driver_nationality,
        driver_headshot_url AS most_wins_driver_headshot_url,
        race_wins AS most_wins_count
    FROM 
        {{ ref('v_circuit_driver_performance') }}
    WHERE
        race_wins > 0
    ORDER BY
        circuit_id,
        race_wins DESC,
        last_year DESC
),

-- 2. Piloto com mais Pódios em GP
top_race_podiums AS (
    SELECT DISTINCT ON (circuit_id)
        circuit_id,
        driver_id AS most_podiums_driver_id,
        driver_full_name AS most_podiums_driver,
        driver_abbreviation AS most_podiums_driver_code,
        driver_nationality AS most_podiums_driver_nationality,
        driver_headshot_url AS most_podiums_driver_headshot_url,
        race_podiums AS most_podiums_count
    FROM 
        {{ ref('v_circuit_driver_performance') }}
    WHERE
        race_podiums > 0
    ORDER BY
        circuit_id,
        race_podiums DESC,
        last_year DESC
),

-- 3. Piloto com mais Pole Positions
top_poles AS (
    SELECT DISTINCT ON (circuit_id)
        circuit_id,
        driver_id AS most_poles_driver_id,
        driver_full_name AS most_poles_driver,
        driver_abbreviation AS most_poles_driver_code,
        driver_nationality AS most_poles_driver_nationality,
        driver_headshot_url AS most_poles_driver_headshot_url,
        race_poles AS most_poles_count
    FROM 
        {{ ref('v_circuit_driver_performance') }}
    WHERE
        race_poles > 0
    ORDER BY
        circuit_id,
        race_poles DESC,
        last_year DESC
),

-- 4. Piloto com mais Vitórias em Sprint
top_sprint_winners AS (
    SELECT DISTINCT ON (circuit_id)
        circuit_id,
        driver_id AS most_sprint_wins_driver_id,
        driver_full_name AS most_sprint_wins_driver,
        driver_abbreviation AS most_sprint_wins_driver_code,
        driver_nationality AS most_sprint_wins_driver_nationality,
        driver_headshot_url AS most_sprint_wins_driver_headshot_url,
        sprint_wins AS most_sprint_wins_count
    FROM 
        {{ ref('v_circuit_driver_performance') }}
    WHERE
        sprint_wins > 0
    ORDER BY
        circuit_id,
        sprint_wins DESC,
        last_year DESC
),

-- 5. Equipe com mais Vitórias no Circuito
circuit_team_wins AS (
    SELECT
        circuit_id,
        race_winner_team_id AS most_wins_team_id,
        race_winner_team AS most_wins_team,
        race_winner_team_color AS most_wins_team_color,
        COUNT(*) AS most_wins_team_count
    FROM
        {{ ref('v_circuit_season_summary') }}
    WHERE
        race_winner_team IS NOT NULL
        AND race_status = 'Completed'
    GROUP BY
        circuit_id,
        race_winner_team_id,
        race_winner_team,
        race_winner_team_color
),

top_team_wins AS (
    SELECT DISTINCT ON (circuit_id)
        circuit_id,
        most_wins_team_id,
        most_wins_team,
        most_wins_team_color,
        most_wins_team_count
    FROM
        circuit_team_wins
    ORDER BY
        circuit_id,
        most_wins_team_count DESC
),

-- 6. Volta Mais Rápida da História em Corrida (Recorde Oficial de Corrida)
race_lap_records AS (
    SELECT DISTINCT ON (schedule.circuit_id)
        schedule.circuit_id,
        drivers.driver_id AS race_lap_record_driver_id,
        drivers.driver_full_name AS race_lap_record_driver,
        drivers.driver_abbreviation AS race_lap_record_driver_code,
        drivers.driver_headshot_url AS race_lap_record_headshot_url,
        constructors.team_name AS race_lap_record_team,
        constructors.team_color AS race_lap_record_team_color,
        schedule.year AS race_lap_record_year,
        laps.lap_time_seconds AS race_lap_record_seconds,
        TO_CHAR(MAKE_INTERVAL(secs => laps.lap_time_seconds), 'FMMI:SS.MS') AS race_lap_record_formatted
    FROM 
        {{ ref('fact_laps') }} AS laps
    JOIN 
        {{ ref('dim_sessions') }} AS sessions USING (session_sk)
    JOIN 
        {{ ref('dim_schedule') }} AS schedule USING (event_sk)
    JOIN 
        {{ ref('dim_drivers') }} AS drivers USING (driver_id)
    JOIN 
        {{ ref('dim_constructors') }} AS constructors USING (team_id)
    WHERE 
        sessions.session_name = 'Race'
        AND laps.lap_time_seconds > 0
    ORDER BY 
        schedule.circuit_id,
        laps.lap_time_seconds ASC
),

-- 7. Volta Mais Rápida da História em Classificação (Recorde de Quali)
qualifying_lap_records AS (
    SELECT DISTINCT ON (schedule.circuit_id)
        schedule.circuit_id,
        drivers.driver_id AS quali_lap_record_driver_id,
        drivers.driver_full_name AS quali_lap_record_driver,
        drivers.driver_abbreviation AS quali_lap_record_driver_code,
        drivers.driver_headshot_url AS quali_lap_record_headshot_url,
        constructors.team_name AS quali_lap_record_team,
        constructors.team_color AS quali_lap_record_team_color,
        schedule.year AS quali_lap_record_year,
        laps.lap_time_seconds AS quali_lap_record_seconds,
        TO_CHAR(MAKE_INTERVAL(secs => laps.lap_time_seconds), 'FMMI:SS.MS') AS quali_lap_record_formatted
    FROM 
        {{ ref('fact_laps') }} AS laps
    JOIN 
        {{ ref('dim_sessions') }} AS sessions USING (session_sk)
    JOIN 
        {{ ref('dim_schedule') }} AS schedule USING (event_sk)
    JOIN 
        {{ ref('dim_drivers') }} AS drivers USING (driver_id)
    JOIN 
        {{ ref('dim_constructors') }} AS constructors USING (team_id)
    WHERE 
        sessions.session_name IN ('Qualifying', 'Sprint Qualifying', 'Sprint Shootout')
        AND laps.lap_time_seconds > 0
    ORDER BY 
        schedule.circuit_id,
        laps.lap_time_seconds ASC
)

SELECT
    -- Identificação e Localização do Circuito
    circuits.circuit_id,
    circuits.circuit_name,
    circuits.country,
    circuits.location,
    circuits.track_type,

    -- Estatísticas Gerais do Autódromo
    COALESCE(stats.total_gps_completed, 0) AS total_gps_completed,
    COALESCE(stats.total_gps_scheduled, 0) AS total_gps_scheduled,
    stats.first_gp_year,
    stats.last_gp_year,
    stats.seasons_list,
    stats.years_held,
    COALESCE(stats.total_dnfs, 0) AS total_dnfs,
    COALESCE(stats.avg_dnfs_per_race, 0) AS avg_dnfs_per_race,

    -- Equipe Mais Vitoriosa
    top_team_wins.most_wins_team_id,
    top_team_wins.most_wins_team,
    top_team_wins.most_wins_team_color,
    top_team_wins.most_wins_team_count,

    -- Piloto com Mais Vitórias em GP
    top_race_winners.most_wins_driver_id,
    top_race_winners.most_wins_driver,
    top_race_winners.most_wins_driver_code,
    top_race_winners.most_wins_driver_nationality,
    top_race_winners.most_wins_driver_headshot_url,
    top_race_winners.most_wins_count,

    -- Piloto com Mais Pódios em GP
    top_race_podiums.most_podiums_driver_id,
    top_race_podiums.most_podiums_driver,
    top_race_podiums.most_podiums_driver_code,
    top_race_podiums.most_podiums_driver_nationality,
    top_race_podiums.most_podiums_driver_headshot_url,
    top_race_podiums.most_podiums_count,

    -- Piloto com Mais Poles
    top_poles.most_poles_driver_id,
    top_poles.most_poles_driver,
    top_poles.most_poles_driver_code,
    top_poles.most_poles_driver_nationality,
    top_poles.most_poles_driver_headshot_url,
    top_poles.most_poles_count,

    -- Piloto com Mais Vitórias em Sprint
    top_sprint_winners.most_sprint_wins_driver_id,
    top_sprint_winners.most_sprint_wins_driver,
    top_sprint_winners.most_sprint_wins_driver_code,
    top_sprint_winners.most_sprint_wins_driver_nationality,
    top_sprint_winners.most_sprint_wins_driver_headshot_url,
    top_sprint_winners.most_sprint_wins_count,

    -- Recorde de Volta em Corrida
    race_lap_records.race_lap_record_driver_id,
    race_lap_records.race_lap_record_driver,
    race_lap_records.race_lap_record_driver_code,
    race_lap_records.race_lap_record_headshot_url,
    race_lap_records.race_lap_record_team,
    race_lap_records.race_lap_record_team_color,
    race_lap_records.race_lap_record_year,
    race_lap_records.race_lap_record_seconds,
    race_lap_records.race_lap_record_formatted,

    -- Recorde de Volta em Classificação (Quali)
    qualifying_lap_records.quali_lap_record_driver_id,
    qualifying_lap_records.quali_lap_record_driver,
    qualifying_lap_records.quali_lap_record_driver_code,
    qualifying_lap_records.quali_lap_record_headshot_url,
    qualifying_lap_records.quali_lap_record_team,
    qualifying_lap_records.quali_lap_record_team_color,
    qualifying_lap_records.quali_lap_record_year,
    qualifying_lap_records.quali_lap_record_seconds,
    qualifying_lap_records.quali_lap_record_formatted

FROM
    {{ ref('dim_circuits') }} AS circuits
LEFT JOIN
    circuit_stats AS stats USING (circuit_id)
LEFT JOIN
    top_team_wins USING (circuit_id)
LEFT JOIN
    top_race_winners USING (circuit_id)
LEFT JOIN
    top_race_podiums USING (circuit_id)
LEFT JOIN
    top_poles USING (circuit_id)
LEFT JOIN
    top_sprint_winners USING (circuit_id)
LEFT JOIN
    race_lap_records USING (circuit_id)
LEFT JOIN
    qualifying_lap_records USING (circuit_id)
ORDER BY
    circuits.circuit_name ASC
