{{ config(materialized='view', schema='website') }}

WITH season_competitive_totals AS (
    SELECT 
        year,
        SUM(competitive_gps) AS total_competitive_entries
    FROM 
        {{ ref('v_constructor_season_summary') }}
    GROUP BY 
        year
),

active_grid_season AS (
    SELECT 
        CASE 
            -- Se a temporada mais recente já teve sessões competitivas, ela é o grid ativo
            WHEN (
                SELECT total_competitive_entries 
                FROM season_competitive_totals 
                WHERE year = (SELECT MAX(year) FROM season_competitive_totals)
            ) > 0 
            THEN (SELECT MAX(year) FROM season_competitive_totals)
            -- Caso contrário (início de temporada novo com apenas treinos livres/pré-temporada), 
            -- faz fallback seguro para a temporada anterior com corridas oficiais
            ELSE (
                SELECT MAX(year) 
                FROM season_competitive_totals 
                WHERE total_competitive_entries > 0
            )
        END AS active_year
),

career_base AS (
    SELECT
        team_id,
        team_name,
        team_color,

        -- Participações e Temporadas
        SUM(total_gps) AS total_gps,
        COUNT(DISTINCT year) AS total_seasons,
        MIN(year) AS first_season,
        MAX(year) AS last_season,

        -- Participação em sessões competitivas na temporada ativa (com fallback automático)
        SUM(CASE 
            WHEN year = (SELECT active_year FROM active_grid_season) 
            THEN competitive_gps 
            ELSE 0 
        END) AS active_season_competitive_gps,

        -- Títulos Mundiais (apenas temporadas concluídas)
        COUNT(CASE WHEN championship_position = 1 AND is_season_completed THEN 1 END) AS total_world_championships,

        -- Vitórias
        SUM(race_wins) AS race_wins,
        SUM(sprint_wins) AS sprint_wins,
        SUM(total_wins) AS total_wins,
        SUM(total_one_two) AS total_one_two,

        -- Pole Positions
        SUM(race_poles) AS race_poles,
        SUM(sprint_poles) AS sprint_poles,
        SUM(total_front_row) AS total_front_row,
        SUM(poles_to_win) AS total_poles_to_win,
        
        ROUND((CAST(SUM(poles_to_win) AS NUMERIC) / NULLIF(SUM(race_poles), 0)) * 100, 2) AS pole_to_win_rate,

        -- Pódios
        SUM(race_podiums) AS race_podiums,
        SUM(sprint_podiums) AS sprint_podiums,
        SUM(total_podiums) AS total_podiums,
        SUM(total_double_podium) AS total_double_podium,
        
        -- Aparições nas qualis
        SUM(q2_appearences) AS total_q2_appearences,
        SUM(q3_appearences) AS total_q3_appearences,

        -- Voltas Mais Rápidas
        SUM(fastest_laps) AS total_fastest_laps,

        -- Pontos
        SUM(total_double_points) AS total_double_points,
        SUM(race_points) AS race_points,
        SUM(sprint_points) AS sprint_points,
        SUM(total_points) AS total_points,

        -- Melhores Resultados
        MIN(best_finish_position) AS best_finish_position,
        MIN(best_grid_position) AS best_grid_position,

        -- Abandonos (DNFs)
        SUM(total_dnfs) AS total_dnfs
    FROM
        {{ ref('v_constructor_season_summary') }}
    GROUP BY
        team_id,
        team_name,
        team_color
)

SELECT
    career_base.*,
    
    -- Status de Atividade (Grid atual: participou de sessão competitiva no ano ativo)
    CASE 
        WHEN career_base.active_season_competitive_gps > 0 
        THEN TRUE 
        ELSE FALSE 
    END AS is_active,

    -- Rankings Históricos
    DENSE_RANK() OVER (ORDER BY total_world_championships DESC) AS rank_world_championships,
    DENSE_RANK() OVER (ORDER BY race_wins DESC) AS rank_race_wins,
    DENSE_RANK() OVER (ORDER BY sprint_wins DESC) AS rank_sprint_wins,
    DENSE_RANK() OVER (ORDER BY total_wins DESC) AS rank_total_wins,
    DENSE_RANK() OVER (ORDER BY race_poles DESC) AS rank_poles,
    DENSE_RANK() OVER (ORDER BY race_podiums DESC) AS rank_race_podiums,
    DENSE_RANK() OVER (ORDER BY sprint_podiums DESC) AS rank_sprint_podiums,
    DENSE_RANK() OVER (ORDER BY total_podiums DESC) AS rank_total_podiums,
    DENSE_RANK() OVER (ORDER BY total_gps DESC) AS rank_gps,
    DENSE_RANK() OVER (ORDER BY total_seasons DESC) AS rank_seasons,
    DENSE_RANK() OVER (ORDER BY total_q3_appearences DESC) AS rank_q3_appearences,
    DENSE_RANK() OVER (ORDER BY total_q2_appearences DESC) AS rank_q2_appearences,
    DENSE_RANK() OVER (ORDER BY total_points DESC) AS rank_points
FROM
    career_base
ORDER BY
    total_points DESC