import { Pool } from 'pg';
import {
  DriverStanding,
  ConstructorStanding,
  CumulativeDriverPoint,
  CumulativeTeamPoint,
  SessionSummary,
  TyreStrategy,
  LapByLap,
  RacePace,
  MaxSpeed,
  IdealLap,
  RaceWeekendInfo,
  SeasonRaceSummary,
  SeasonMatrixItem,
  DriverCatalogItem,
  DriverSeasonSummaryItem,
  DriverCircuitPerformanceItem,
  DriverRaceLogItem,
  ConstructorCatalogItem,
  ConstructorSeasonSummaryItem,
  ConstructorDriverSummaryItem,
  ConstructorRaceLogItem,
  CircuitOverviewItem
} from '@/types/f1';
import {
  mockDriverStandings,
  mockConstructorStandings,
  mockCumulativeDrivers,
  mockCumulativeTeams,
  mockSessionSummary,
  mockTyreStrategies,
  mockLapByLap,
  mockRacePace,
  mockMaxSpeed,
  mockIdealLap,
  mockUpcomingRace
} from './mockData';

const connectionString = process.env.POSTGRES_CONNECTION_URL || process.env.DATABASE_URL;

const globalForDb = globalThis as unknown as { pool?: Pool };
let pool: Pool | null = null;

if (connectionString) {
  if (!globalForDb.pool) {
    try {
      globalForDb.pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        min: 1,
        max: 4,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        statement_timeout: 15000,
      });
    } catch (e) {
      console.warn("Database connection pool creation failed, falling back to mock data.", e);
    }
  }
  pool = globalForDb.pool || null;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

async function queryOrFallback<T>(sql: string, params: any[], fallback: T, ttlMs: number = DEFAULT_TTL_MS): Promise<T> {
  const cacheKey = `${sql}::${JSON.stringify(params)}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  if (!pool) {
    return fallback;
  }
  try {
    const res = await pool.query(sql, params);
    if (res.rows && res.rows.length > 0) {
      const data = res.rows as unknown as T;
      cache.set(cacheKey, { data, expiresAt: now + ttlMs });
      return data;
    }
    // Quando pool está ativo e a query retorna 0 linhas, respeitamos os dados reais do banco (vazio)
    if (Array.isArray(fallback)) {
      const emptyData = [] as unknown as T;
      cache.set(cacheKey, { data: emptyData, expiresAt: now + ttlMs });
      return emptyData;
    }
    return fallback;
  } catch (error) {
    console.warn(`Query failed, returning fallback for: ${sql.slice(0, 70)}...`, error);
    if (Array.isArray(fallback)) {
      return [] as unknown as T;
    }
    return fallback;
  }
}

let cachedYears: { data: number[]; expiresAt: number } | null = null;

export async function getAvailableYears(): Promise<number[]> {
  const now = Date.now();
  if (cachedYears && cachedYears.expiresAt > now) {
    return cachedYears.data;
  }
  const sql = `SELECT DISTINCT year FROM website.v_driver_standings ORDER BY year DESC`;
  try {
    if (pool) {
      const res = await pool.query(sql);
      if (res.rows && res.rows.length > 0) {
        const years = res.rows.map((r: any) => parseInt(r.year));
        cachedYears = { data: years, expiresAt: now + 30 * 1000 };
        return years;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch available years, returning defaults.", e);
  }
  return [2026, 2025, 2024, 2023, 2022];
}

export async function getLatestSeasonYear(): Promise<number> {
  const years = await getAvailableYears();
  return years[0] || 2026;
}

export async function getDriverStandings(year?: number): Promise<DriverStanding[]> {
  const targetYear = year || await getLatestSeasonYear();
  const sql = `
    SELECT * 
    FROM website.v_driver_standings 
    WHERE year = $1 
    ORDER BY championship_position ASC
  `;
  const rows = await queryOrFallback<any[]>(sql, [targetYear], mockDriverStandings);

  return rows.map((r, index) => ({
    ...r,
    team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : null,
    sprint_wins: Number(r.sprint_wins) || 0,
    race_wins: Number(r.race_wins) || 0,
    total_wins: Number(r.total_wins) || 0,
    sprint_podiums: Number(r.sprint_podiums) || 0,
    race_podiums: Number(r.race_podiums) || 0,
    total_podiums: Number(r.total_podiums) || 0,
    total_points: Number(r.total_points) || 0,
    sprint_points: Number(r.sprint_points) || 0,
    race_points: Number(r.race_points) || 0,
    championship_position: Number(r.championship_position) || (index + 1)
  }));
}

export async function getConstructorStandings(year?: number): Promise<ConstructorStanding[]> {
  const targetYear = year || await getLatestSeasonYear();
  const sql = `
    SELECT * FROM website.v_constructor_standings 
    WHERE year = $1 
    ORDER BY championship_position ASC
  `;
  const rows = await queryOrFallback<any[]>(sql, [targetYear], mockConstructorStandings);

  return rows.map((r, index) => ({
    ...r,
    team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : null,
    sprint_wins: Number(r.sprint_wins) || 0,
    race_wins: Number(r.race_wins) || 0,
    total_wins: Number(r.total_wins) || 0,
    sprint_podiums: Number(r.sprint_podiums) || 0,
    race_podiums: Number(r.race_podiums) || 0,
    total_podiums: Number(r.total_podiums) || 0,
    total_points: Number(r.total_points) || 0,
    sprint_points: Number(r.sprint_points) || 0,
    race_points: Number(r.race_points) || 0,
    championship_position: Number(r.championship_position) || (index + 1)
  }));
}

export async function getSeasonRacesSummary(year?: number): Promise<SeasonRaceSummary[]> {
  const targetYear = year || await getLatestSeasonYear();
  const sql = `
    SELECT * 
    FROM website.v_circuit_season_summary 
    WHERE year = $1 
    ORDER BY round_number ASC
  `;
  const rows = await queryOrFallback<any[]>(sql, [targetYear], []);
  return rows.map((r) => {
    const raceWinnerTeamColor = r.race_winner_team_color
      ? (r.race_winner_team_color.startsWith('#') ? r.race_winner_team_color : `#${r.race_winner_team_color}`)
      : null;
    const sprintWinnerTeamColor = r.sprint_winner_team_color
      ? (r.sprint_winner_team_color.startsWith('#') ? r.sprint_winner_team_color : `#${r.sprint_winner_team_color}`)
      : null;
    const fastestLapTeamColor = r.fastest_lap_team_color
      ? (r.fastest_lap_team_color.startsWith('#') ? r.fastest_lap_team_color : `#${r.fastest_lap_team_color}`)
      : null;

    return {
      ...r,
      round_number: Number(r.round_number),
      total_dnfs: r.total_dnfs != null ? Number(r.total_dnfs) : 0,
      completed_sessions_count: r.completed_sessions_count != null ? Number(r.completed_sessions_count) : 0,

      // Format team colors
      race_winner_team_color: raceWinnerTeamColor,
      sprint_winner_team_color: sprintWinnerTeamColor,
      fastest_lap_team_color: fastestLapTeamColor,

      // Numbers
      race_winner_number: r.race_winner_number != null ? Number(r.race_winner_number) : null,
      race_laps_completed: r.race_laps_completed != null ? Number(r.race_laps_completed) : null,
      race_total_time_seconds: r.race_total_time_seconds != null ? Number(r.race_total_time_seconds) : null,

      sprint_winner_number: r.sprint_winner_number != null ? Number(r.sprint_winner_number) : null,
      sprint_laps_completed: r.sprint_laps_completed != null ? Number(r.sprint_laps_completed) : null,
      sprint_total_time_seconds: r.sprint_total_time_seconds != null ? Number(r.sprint_total_time_seconds) : null,

      fastest_lap_time_seconds: r.fastest_lap_time_seconds != null ? Number(r.fastest_lap_time_seconds) : null,

      // Aliases retrocompatíveis
      driver_id: r.race_winner_driver_id || null,
      winner_name: r.race_winner_driver || null,
      winner_code: r.race_winner_code || null,
      winner_headshot_url: r.race_winner_headshot_url || null,
      winner_number: r.race_winner_number != null ? Number(r.race_winner_number) : null,
      team_id: r.race_winner_team_id || null,
      team_name: r.race_winner_team || null,
      team_color: raceWinnerTeamColor,
      laps_completed: r.race_laps_completed != null ? Number(r.race_laps_completed) : null,
      total_time_seconds: r.race_total_time_seconds != null ? Number(r.race_total_time_seconds) : null,
      time_formatted: r.race_time_formatted || null,
    };
  });
}

export async function getSeasonMatrix(year?: number): Promise<SeasonMatrixItem[]> {
  const targetYear = year || await getLatestSeasonYear();
  const sql = `
    SELECT * 
    FROM website.v_season_matrix 
    WHERE year = $1 
    ORDER BY championship_position ASC, round_number ASC
  `;
  const rows = await queryOrFallback<any[]>(sql, [targetYear], []);
  return rows.map((r) => ({
    ...r,
    year: Number(r.year),
    round_number: Number(r.round_number),
    driver_number: r.driver_number != null ? Number(r.driver_number) : null,
    championship_position: Number(r.championship_position) || 0,
    total_driver_points: Number(r.total_driver_points) || 0,
    total_driver_wins: Number(r.total_driver_wins) || 0,
    total_driver_podiums: Number(r.total_driver_podiums) || 0,
    is_participated: Boolean(r.is_participated),
    has_sprint: Boolean(r.has_sprint),
    race_grid_position: r.race_grid_position != null ? Number(r.race_grid_position) : null,
    race_finishing_position: r.race_finishing_position != null ? Number(r.race_finishing_position) : null,
    laps_completed: r.laps_completed != null ? Number(r.laps_completed) : null,
    race_points: Number(r.race_points) || 0,
    sprint_grid_position: r.sprint_grid_position != null ? Number(r.sprint_grid_position) : null,
    sprint_finishing_position: r.sprint_finishing_position != null ? Number(r.sprint_finishing_position) : null,
    sprint_points: Number(r.sprint_points) || 0,
    total_round_points: Number(r.total_round_points) || 0,
    is_pole: Boolean(r.is_pole),
    is_fastest_lap: Boolean(r.is_fastest_lap),
    team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : null,
    result_code: r.result_code || null,
    result_category: r.result_category || 'not_participated',
    sprint_result_code: r.sprint_result_code || null,
    sprint_result_category: r.sprint_result_category || null,
  }));
}

export async function getCumulativeDrivers(year?: number): Promise<CumulativeDriverPoint[]> {
  const targetYear = year || await getLatestSeasonYear();
  const sql = `
    SELECT * FROM website.v_cumulative_drivers_points 
    WHERE year = $1 
    ORDER BY round_number ASC
  `;
  const rows = await queryOrFallback<CumulativeDriverPoint[]>(sql, [targetYear], mockCumulativeDrivers);
  return rows.map((r) => ({
    ...r,
    team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : null,
    round_number: Number(r.round_number) || 0,
    finishing_position: r.finishing_position != null ? Number(r.finishing_position) : null,
    is_race_win: Number(r.is_race_win) || (r.session_name === 'Race' && r.finishing_position === 1 ? 1 : 0),
    is_sprint_win: Number(r.is_sprint_win) || (r.session_name === 'Sprint' && r.finishing_position === 1 ? 1 : 0),
    is_race_podium: Number(r.is_race_podium) || (r.session_name === 'Race' && r.finishing_position != null && Number(r.finishing_position) <= 3 ? 1 : 0),
    is_sprint_podium: Number(r.is_sprint_podium) || (r.session_name === 'Sprint' && r.finishing_position != null && Number(r.finishing_position) <= 3 ? 1 : 0),
    is_win: Number(r.is_win) || (r.finishing_position === 1 ? 1 : 0),
    is_podium: Number(r.is_podium) || (r.finishing_position != null && Number(r.finishing_position) <= 3 ? 1 : 0),
    points: Number(r.points) || 0,
    cumulative_driver_points: Number(r.cumulative_driver_points) || 0
  }));
}

export async function getCumulativeTeams(year?: number): Promise<CumulativeTeamPoint[]> {
  const targetYear = year || await getLatestSeasonYear();
  const sql = `
    SELECT * FROM website.v_cumulative_teams_points 
    WHERE year = $1 
    ORDER BY round_number ASC
  `;
  const rows = await queryOrFallback<CumulativeTeamPoint[]>(sql, [targetYear], mockCumulativeTeams);
  return rows.map((r) => ({
    ...r,
    team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : null,
    round_number: Number(r.round_number) || 0,
    race_wins: Number(r.race_wins) || 0,
    sprint_wins: Number(r.sprint_wins) || 0,
    race_podiums: Number(r.race_podiums) || 0,
    sprint_podiums: Number(r.sprint_podiums) || 0,
    wins: Number(r.wins) || 0,
    podiums: Number(r.podiums) || 0,
    points: Number(r.points) || 0,
    cumulative_team_points: Number(r.cumulative_team_points) || 0
  }));
}

export async function getLatestCompletedRound(year?: number): Promise<number> {
  const targetYear = year || await getLatestSeasonYear();
  const sql = `
    SELECT MAX(round_number) AS max_round
    FROM website.v_circuit_season_summary
    WHERE year = $1 AND race_status = 'Completed'
  `;
  try {
    const rows = await queryOrFallback<{ max_round: string | number }[]>(sql, [targetYear], []);
    if (rows && rows.length > 0 && rows[0]?.max_round) {
      return parseInt(String(rows[0].max_round));
    }
  } catch (e) {
    console.warn("Failed to get latest round, fallback to 16", e);
  }
  return targetYear === 2026 ? 16 : 21;
}

export async function getActiveWeekendInfo(year?: number, knownLatestCompleted?: number): Promise<{ round: number; isLiveWeekend: boolean }> {
  const targetYear = year || await getLatestSeasonYear();
  const latestCompleted = knownLatestCompleted !== undefined ? knownLatestCompleted : await getLatestCompletedRound(targetYear);

  try {
    if (pool) {
      const sql = `
        SELECT 
          dsch.round_number,
          MIN(dses.session_date_utc) as first_session,
          MAX(dses.session_date_utc) as last_session
        FROM gold.dim_schedule dsch
        JOIN gold.dim_sessions dses USING(event_sk)
        WHERE dsch.year = $1 AND dsch.round_number > 0
        GROUP BY dsch.round_number
        ORDER BY dsch.round_number ASC
      `;
      const rows = await queryOrFallback<any[]>(sql, [targetYear], [], 10 * 60 * 1000);
      if (rows && rows.length > 0) {
        const now = new Date();

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const firstSessionDate = new Date(r.first_session);
          const lastSessionDate = new Date(r.last_session);

          // O fim de semana da etapa começa pelo menos 3 dias (72h) antes da 1ª sessão (TL1)
          const weekendStart = new Date(firstSessionDate.getTime() - 3 * 24 * 60 * 60 * 1000);

          let nextWeekendStart: Date;
          if (i + 1 < rows.length) {
            const nextFirstSession = new Date(rows[i + 1].first_session);
            nextWeekendStart = new Date(nextFirstSession.getTime() - 3 * 24 * 60 * 60 * 1000);
          } else {
            nextWeekendStart = new Date(targetYear + 1, 0, 1);
          }

          if (now >= weekendStart && now < nextWeekendStart) {
            const isLiveWeekend = now >= weekendStart && now <= new Date(lastSessionDate.getTime() + 12 * 60 * 60 * 1000);
            return {
              round: parseInt(r.round_number),
              isLiveWeekend
            };
          }
        }
      }
    }
  } catch (e) {
    console.warn("Failed to get active weekend round, falling back to latest completed", e);
  }

  return { round: latestCompleted || 14, isLiveWeekend: false };
}

export async function getActiveWeekendRound(year?: number): Promise<number> {
  const info = await getActiveWeekendInfo(year);
  return info.round;
}

export async function getAvailableRounds(year?: number): Promise<{ round_number: number; official_event_name: string }[]> {
  const targetYear = year || await getLatestSeasonYear();
  const sql = `
    SELECT DISTINCT round_number, official_event_name 
    FROM website.v_sessions_summary 
    WHERE year = $1 AND session_name = 'Race'
    ORDER BY round_number ASC
  `;
  const rows = await queryOrFallback<{ round_number: any; official_event_name: string }[]>(sql, [targetYear], []);
  if (rows && rows.length > 0) {
    return rows.map((r) => ({
      round_number: parseInt(r.round_number),
      official_event_name: r.official_event_name
    }));
  }
  return [
    { round_number: 1, official_event_name: "Australian Grand Prix" },
    { round_number: 14, official_event_name: "Gran Premio de España" }
  ];
}

export async function getAvailableSessions(year?: number, roundNumber?: number): Promise<string[]> {
  const targetYear = year || await getLatestSeasonYear();
  const targetRound = roundNumber || await getLatestCompletedRound(targetYear);

  // 1. Tenta ordenar pelo session_number cronológico oficial em gold.dim_sessions
  const sql = `
    SELECT DISTINCT 
      ds.session_name,
      ds.session_number
    FROM gold.dim_sessions ds
    JOIN gold.dim_schedule dsch USING(event_sk)
    JOIN website.v_sessions_summary sum 
      ON sum.session_name = ds.session_name 
      AND sum.year = dsch.year 
      AND sum.round_number = dsch.round_number
    WHERE dsch.year = $1 AND dsch.round_number = $2
    ORDER BY ds.session_number ASC
  `;
  const rows = await queryOrFallback<{ session_name: string; session_number?: number }[]>(
    sql,
    [targetYear, targetRound],
    []
  );

  if (rows && rows.length > 0) {
    return rows.map((r) => r.session_name);
  }

  // 2. Fallback caso a tabela dim_sessions não esteja acessível:
  const fallbackSql = `
    SELECT DISTINCT session_name 
    FROM website.v_sessions_summary
    WHERE year = $1 AND round_number = $2
  `;
  const fallbackRows = await queryOrFallback<{ session_name: string }[]>(
    fallbackSql,
    [targetYear, targetRound],
    []
  );

  const sessionNames = fallbackRows.map((r) => r.session_name);
  const hasSprint = sessionNames.some((s) => s.toLowerCase().includes("sprint"));

  // Ordem cronológica oficial da F1:
  // Se tem Sprint (F1 moderna 2024+): Treino Livre 1 -> Qualificação Sprint / Shootout -> Corrida Sprint -> Qualificação Principal -> Corrida
  // Se não tem Sprint: Treino Livre 1 -> Treino Livre 2 -> Treino Livre 3 -> Qualificação -> Corrida
  const sprintOrder = [
    'Practice 1',
    'Sprint Shootout',
    'Sprint Qualifying',
    'Sprint',
    'Practice 2', // Formato legado 2021-2022
    'Qualifying',
    'Race'
  ];

  const standardOrder = [
    'Practice 1',
    'Practice 2',
    'Practice 3',
    'Qualifying',
    'Race'
  ];

  const order = hasSprint ? sprintOrder : standardOrder;

  return sessionNames.sort((a, b) => {
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });
}

export async function getSessionSummary(year?: number, roundNumber?: number, sessionName: string = 'Race'): Promise<SessionSummary[]> {
  const targetYear = year || await getLatestSeasonYear();
  const targetRound = roundNumber || await getLatestCompletedRound(targetYear);

  const sql = `
    SELECT s.*, d.driver_headshot_url 
    FROM website.v_sessions_summary s
    LEFT JOIN gold.dim_drivers d ON d.driver_id = s.driver_id
    WHERE s.year = $1 AND s.round_number = $2 AND s.session_name = $3
    ORDER BY s.finishing_position ASC NULLS LAST
  `;
  const rows = await queryOrFallback<SessionSummary[]>(sql, [targetYear, targetRound, sessionName], []);
  return rows.map((r) => ({
    ...r,
    team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : null,
    finishing_position: r.finishing_position != null ? Number(r.finishing_position) : null,
    grid_position: r.grid_position != null ? Number(r.grid_position) : null,
    delta_position: r.delta_position != null ? Number(r.delta_position) : null,
    stops: r.stops != null ? Number(r.stops) : 0,
    points: r.points != null ? Number(r.points) : 0,
    laps_completed: r.laps_completed != null ? Number(r.laps_completed) : null,
    driver_headshot_url: r.driver_headshot_url || null,
  }));
}

export async function getTyreStrategies(year?: number, roundNumber?: number, sessionName: string = 'Race'): Promise<TyreStrategy[]> {
  const targetYear = year || await getLatestSeasonYear();
  const targetRound = roundNumber || await getLatestCompletedRound(targetYear);

  const sql = `
    SELECT t.*, d.driver_headshot_url 
    FROM website.v_tyre_strategy t
    LEFT JOIN gold.dim_drivers d ON d.driver_full_name = t.driver_full_name
    WHERE t.year = $1 AND t.round_number = $2 AND t.session_name = $3
    ORDER BY t.driver_full_name ASC, t.stint ASC
  `;
  const rows = await queryOrFallback<TyreStrategy[]>(sql, [targetYear, targetRound, sessionName], []);
  return rows.map((r) => ({
    ...r,
    stint: Number(r.stint) || 1,
    lap_start: Number(r.lap_start) || 1,
    lap_end: Number(r.lap_end) || 1,
    stint_laps_completed: Number(r.stint_laps_completed) || 0,
    driver_headshot_url: r.driver_headshot_url || null,
  }));
}

export async function getLapByLap(year?: number, roundNumber?: number, sessionName: string = 'Race'): Promise<LapByLap[]> {
  const targetYear = year || await getLatestSeasonYear();
  const targetRound = roundNumber || await getLatestCompletedRound(targetYear);

  const sql = `
    SELECT 
      l.lap_number,
      l.position,
      l.driver_abbreviation,
      l.driver_full_name,
      l.team_name,
      l.team_color,
      l.compound,
      l.tyre_life
    FROM website.v_lap_by_lap l
    WHERE l.year = $1 AND l.round_number = $2 AND l.session_name = $3
    ORDER BY l.lap_number ASC, l.position ASC
  `;
  const rows = await queryOrFallback<LapByLap[]>(sql, [targetYear, targetRound, sessionName], []);
  return rows.map((r) => ({
    ...r,
    team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : null,
    lap_number: Number(r.lap_number) || 0,
    position: r.position != null ? Number(r.position) : null,
    tyre_life: r.tyre_life != null ? Number(r.tyre_life) : null,
  }));
}

export async function getRacePace(year?: number, roundNumber?: number, sessionName: string = 'Race'): Promise<RacePace[]> {
  const targetYear = year || await getLatestSeasonYear();
  const targetRound = roundNumber || await getLatestCompletedRound(targetYear);

  const sql = `
    SELECT r.*, d.driver_headshot_url 
    FROM website.v_race_pace r
    LEFT JOIN gold.dim_drivers d ON d.driver_full_name = r.driver_full_name
    WHERE r.year = $1 AND r.round_number = $2 AND r.session_name = $3
    ORDER BY r.avg_lap_time_seconds ASC
  `;
  const rows = await queryOrFallback<RacePace[]>(sql, [targetYear, targetRound, sessionName], []);
  return rows.map((r) => ({
    ...r,
    team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : null,
    avg_lap_time_seconds: Number(r.avg_lap_time_seconds) || 0,
    pace_stddev: r.pace_stddev != null ? Number(r.pace_stddev) : null,
    driver_headshot_url: r.driver_headshot_url || null,
  }));
}

export async function getTelemetrySessions(year?: number, roundNumber?: number): Promise<string[]> {
  const targetYear = year || await getLatestSeasonYear();
  const targetRound = roundNumber || await getLatestCompletedRound(targetYear);
  const sql = `
    SELECT DISTINCT session_name 
    FROM website.v_max_speed 
    WHERE year = $1 AND round_number = $2
    ORDER BY session_name
  `;
  const rows = await queryOrFallback<{ session_name: string }[]>(sql, [targetYear, targetRound], []);

  const order: { [key: string]: number } = {
    'Qualifying': 1,
    'Sprint Shootout': 2,
    'Sprint Qualifying': 2,
    'Sprint': 3,
    'Race': 4,
    'Practice 3': 5,
    'Practice 2': 6,
    'Practice 1': 7,
  };
  return rows.map((r) => r.session_name).sort((a, b) => (order[a] || 99) - (order[b] || 99));
}

export async function getMaxSpeed(year?: number, roundNumber?: number, sessionName: string = 'Qualifying'): Promise<MaxSpeed[]> {
  const targetYear = year || await getLatestSeasonYear();
  const targetRound = roundNumber || await getLatestCompletedRound(targetYear);

  const sql = `
    SELECT * FROM website.v_max_speed 
    WHERE year = $1 AND round_number = $2 AND session_name = $3
    ORDER BY max_speed_trap DESC NULLS LAST
  `;
  const rows = await queryOrFallback<MaxSpeed[]>(sql, [targetYear, targetRound, sessionName], []);
  return rows.map((r) => ({
    ...r,
    max_speed_trap: r.max_speed_trap != null ? Number(r.max_speed_trap) : null,
    max_speed_fl: r.max_speed_fl != null ? Number(r.max_speed_fl) : null,
    max_speed_i1: r.max_speed_i1 != null ? Number(r.max_speed_i1) : null,
    max_speed_i2: r.max_speed_i2 != null ? Number(r.max_speed_i2) : null,
  }));
}

export async function getIdealLap(year?: number, roundNumber?: number, sessionName: string = 'Qualifying'): Promise<IdealLap[]> {
  const targetYear = year || await getLatestSeasonYear();
  const targetRound = roundNumber || await getLatestCompletedRound(targetYear);

  const sql = `
    SELECT * FROM website.v_ideal_lap 
    WHERE year = $1 AND round_number = $2 AND session_name = $3
    ORDER BY lap_time ASC NULLS LAST
  `;
  return queryOrFallback<IdealLap[]>(sql, [targetYear, targetRound, sessionName], []);
}

export async function getUpcomingRaceInfo(year?: number, roundNumber?: number): Promise<RaceWeekendInfo> {
  const targetYear = year || await getLatestSeasonYear();
  const latestCompleted = await getLatestCompletedRound(targetYear);
  const targetRound = roundNumber !== undefined ? roundNumber : (latestCompleted + 1);

  const cacheKey = `upcomingRaceInfo::${targetYear}::${targetRound}`;
  const nowMs = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > nowMs) {
    return cached.data as RaceWeekendInfo;
  }

  try {
    if (pool) {
      // 1. Fetch round event info
      const eventRes = await pool.query(`
        SELECT 
          dsch.event_sk,
          dsch.round_number,
          dsch.official_event_name,
          dsch.event_date,
          dsch.circuit_id,
          dc.country,
          dc.location,
          dc.circuit_name
        FROM gold.dim_schedule dsch
        LEFT JOIN gold.dim_circuits dc USING(circuit_id)
        WHERE dsch.year = $1 AND dsch.round_number = $2
      `, [targetYear, targetRound]);

      if (eventRes.rows && eventRes.rows.length > 0) {
        const event = eventRes.rows[0];

        // 2. Fetch sessions for this event
        const sessRes = await pool.query(`
          SELECT 
            session_name,
            session_number,
            session_type,
            session_date_brt,
            session_date_utc
          FROM gold.dim_sessions
          WHERE event_sk = $1
          ORDER BY session_number ASC
        `, [event.event_sk]);

        // 2b. Check completed sessions in v_sessions_summary to attach real leader & best lap
        const completedRes = await pool.query(`
          SELECT session_name, driver_full_name, best_lap
          FROM website.v_sessions_summary
          WHERE year = $1 AND round_number = $2 AND finishing_position = 1
        `, [targetYear, targetRound]);

        const completedMap = new Map<string, { driver: string; lap: string }>();
        for (const row of completedRes.rows) {
          completedMap.set(row.session_name, { driver: row.driver_full_name, lap: row.best_lap });
        }

        const now = new Date();
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        const sessions = sessRes.rows.map((s: any, idx: number) => {
          const sDate = s.session_date_brt ? new Date(s.session_date_brt) : new Date();
          const day = sDate.getUTCDate();
          const month = months[sDate.getUTCMonth()];
          const hours = String(sDate.getUTCHours()).padStart(2, '0');
          const minutes = String(sDate.getUTCMinutes()).padStart(2, '0');

          let code = `S${idx + 1}`;
          if (s.session_name === 'Practice 1') code = 'FP1';
          else if (s.session_name === 'Practice 2') code = 'FP2';
          else if (s.session_name === 'Practice 3') code = 'FP3';
          else if (s.session_name === 'Qualifying') code = 'Q';
          else if (s.session_name === 'Race') code = 'R';
          else if (s.session_name === 'Sprint') code = 'SPR';
          else if (s.session_name === 'Sprint Shootout' || s.session_name === 'Sprint Qualifying') code = 'SS';

          const sessionResult = completedMap.get(s.session_name);
          // A sessão só é considerada concluída quando o pipeline processou e gravou os dados no banco
          const isCompleted = Boolean(sessionResult);

          const sessionDateUtc = s.session_date_utc ? new Date(s.session_date_utc) : sDate;
          // Se a data/hora da sessão já passou, mas os dados ainda não foram gravados no banco, está aguardando dados
          const isWaitingData = !isCompleted && now >= sessionDateUtc;

          return {
            name: s.session_name === 'Race' ? 'Grande Prêmio (Corrida)' :
              s.session_name === 'Qualifying' ? 'Classificação (Quali)' :
                s.session_name === 'Practice 1' ? 'Treino Livre 1 (FP1)' :
                  s.session_name === 'Practice 2' ? 'Treino Livre 2 (FP2)' :
                    s.session_name === 'Practice 3' ? 'Treino Livre 3 (FP3)' :
                      s.session_name,
            session_name: s.session_name,
            session_code: code,
            date: `${day} ${month}`,
            time: `${hours}:${minutes} BRT`,
            completed: isCompleted,
            waiting_data: isWaitingData,
            session_date_utc: s.session_date_utc ? new Date(s.session_date_utc).toISOString() : undefined,
            leader: sessionResult?.driver,
            best_lap: sessionResult?.lap
          };
        });

        // 2c. Compute race timestamp UTC for countdown timer
        const raceSession = sessRes.rows.find((s: any) => s.session_name === 'Race');
        const raceTimestampUtc = raceSession?.session_date_utc
          ? new Date(raceSession.session_date_utc).toISOString()
          : (event.event_date ? new Date(event.event_date).toISOString() : null);

        // 3. Query historical records for this circuit directly from pipeline tables
        let hasHistoricalData = false;
        let mostWins: { driver: string; drivers: string[]; count: number } = { driver: "—", drivers: [], count: 0 };
        let mostPoles: { driver: string; drivers: string[]; count: number } = { driver: "—", drivers: [], count: 0 };
        let raceLap = { lap: "—", driver: "—", year: 0 };
        let allTimeLap = { lap: "—", driver: "—", year: 0, session: "—" };
        let topSpeed = { speed: 0, driver: "—", year: 0 };
        let totalLaps = 0;

        if (event.circuit_id) {
          const overviewPromise = pool.query(`
            SELECT *
            FROM website.v_circuit_overview
            WHERE circuit_id = $1
            LIMIT 1
          `, [event.circuit_id]).catch(() => ({ rows: [] }));

          const speedTrapPromise = pool.query(`
            SELECT dd.driver_full_name, dsch.year, MAX(fl.speed_trap) as top_speed
            FROM gold.fact_laps fl
            JOIN gold.dim_sessions dses USING(session_sk)
            JOIN gold.dim_schedule dsch USING(event_sk)
            JOIN gold.dim_drivers dd USING(driver_id)
            WHERE dsch.circuit_id = $1 AND fl.speed_trap IS NOT NULL
            GROUP BY dd.driver_full_name, dsch.year
            ORDER BY top_speed DESC
            LIMIT 1
          `, [event.circuit_id]).catch(() => ({ rows: [] }));

          const totalLapsPromise = pool.query(`
            SELECT count(*) as total_laps
            FROM gold.fact_laps fl
            JOIN gold.dim_sessions dses USING(session_sk)
            JOIN gold.dim_schedule dsch USING(event_sk)
            WHERE dsch.circuit_id = $1 AND fl.lap_time_seconds IS NOT NULL
          `, [event.circuit_id]).catch(() => ({ rows: [] }));

          const [ovRes, speedRes, lapsRes] = await Promise.all([
            overviewPromise,
            speedTrapPromise,
            totalLapsPromise
          ]);

          if (ovRes.rows && ovRes.rows.length > 0) {
            const ov = ovRes.rows[0];
            hasHistoricalData = true;
            if (ov.most_wins_driver) {
              mostWins = {
                driver: ov.most_wins_driver,
                drivers: [ov.most_wins_driver],
                count: Number(ov.most_wins_count) || 0
              };
            }
            if (ov.most_poles_driver) {
              mostPoles = {
                driver: ov.most_poles_driver,
                drivers: [ov.most_poles_driver],
                count: Number(ov.most_poles_count) || 0
              };
            }
            if (ov.race_lap_record_formatted) {
              raceLap = {
                lap: ov.race_lap_record_formatted,
                driver: ov.race_lap_record_driver || "—",
                year: Number(ov.race_lap_record_year) || 0
              };
            }
            if (ov.quali_lap_record_formatted) {
              allTimeLap = {
                lap: ov.quali_lap_record_formatted,
                driver: ov.quali_lap_record_driver || "—",
                year: Number(ov.quali_lap_record_year) || 0,
                session: "Classificação"
              };
            }
          }

          if (lapsRes.rows && lapsRes.rows.length > 0 && Number(lapsRes.rows[0].total_laps) > 0) {
            totalLaps = parseInt(lapsRes.rows[0].total_laps);
            hasHistoricalData = true;
          }

          if (speedRes.rows && speedRes.rows.length > 0 && speedRes.rows[0].top_speed) {
            topSpeed = {
              speed: Number(speedRes.rows[0].top_speed),
              driver: speedRes.rows[0].driver_full_name,
              year: parseInt(speedRes.rows[0].year)
            };
          }
        }

        const loc = (event.location || "").toLowerCase();
        const country = (event.country || "").toLowerCase();

        let typicalStrategy = hasHistoricalData
          ? "1 a 2 Paradas (Médio ➔ Duro) balanceando degradação térmica e tempo no pit lane"
          : "Dados de estratégia e degradação serão calibrados após os primeiros treinos livres";

        if (loc.includes("baku") || country.includes("azerbaijan")) {
          typicalStrategy = "1 Parada (Médio ➔ Duro) com alta probabilidade de Safety Car devido às barreiras próximas e retas de 2.2 km";
        } else if (loc.includes("singapore") || country.includes("singapore")) {
          typicalStrategy = "1 Parada (Médio ➔ Duro) em corrida noturna com desgaste extremo de freios e 100% de probabilidade de SC";
        } else if (loc.includes("austin") || loc.includes("texas")) {
          typicalStrategy = "2 Paradas (Médio ➔ Duro ➔ Médio) devido às curvas de alta energia no primeiro setor";
        } else if (loc.includes("são paulo") || loc.includes("interlagos")) {
          typicalStrategy = "2 Paradas (Médio ➔ Duro ➔ Macio) com alta sensibilidade climática e curvas de tração";
        } else if (loc.includes("monza") || country.includes("italy")) {
          typicalStrategy = "1 Parada (Médio ➔ Duro) com baixa pressão aerodinâmica e alta velocidade de reta";
        } else if (loc.includes("silverstone") || country.includes("united kingdom")) {
          typicalStrategy = "2 Paradas (Médio ➔ Duro ➔ Duro) devido às curvas de alta carga lateral";
        }

        const evDate = event.event_date ? new Date(event.event_date) : new Date();
        const fullMonths = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const formattedEventDate = `${evDate.getUTCDate()} de ${fullMonths[evDate.getUTCMonth()]} de ${evDate.getUTCFullYear()}`;

        const result: RaceWeekendInfo = {
          round_number: parseInt(event.round_number),
          official_event_name: event.official_event_name,
          country: event.country || "Azerbaijan",
          location: event.location || "Baku",
          circuit_name: event.circuit_name || "Baku City Circuit",
          event_date: formattedEventDate,
          is_upcoming: targetRound > latestCompleted,
          race_timestamp_utc: raceTimestampUtc,
          sessions: sessions.length > 0 ? sessions : mockUpcomingRace.sessions,
          circuit_records: {
            has_historical_data: hasHistoricalData,
            lap_record: raceLap.lap,
            lap_record_holder: raceLap.driver,
            lap_record_year: raceLap.year,
            all_time_record: allTimeLap.lap,
            all_time_holder: allTimeLap.driver,
            all_time_year: allTimeLap.year,
            all_time_session: allTimeLap.session,
            max_speed_kmh: topSpeed.speed,
            max_speed_driver: topSpeed.driver,
            max_speed_year: topSpeed.year,
            total_laps_analyzed: totalLaps,
            most_wins_driver: mostWins.driver,
            most_wins_drivers: mostWins.drivers,
            most_wins_count: mostWins.count,
            most_poles_driver: mostPoles.driver,
            most_poles_drivers: mostPoles.drivers,
            most_poles_count: mostPoles.count,
            typical_strategy: typicalStrategy
          }
        };

        cache.set(cacheKey, { data: result, expiresAt: nowMs + DEFAULT_TTL_MS });
        return result;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch dynamic upcoming race info, falling back to mock.", e);
  }

  return mockUpcomingRace;
}

export async function getDriversCatalog(): Promise<DriverCatalogItem[]> {
  const sql = `
    WITH latest_season AS (
      SELECT MAX(year) AS max_year FROM website.v_driver_season_summary
    ),
    latest_teams AS (
      SELECT DISTINCT ON (driver_id)
        driver_id,
        year,
        team_name,
        team_color
      FROM website.v_driver_season_summary
      ORDER BY driver_id, year DESC
    )
    SELECT 
      c.driver_id,
      c.broadcast_name,
      c.driver_abbreviation,
      c.driver_full_name,
      c.driver_nationality,
      c.driver_headshot_url,
      lt.team_name,
      lt.team_color,
      c.is_active,
      c.total_world_championships,
      c.total_gps,
      c.total_seasons,
      c.first_season,
      c.last_season,
      c.total_wins,
      c.race_wins,
      c.sprint_wins,
      c.total_podiums,
      c.race_podiums,
      c.sprint_podiums,
      c.race_poles,
      c.total_fastest_laps,
      c.total_points,
      c.best_finish_position
    FROM website.v_driver_career_summary c
    LEFT JOIN latest_teams lt USING (driver_id)
    ORDER BY 
      c.total_world_championships DESC,
      c.total_wins DESC,
      c.total_podiums DESC,
      c.total_points DESC
  `;

  try {
    if (pool) {
      const res = await pool.query(sql);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((r: any) => ({
          ...r,
          total_world_championships: Number(r.total_world_championships) || 0,
          total_gps: Number(r.total_gps) || 0,
          total_seasons: Number(r.total_seasons) || 0,
          first_season: Number(r.first_season),
          last_season: Number(r.last_season),
          total_wins: Number(r.total_wins) || 0,
          race_wins: Number(r.race_wins) || 0,
          sprint_wins: Number(r.sprint_wins) || 0,
          total_podiums: Number(r.total_podiums) || 0,
          race_podiums: Number(r.race_podiums) || 0,
          sprint_podiums: Number(r.sprint_podiums) || 0,
          race_poles: Number(r.race_poles) || 0,
          total_fastest_laps: Number(r.total_fastest_laps) || 0,
          total_points: Number(r.total_points) || 0,
          best_finish_position: r.best_finish_position ? Number(r.best_finish_position) : undefined,
          team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : '#E10600',
          is_active: Boolean(r.is_active)
        }));
      }
    }
  } catch (e) {
    console.warn("Failed to fetch drivers catalog from db:", e);
  }

  return [];
}

export async function getDriverProfile(driverId: string): Promise<DriverCatalogItem | null> {
  const sql = `
    WITH latest_season AS (
      SELECT MAX(year) AS max_year FROM website.v_driver_season_summary
    ),
    latest_teams AS (
      SELECT DISTINCT ON (driver_id)
        driver_id,
        year,
        team_name,
        team_color
      FROM website.v_driver_season_summary
      ORDER BY driver_id, year DESC
    )
    SELECT 
      c.driver_id,
      c.broadcast_name,
      c.driver_abbreviation,
      c.driver_full_name,
      c.driver_nationality,
      c.driver_headshot_url,
      lt.team_name,
      lt.team_color,
      c.is_active,
      c.total_world_championships,
      c.total_gps,
      c.total_seasons,
      c.first_season,
      c.last_season,
      c.total_wins,
      c.race_wins,
      c.sprint_wins,
      c.total_poles_to_win,
      c.pole_to_win_rate,
      c.total_podiums,
      c.race_podiums,
      c.sprint_podiums,
      c.race_poles,
      c.sprint_poles,
      c.total_q2_appearences,
      c.total_q3_appearences,
      c.total_fastest_laps,
      c.total_points,
      c.best_finish_position,
      c.best_grid_position,
      c.total_dnfs,
      c.rank_world_championships,
      c.rank_race_wins,
      c.rank_sprint_wins,
      c.rank_total_wins,
      c.rank_poles,
      c.rank_race_podiums,
      c.rank_sprint_podiums,
      c.rank_total_podiums,
      c.rank_gps,
      c.rank_seasons,
      c.rank_q3_appearences,
      c.rank_q2_appearences,
      c.rank_points
    FROM website.v_driver_career_summary c
    LEFT JOIN latest_teams lt USING (driver_id)
    WHERE c.driver_id = $1
       OR LOWER(c.driver_id) = LOWER($1)
       OR LOWER(c.driver_abbreviation) = LOWER($1)
       OR LOWER(REPLACE(c.driver_full_name, ' ', '_')) = LOWER(REPLACE($1, '-', '_'))
       OR LOWER(c.broadcast_name) = LOWER($1)
    ORDER BY 
       CASE 
         WHEN c.driver_id = $1 THEN 0 
         WHEN LOWER(c.driver_id) = LOWER($1) THEN 1
         WHEN LOWER(c.driver_abbreviation) = LOWER($1) THEN 2
         ELSE 3
       END
    LIMIT 1;
  `;

  try {
    if (pool) {
      const res = await pool.query(sql, [driverId]);
      if (res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        return {
          ...r,
          total_world_championships: Number(r.total_world_championships) || 0,
          total_gps: Number(r.total_gps) || 0,
          total_seasons: Number(r.total_seasons) || 0,
          first_season: Number(r.first_season),
          last_season: Number(r.last_season),
          total_wins: Number(r.total_wins) || 0,
          race_wins: Number(r.race_wins) || 0,
          sprint_wins: Number(r.sprint_wins) || 0,
          total_poles_to_win: Number(r.total_poles_to_win) || 0,
          pole_to_win_rate: r.pole_to_win_rate !== null && r.pole_to_win_rate !== undefined ? Number(r.pole_to_win_rate) : undefined,
          total_podiums: Number(r.total_podiums) || 0,
          race_podiums: Number(r.race_podiums) || 0,
          sprint_podiums: Number(r.sprint_podiums) || 0,
          race_poles: Number(r.race_poles) || 0,
          sprint_poles: Number(r.sprint_poles) || 0,
          total_q2_appearences: Number(r.total_q2_appearences) || 0,
          total_q3_appearences: Number(r.total_q3_appearences) || 0,
          total_fastest_laps: Number(r.total_fastest_laps) || 0,
          total_points: Number(r.total_points) || 0,
          best_finish_position: r.best_finish_position ? Number(r.best_finish_position) : undefined,
          best_grid_position: r.best_grid_position ? Number(r.best_grid_position) : undefined,
          total_dnfs: Number(r.total_dnfs) || 0,
          rank_world_championships: r.rank_world_championships ? Number(r.rank_world_championships) : undefined,
          rank_race_wins: r.rank_race_wins ? Number(r.rank_race_wins) : undefined,
          rank_sprint_wins: r.rank_sprint_wins ? Number(r.rank_sprint_wins) : undefined,
          rank_total_wins: r.rank_total_wins ? Number(r.rank_total_wins) : undefined,
          rank_wins: r.rank_race_wins ? Number(r.rank_race_wins) : undefined,
          rank_poles: r.rank_poles ? Number(r.rank_poles) : undefined,
          rank_race_podiums: r.rank_race_podiums ? Number(r.rank_race_podiums) : undefined,
          rank_sprint_podiums: r.rank_sprint_podiums ? Number(r.rank_sprint_podiums) : undefined,
          rank_total_podiums: r.rank_total_podiums ? Number(r.rank_total_podiums) : undefined,
          rank_podiums: r.rank_race_podiums ? Number(r.rank_race_podiums) : undefined,
          rank_gps: r.rank_gps ? Number(r.rank_gps) : undefined,
          rank_seasons: r.rank_seasons ? Number(r.rank_seasons) : undefined,
          rank_q3_appearences: r.rank_q3_appearences ? Number(r.rank_q3_appearences) : undefined,
          rank_q2_appearences: r.rank_q2_appearences ? Number(r.rank_q2_appearences) : undefined,
          rank_points: r.rank_points ? Number(r.rank_points) : undefined,
          team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : '#E10600',
          is_active: Boolean(r.is_active)
        };
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch driver profile for ${driverId}:`, e);
  }

  return null;
}

export async function getDriverSeasons(driverId: string): Promise<DriverSeasonSummaryItem[]> {
  const sql = `
    SELECT 
      year,
      driver_id,
      driver_full_name,
      team_name,
      team_color,
      championship_position,
      is_season_completed,
      total_gps,
      total_wins,
      race_wins,
      sprint_wins,
      total_podiums,
      race_podiums,
      sprint_podiums,
      race_poles,
      sprint_poles,
      fastest_laps,
      total_points,
      race_points,
      sprint_points,
      best_finish_position,
      best_grid_position,
      total_dnfs,
      q2_appearences,
      q3_appearences,
      poles_to_win,
      pole_to_win_rate
    FROM website.v_driver_season_summary
    WHERE driver_id = $1
    ORDER BY year DESC;
  `;

  try {
    if (pool) {
      const res = await pool.query(sql, [driverId]);
      if (res.rows) {
        return res.rows.map((r: any) => ({
          ...r,
          year: Number(r.year),
          championship_position: Number(r.championship_position) || 0,
          is_season_completed: Boolean(r.is_season_completed),
          total_gps: Number(r.total_gps) || 0,
          total_wins: Number(r.total_wins) || 0,
          race_wins: Number(r.race_wins) || 0,
          sprint_wins: Number(r.sprint_wins) || 0,
          total_podiums: Number(r.total_podiums) || 0,
          race_podiums: Number(r.race_podiums) || 0,
          sprint_podiums: Number(r.sprint_podiums) || 0,
          race_poles: Number(r.race_poles) || 0,
          sprint_poles: Number(r.sprint_poles) || 0,
          fastest_laps: Number(r.fastest_laps) || 0,
          total_points: Number(r.total_points) || 0,
          race_points: Number(r.race_points) || 0,
          sprint_points: Number(r.sprint_points) || 0,
          best_finish_position: r.best_finish_position ? Number(r.best_finish_position) : undefined,
          best_grid_position: r.best_grid_position ? Number(r.best_grid_position) : undefined,
          total_dnfs: Number(r.total_dnfs) || 0,
          q2_appearences: Number(r.q2_appearences) || 0,
          q3_appearences: Number(r.q3_appearences) || 0,
          poles_to_win: Number(r.poles_to_win) || 0,
          pole_to_win_rate: r.pole_to_win_rate != null ? Number(r.pole_to_win_rate) : undefined,
          team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : '#E10600'
        }));
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch driver seasons for ${driverId}:`, e);
  }

  return [];
}

export async function getDriverCircuits(driverId: string): Promise<DriverCircuitPerformanceItem[]> {
  const sql = `
    SELECT 
      circuit_id,
      circuit_id AS circuit_sk,
      circuit_name,
      location,
      country,
      driver_id,
      driver_full_name,
      total_gps,
      first_year,
      last_year,
      total_wins,
      race_wins,
      sprint_wins,
      total_podiums,
      race_podiums,
      sprint_podiums,
      race_poles,
      sprint_poles,
      total_fastest_laps,
      total_points,
      race_points,
      sprint_points,
      best_finish_position,
      best_grid_position,
      total_dnfs
    FROM website.v_circuit_driver_performance
    WHERE driver_id = $1
    ORDER BY total_wins DESC, total_podiums DESC, total_points DESC;
  `;

  try {
    if (pool) {
      const res = await pool.query(sql, [driverId]);
      if (res.rows) {
        return res.rows.map((r: any) => ({
          ...r,
          total_gps: Number(r.total_gps) || 0,
          first_year: Number(r.first_year),
          last_year: Number(r.last_year),
          total_wins: Number(r.total_wins) || 0,
          race_wins: Number(r.race_wins) || 0,
          sprint_wins: Number(r.sprint_wins) || 0,
          total_podiums: Number(r.total_podiums) || 0,
          race_podiums: Number(r.race_podiums) || 0,
          sprint_podiums: Number(r.sprint_podiums) || 0,
          race_poles: Number(r.race_poles) || 0,
          sprint_poles: Number(r.sprint_poles) || 0,
          total_fastest_laps: Number(r.total_fastest_laps) || 0,
          total_points: Number(r.total_points) || 0,
          race_points: Number(r.race_points) || 0,
          sprint_points: Number(r.sprint_points) || 0,
          best_finish_position: r.best_finish_position ? Number(r.best_finish_position) : undefined,
          best_grid_position: r.best_grid_position ? Number(r.best_grid_position) : undefined,
          total_dnfs: Number(r.total_dnfs) || 0
        }));
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch driver circuits for ${driverId}:`, e);
  }

  return [];
}

export async function getDriverRaceLog(driverId: string): Promise<DriverRaceLogItem[]> {
  const sql = `
    SELECT 
      year,
      round_number,
      official_event_name,
      session_name,
      driver_id,
      driver_full_name,
      driver_number,
      team_name,
      team_color,
      grid_position,
      finishing_position,
      delta_position,
      points,
      best_lap,
      gap_to_leader,
      status,
      laps_completed
    FROM website.v_sessions_summary
    WHERE driver_id = $1 AND session_name = 'Race'
    ORDER BY year DESC, round_number DESC;
  `;

  try {
    if (pool) {
      const res = await pool.query(sql, [driverId]);
      if (res.rows) {
        return res.rows.map((r: any) => ({
          ...r,
          year: Number(r.year),
          round_number: Number(r.round_number),
          driver_number: r.driver_number ? Number(r.driver_number) : undefined,
          grid_position: r.grid_position ? Number(r.grid_position) : undefined,
          finishing_position: r.finishing_position ? Number(r.finishing_position) : undefined,
          delta_position: r.delta_position !== null ? Number(r.delta_position) : undefined,
          points: Number(r.points) || 0,
          laps_completed: r.laps_completed ? Number(r.laps_completed) : undefined,
          team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : '#E10600'
        }));
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch driver race log for ${driverId}:`, e);
  }

  return [];
}

export async function getConstructorsCatalog(): Promise<ConstructorCatalogItem[]> {
  const sql = `
    SELECT 
      team_id,
      team_name,
      team_color,
      is_active,
      total_world_championships,
      total_gps,
      total_seasons,
      first_season,
      last_season,
      active_season_competitive_gps,
      total_wins,
      race_wins,
      sprint_wins,
      total_one_two,
      race_poles,
      sprint_poles,
      total_front_row,
      total_poles_to_win,
      pole_to_win_rate,
      total_podiums,
      race_podiums,
      sprint_podiums,
      total_double_podium,
      total_fastest_laps,
      total_double_points,
      race_points,
      sprint_points,
      total_points,
      best_finish_position,
      best_grid_position,
      total_dnfs,
      total_q2_appearences,
      total_q3_appearences,
      rank_world_championships,
      rank_race_wins,
      rank_sprint_wins,
      rank_total_wins,
      rank_poles,
      rank_race_podiums,
      rank_sprint_podiums,
      rank_total_podiums,
      rank_gps,
      rank_seasons,
      rank_q3_appearences,
      rank_q2_appearences,
      rank_points
    FROM website.v_constructor_career_summary
    ORDER BY 
      is_active DESC,
      total_world_championships DESC,
      total_wins DESC,
      total_points DESC;
  `;

  try {
    if (pool) {
      const res = await pool.query(sql);
      if (res.rows) {
        return res.rows.map((r: any) => ({
          ...r,
          is_active: Boolean(r.is_active),
          total_world_championships: Number(r.total_world_championships) || 0,
          total_gps: Number(r.total_gps) || 0,
          total_seasons: Number(r.total_seasons) || 0,
          first_season: Number(r.first_season),
          last_season: Number(r.last_season),
          active_season_competitive_gps: Number(r.active_season_competitive_gps) || 0,
          total_wins: Number(r.total_wins) || 0,
          race_wins: Number(r.race_wins) || 0,
          sprint_wins: Number(r.sprint_wins) || 0,
          total_one_two: Number(r.total_one_two) || 0,
          race_poles: Number(r.race_poles) || 0,
          sprint_poles: Number(r.sprint_poles) || 0,
          total_front_row: Number(r.total_front_row) || 0,
          total_poles_to_win: Number(r.total_poles_to_win) || 0,
          pole_to_win_rate: r.pole_to_win_rate != null ? Number(r.pole_to_win_rate) : undefined,
          total_podiums: Number(r.total_podiums) || 0,
          race_podiums: Number(r.race_podiums) || 0,
          sprint_podiums: Number(r.sprint_podiums) || 0,
          total_double_podium: Number(r.total_double_podium) || 0,
          total_fastest_laps: Number(r.total_fastest_laps) || 0,
          total_double_points: Number(r.total_double_points) || 0,
          race_points: Number(r.race_points) || 0,
          sprint_points: Number(r.sprint_points) || 0,
          total_points: Number(r.total_points) || 0,
          best_finish_position: r.best_finish_position ? Number(r.best_finish_position) : undefined,
          best_grid_position: r.best_grid_position ? Number(r.best_grid_position) : undefined,
          total_dnfs: Number(r.total_dnfs) || 0,
          total_q2_appearences: Number(r.total_q2_appearences) || 0,
          total_q3_appearences: Number(r.total_q3_appearences) || 0,
          rank_world_championships: r.rank_world_championships ? Number(r.rank_world_championships) : undefined,
          rank_race_wins: r.rank_race_wins ? Number(r.rank_race_wins) : undefined,
          rank_sprint_wins: r.rank_sprint_wins ? Number(r.rank_sprint_wins) : undefined,
          rank_total_wins: r.rank_total_wins ? Number(r.rank_total_wins) : undefined,
          rank_poles: r.rank_poles ? Number(r.rank_poles) : undefined,
          rank_race_podiums: r.rank_race_podiums ? Number(r.rank_race_podiums) : undefined,
          rank_sprint_podiums: r.rank_sprint_podiums ? Number(r.rank_sprint_podiums) : undefined,
          rank_total_podiums: r.rank_total_podiums ? Number(r.rank_total_podiums) : undefined,
          rank_gps: r.rank_gps ? Number(r.rank_gps) : undefined,
          rank_seasons: r.rank_seasons ? Number(r.rank_seasons) : undefined,
          rank_q3_appearences: r.rank_q3_appearences ? Number(r.rank_q3_appearences) : undefined,
          rank_q2_appearences: r.rank_q2_appearences ? Number(r.rank_q2_appearences) : undefined,
          rank_points: r.rank_points ? Number(r.rank_points) : undefined,
          team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : '#E10600'
        }));
      }
    }
  } catch (e) {
    console.warn("Failed to fetch constructors catalog from db:", e);
  }

  return [];
}

export async function getConstructorProfile(teamId: string): Promise<ConstructorCatalogItem | null> {
  const sql = `
    SELECT 
      team_id,
      team_name,
      team_color,
      is_active,
      total_world_championships,
      total_gps,
      total_seasons,
      first_season,
      last_season,
      active_season_competitive_gps,
      total_wins,
      race_wins,
      sprint_wins,
      total_one_two,
      race_poles,
      sprint_poles,
      total_front_row,
      total_poles_to_win,
      pole_to_win_rate,
      total_podiums,
      race_podiums,
      sprint_podiums,
      total_double_podium,
      total_fastest_laps,
      total_double_points,
      race_points,
      sprint_points,
      total_points,
      best_finish_position,
      best_grid_position,
      total_dnfs,
      total_q2_appearences,
      total_q3_appearences,
      rank_world_championships,
      rank_race_wins,
      rank_sprint_wins,
      rank_total_wins,
      rank_poles,
      rank_race_podiums,
      rank_sprint_podiums,
      rank_total_podiums,
      rank_gps,
      rank_seasons,
      rank_q3_appearences,
      rank_q2_appearences,
      rank_points
    FROM website.v_constructor_career_summary
    WHERE team_id = $1
       OR LOWER(team_id) = LOWER($1)
       OR LOWER(team_name) = LOWER($1)
       OR LOWER(REPLACE(team_name, ' ', '_')) = LOWER(REPLACE($1, '-', '_'))
       OR LOWER(REPLACE(team_name, ' ', '')) = LOWER(REPLACE($1, '-', ''))
    ORDER BY 
       CASE 
         WHEN team_id = $1 THEN 0 
         WHEN LOWER(team_id) = LOWER($1) THEN 1
         WHEN LOWER(team_name) = LOWER($1) THEN 2
         ELSE 3
       END
    LIMIT 1;
  `;

  try {
    if (pool) {
      const res = await pool.query(sql, [teamId]);
      if (res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        return {
          ...r,
          is_active: Boolean(r.is_active),
          total_world_championships: Number(r.total_world_championships) || 0,
          total_gps: Number(r.total_gps) || 0,
          total_seasons: Number(r.total_seasons) || 0,
          first_season: Number(r.first_season),
          last_season: Number(r.last_season),
          active_season_competitive_gps: Number(r.active_season_competitive_gps) || 0,
          total_wins: Number(r.total_wins) || 0,
          race_wins: Number(r.race_wins) || 0,
          sprint_wins: Number(r.sprint_wins) || 0,
          total_one_two: Number(r.total_one_two) || 0,
          race_poles: Number(r.race_poles) || 0,
          sprint_poles: Number(r.sprint_poles) || 0,
          total_front_row: Number(r.total_front_row) || 0,
          total_poles_to_win: Number(r.total_poles_to_win) || 0,
          pole_to_win_rate: r.pole_to_win_rate != null ? Number(r.pole_to_win_rate) : undefined,
          total_podiums: Number(r.total_podiums) || 0,
          race_podiums: Number(r.race_podiums) || 0,
          sprint_podiums: Number(r.sprint_podiums) || 0,
          total_double_podium: Number(r.total_double_podium) || 0,
          total_fastest_laps: Number(r.total_fastest_laps) || 0,
          total_double_points: Number(r.total_double_points) || 0,
          race_points: Number(r.race_points) || 0,
          sprint_points: Number(r.sprint_points) || 0,
          total_points: Number(r.total_points) || 0,
          best_finish_position: r.best_finish_position ? Number(r.best_finish_position) : undefined,
          best_grid_position: r.best_grid_position ? Number(r.best_grid_position) : undefined,
          total_dnfs: Number(r.total_dnfs) || 0,
          total_q2_appearences: Number(r.total_q2_appearences) || 0,
          total_q3_appearences: Number(r.total_q3_appearences) || 0,
          rank_world_championships: r.rank_world_championships ? Number(r.rank_world_championships) : undefined,
          rank_race_wins: r.rank_race_wins ? Number(r.rank_race_wins) : undefined,
          rank_sprint_wins: r.rank_sprint_wins ? Number(r.rank_sprint_wins) : undefined,
          rank_total_wins: r.rank_total_wins ? Number(r.rank_total_wins) : undefined,
          rank_poles: r.rank_poles ? Number(r.rank_poles) : undefined,
          rank_race_podiums: r.rank_race_podiums ? Number(r.rank_race_podiums) : undefined,
          rank_sprint_podiums: r.rank_sprint_podiums ? Number(r.rank_sprint_podiums) : undefined,
          rank_total_podiums: r.rank_total_podiums ? Number(r.rank_total_podiums) : undefined,
          rank_gps: r.rank_gps ? Number(r.rank_gps) : undefined,
          rank_seasons: r.rank_seasons ? Number(r.rank_seasons) : undefined,
          rank_q3_appearences: r.rank_q3_appearences ? Number(r.rank_q3_appearences) : undefined,
          rank_q2_appearences: r.rank_q2_appearences ? Number(r.rank_q2_appearences) : undefined,
          rank_points: r.rank_points ? Number(r.rank_points) : undefined,
          team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : '#E10600'
        };
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch constructor profile for ${teamId}:`, e);
  }

  return null;
}

export async function getConstructorDrivers(teamId: string): Promise<ConstructorDriverSummaryItem[]> {
  const sql = `
    SELECT 
      team_id,
      team_name,
      team_color,
      driver_id,
      broadcast_name,
      driver_abbreviation,
      driver_full_name,
      driver_nationality,
      driver_headshot_url,
      seasons_count,
      first_season,
      last_season,
      seasons_list,
      gps_raced,
      competitive_gps,
      driver_titles_with_team,
      race_wins,
      sprint_wins,
      total_wins,
      race_poles,
      sprint_poles,
      race_podiums,
      sprint_podiums,
      total_podiums,
      fastest_laps,
      points_finishes,
      race_points,
      sprint_points,
      total_points,
      best_finish_position,
      best_grid_position,
      total_dnfs,
      rank_in_team_points,
      rank_in_team_wins,
      rank_in_team_gps,
      rank_in_team_titles
    FROM website.v_constructor_driver_summary
    WHERE team_id = $1
       OR LOWER(team_id) = LOWER($1)
       OR LOWER(team_name) = LOWER($1)
    ORDER BY total_points DESC, total_wins DESC;
  `;

  try {
    if (pool) {
      const res = await pool.query(sql, [teamId]);
      if (res.rows) {
        return res.rows.map((r: any) => ({
          ...r,
          seasons_count: Number(r.seasons_count) || 0,
          first_season: Number(r.first_season),
          last_season: Number(r.last_season),
          gps_raced: Number(r.gps_raced) || 0,
          competitive_gps: Number(r.competitive_gps) || 0,
          driver_titles_with_team: Number(r.driver_titles_with_team) || 0,
          race_wins: Number(r.race_wins) || 0,
          sprint_wins: Number(r.sprint_wins) || 0,
          total_wins: Number(r.total_wins) || 0,
          race_poles: Number(r.race_poles) || 0,
          sprint_poles: Number(r.sprint_poles) || 0,
          race_podiums: Number(r.race_podiums) || 0,
          sprint_podiums: Number(r.sprint_podiums) || 0,
          total_podiums: Number(r.total_podiums) || 0,
          fastest_laps: Number(r.fastest_laps) || 0,
          points_finishes: Number(r.points_finishes) || 0,
          race_points: Number(r.race_points) || 0,
          sprint_points: Number(r.sprint_points) || 0,
          total_points: Number(r.total_points) || 0,
          best_finish_position: r.best_finish_position ? Number(r.best_finish_position) : undefined,
          best_grid_position: r.best_grid_position ? Number(r.best_grid_position) : undefined,
          total_dnfs: Number(r.total_dnfs) || 0,
          rank_in_team_points: Number(r.rank_in_team_points) || 0,
          rank_in_team_wins: Number(r.rank_in_team_wins) || 0,
          rank_in_team_gps: Number(r.rank_in_team_gps) || 0,
          rank_in_team_titles: Number(r.rank_in_team_titles) || 0,
          team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : '#E10600'
        }));
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch constructor drivers for ${teamId}:`, e);
  }

  return [];
}

export async function getConstructorSeasons(teamId: string): Promise<ConstructorSeasonSummaryItem[]> {
  const sql = `
    SELECT 
      year,
      team_id,
      team_name,
      team_color,
      total_gps,
      competitive_gps,
      race_wins,
      sprint_wins,
      total_wins,
      race_poles,
      sprint_poles,
      poles_to_win,
      race_podiums,
      sprint_podiums,
      total_podiums,
      q2_appearences,
      q3_appearences,
      race_points,
      sprint_points,
      total_points,
      best_finish_position,
      best_grid_position,
      total_dnfs,
      total_one_two,
      total_double_podium,
      total_double_points,
      total_front_row,
      fastest_laps,
      pole_to_win_rate,
      is_season_completed,
      championship_position,
      drivers_lineup,
      drivers_used_count
    FROM website.v_constructor_season_summary
    WHERE team_id = $1
       OR LOWER(team_id) = LOWER($1)
       OR LOWER(team_name) = LOWER($1)
    ORDER BY year DESC;
  `;

  try {
    if (pool) {
      const res = await pool.query(sql, [teamId]);
      if (res.rows) {
        return res.rows.map((r: any) => ({
          ...r,
          year: Number(r.year),
          total_gps: Number(r.total_gps) || 0,
          competitive_gps: Number(r.competitive_gps) || 0,
          race_wins: Number(r.race_wins) || 0,
          sprint_wins: Number(r.sprint_wins) || 0,
          total_wins: Number(r.total_wins) || 0,
          race_poles: Number(r.race_poles) || 0,
          sprint_poles: Number(r.sprint_poles) || 0,
          poles_to_win: Number(r.poles_to_win) || 0,
          race_podiums: Number(r.race_podiums) || 0,
          sprint_podiums: Number(r.sprint_podiums) || 0,
          total_podiums: Number(r.total_podiums) || 0,
          q2_appearences: Number(r.q2_appearences) || 0,
          q3_appearences: Number(r.q3_appearences) || 0,
          race_points: Number(r.race_points) || 0,
          sprint_points: Number(r.sprint_points) || 0,
          total_points: Number(r.total_points) || 0,
          best_finish_position: r.best_finish_position ? Number(r.best_finish_position) : undefined,
          best_grid_position: r.best_grid_position ? Number(r.best_grid_position) : undefined,
          total_dnfs: Number(r.total_dnfs) || 0,
          total_one_two: Number(r.total_one_two) || 0,
          total_double_podium: Number(r.total_double_podium) || 0,
          total_double_points: Number(r.total_double_points) || 0,
          total_front_row: Number(r.total_front_row) || 0,
          fastest_laps: Number(r.fastest_laps) || 0,
          pole_to_win_rate: r.pole_to_win_rate != null ? Number(r.pole_to_win_rate) : undefined,
          is_season_completed: Boolean(r.is_season_completed),
          championship_position: Number(r.championship_position) || 0,
          drivers_used_count: Number(r.drivers_used_count) || 0,
          team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : '#E10600'
        }));
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch constructor seasons for ${teamId}:`, e);
  }

  return [];
}

export async function getConstructorRaceLog(teamName: string): Promise<ConstructorRaceLogItem[]> {
  const sql = `
    SELECT 
      year,
      round_number,
      official_event_name,
      session_name,
      team_name,
      team_color,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'driver_id', driver_id,
          'driver_full_name', driver_full_name,
          'driver_headshot_url', driver_headshot_url,
          'driver_number', driver_number,
          'grid_position', grid_position,
          'finishing_position', finishing_position,
          'points', points,
          'status', status
        ) ORDER BY finishing_position ASC NULLS LAST
      ) AS drivers_results,
      SUM(points) AS team_points,
      MIN(finishing_position) AS best_finish,
      COUNT(CASE WHEN finishing_position <= 3 THEN 1 END) AS podiums_count,
      COUNT(CASE WHEN finishing_position = 1 THEN 1 END) AS wins_count
    FROM website.v_sessions_summary
    WHERE session_name = 'Race' 
      AND (
        team_name = $1 
        OR LOWER(team_name) = LOWER($1)
        OR LOWER(team_name) ILIKE LOWER($1 || '%')
      )
    GROUP BY year, round_number, official_event_name, session_name, team_name, team_color
    ORDER BY year DESC, round_number DESC;
  `;

  try {
    if (pool) {
      const res = await pool.query(sql, [teamName]);
      if (res.rows) {
        return res.rows.map((r: any) => {
          const drivers = Array.isArray(r.drivers_results) ? r.drivers_results : [];
          const finishingPositions = drivers
            .map((d: any) => Number(d.finishing_position))
            .filter((pos: number) => !isNaN(pos) && pos > 0);
          
          const isOneTwo = finishingPositions.includes(1) && finishingPositions.includes(2);
          const isDoublePodium = finishingPositions.filter((pos: number) => pos <= 3).length >= 2;
          const isDoublePoints = finishingPositions.filter((pos: number) => pos <= 10).length >= 2;

          return {
            year: Number(r.year),
            round_number: Number(r.round_number),
            official_event_name: r.official_event_name,
            session_name: r.session_name,
            team_name: r.team_name,
            team_color: r.team_color ? (r.team_color.startsWith('#') ? r.team_color : `#${r.team_color}`) : '#E10600',
            drivers_results: drivers.map((d: any) => ({
              driver_id: d.driver_id,
              driver_full_name: d.driver_full_name,
              driver_headshot_url: d.driver_headshot_url || undefined,
              driver_number: d.driver_number ? Number(d.driver_number) : undefined,
              grid_position: d.grid_position ? Number(d.grid_position) : undefined,
              finishing_position: d.finishing_position ? Number(d.finishing_position) : undefined,
              points: Number(d.points) || 0,
              status: d.status
            })),
            team_points: Number(r.team_points) || 0,
            best_finish: r.best_finish ? Number(r.best_finish) : undefined,
            podiums_count: Number(r.podiums_count) || 0,
            wins_count: Number(r.wins_count) || 0,
            is_one_two: isOneTwo,
            is_double_podium: isDoublePodium,
            is_double_points: isDoublePoints
          };
        });
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch constructor race log for ${teamName}:`, e);
  }

  return [];
}

function mapCircuitOverviewRow(r: any): CircuitOverviewItem {
  const sanitizeColor = (c: any) => (c ? (String(c).startsWith('#') ? String(c) : `#${c}`) : null);

  return {
    circuit_id: r.circuit_id,
    circuit_name: r.circuit_name,
    country: r.country,
    location: r.location,
    track_type: r.track_type || null,

    total_gps_completed: Number(r.total_gps_completed) || 0,
    total_gps_scheduled: Number(r.total_gps_scheduled) || 0,
    first_gp_year: r.first_gp_year != null ? Number(r.first_gp_year) : null,
    last_gp_year: r.last_gp_year != null ? Number(r.last_gp_year) : null,
    seasons_list: r.seasons_list || null,
    years_held: Array.isArray(r.years_held)
      ? r.years_held.map(Number)
      : r.seasons_list
      ? r.seasons_list.split(",").map((y: string) => Number(y.trim()))
      : [],
    total_dnfs: Number(r.total_dnfs) || 0,
    avg_dnfs_per_race: Number(r.avg_dnfs_per_race) || 0,

    most_wins_team_id: r.most_wins_team_id || null,
    most_wins_team: r.most_wins_team || null,
    most_wins_team_color: sanitizeColor(r.most_wins_team_color),
    most_wins_team_count: r.most_wins_team_count != null ? Number(r.most_wins_team_count) : 0,

    most_wins_driver_id: r.most_wins_driver_id || null,
    most_wins_driver: r.most_wins_driver || null,
    most_wins_driver_code: r.most_wins_driver_code || null,
    most_wins_driver_nationality: r.most_wins_driver_nationality || null,
    most_wins_driver_headshot_url: r.most_wins_driver_headshot_url || null,
    most_wins_count: r.most_wins_count != null ? Number(r.most_wins_count) : 0,

    most_podiums_driver_id: r.most_podiums_driver_id || null,
    most_podiums_driver: r.most_podiums_driver || null,
    most_podiums_driver_code: r.most_podiums_driver_code || null,
    most_podiums_driver_nationality: r.most_podiums_driver_nationality || null,
    most_podiums_driver_headshot_url: r.most_podiums_driver_headshot_url || null,
    most_podiums_count: r.most_podiums_count != null ? Number(r.most_podiums_count) : 0,

    most_poles_driver_id: r.most_poles_driver_id || null,
    most_poles_driver: r.most_poles_driver || null,
    most_poles_driver_code: r.most_poles_driver_code || null,
    most_poles_driver_nationality: r.most_poles_driver_nationality || null,
    most_poles_driver_headshot_url: r.most_poles_driver_headshot_url || null,
    most_poles_count: r.most_poles_count != null ? Number(r.most_poles_count) : 0,

    most_sprint_wins_driver_id: r.most_sprint_wins_driver_id || null,
    most_sprint_wins_driver: r.most_sprint_wins_driver || null,
    most_sprint_wins_driver_code: r.most_sprint_wins_driver_code || null,
    most_sprint_wins_driver_nationality: r.most_sprint_wins_driver_nationality || null,
    most_sprint_wins_driver_headshot_url: r.most_sprint_wins_driver_headshot_url || null,
    most_sprint_wins_count: r.most_sprint_wins_count != null ? Number(r.most_sprint_wins_count) : 0,

    race_lap_record_driver_id: r.race_lap_record_driver_id || null,
    race_lap_record_driver: r.race_lap_record_driver || null,
    race_lap_record_driver_code: r.race_lap_record_driver_code || null,
    race_lap_record_headshot_url: r.race_lap_record_headshot_url || null,
    race_lap_record_team: r.race_lap_record_team || null,
    race_lap_record_team_color: sanitizeColor(r.race_lap_record_team_color),
    race_lap_record_year: r.race_lap_record_year != null ? Number(r.race_lap_record_year) : null,
    race_lap_record_seconds: r.race_lap_record_seconds != null ? Number(r.race_lap_record_seconds) : null,
    race_lap_record_formatted: r.race_lap_record_formatted || null,

    quali_lap_record_driver_id: r.quali_lap_record_driver_id || null,
    quali_lap_record_driver: r.quali_lap_record_driver || null,
    quali_lap_record_driver_code: r.quali_lap_record_driver_code || null,
    quali_lap_record_headshot_url: r.quali_lap_record_headshot_url || null,
    quali_lap_record_team: r.quali_lap_record_team || null,
    quali_lap_record_team_color: sanitizeColor(r.quali_lap_record_team_color),
    quali_lap_record_year: r.quali_lap_record_year != null ? Number(r.quali_lap_record_year) : null,
    quali_lap_record_seconds: r.quali_lap_record_seconds != null ? Number(r.quali_lap_record_seconds) : null,
    quali_lap_record_formatted: r.quali_lap_record_formatted || null,
  };
}

export async function getCircuitsCatalog(): Promise<CircuitOverviewItem[]> {
  const sql = `
    SELECT *
    FROM website.v_circuit_overview
    ORDER BY total_gps_completed DESC, circuit_name ASC;
  `;
  try {
    if (pool) {
      const res = await pool.query(sql);
      if (res.rows) {
        return res.rows.map(mapCircuitOverviewRow);
      }
    }
  } catch (e) {
    console.warn("Failed to fetch circuits catalog:", e);
  }
  return [];
}

export async function getCircuitOverview(circuitId: string): Promise<CircuitOverviewItem | null> {
  const sql = `
    SELECT *
    FROM website.v_circuit_overview
    WHERE circuit_id = $1
       OR LOWER(circuit_id) = LOWER($1)
       OR LOWER(circuit_name) = LOWER($1)
       OR LOWER(REPLACE(circuit_name, ' ', '_')) = LOWER(REPLACE($1, '-', '_'))
       OR LOWER(circuit_id) = LOWER(REPLACE($1, '-', '_'))
    ORDER BY 
       CASE 
         WHEN circuit_id = $1 THEN 0 
         WHEN LOWER(circuit_id) = LOWER($1) THEN 1
         WHEN LOWER(circuit_name) = LOWER($1) THEN 2
         ELSE 3
       END
    LIMIT 1;
  `;
  try {
    if (pool) {
      const res = await pool.query(sql, [circuitId]);
      if (res.rows && res.rows.length > 0) {
        return mapCircuitOverviewRow(res.rows[0]);
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch circuit overview for ${circuitId}:`, e);
  }
  return null;
}

export async function getCircuitSeasons(circuitId: string): Promise<SeasonRaceSummary[]> {
  const sql = `
    SELECT *
    FROM website.v_circuit_season_summary
    WHERE circuit_id = $1
    ORDER BY year DESC, round_number DESC;
  `;
  const rows = await queryOrFallback<any[]>(sql, [circuitId], []);
  return rows.map((r) => {
    const raceWinnerTeamColor = r.race_winner_team_color
      ? (r.race_winner_team_color.startsWith('#') ? r.race_winner_team_color : `#${r.race_winner_team_color}`)
      : null;
    const sprintWinnerTeamColor = r.sprint_winner_team_color
      ? (r.sprint_winner_team_color.startsWith('#') ? r.sprint_winner_team_color : `#${r.sprint_winner_team_color}`)
      : null;
    const fastestLapTeamColor = r.fastest_lap_team_color
      ? (r.fastest_lap_team_color.startsWith('#') ? r.fastest_lap_team_color : `#${r.fastest_lap_team_color}`)
      : null;

    return {
      ...r,
      round_number: Number(r.round_number),
      total_dnfs: r.total_dnfs != null ? Number(r.total_dnfs) : 0,
      completed_sessions_count: r.completed_sessions_count != null ? Number(r.completed_sessions_count) : 0,

      race_winner_team_color: raceWinnerTeamColor,
      sprint_winner_team_color: sprintWinnerTeamColor,
      fastest_lap_team_color: fastestLapTeamColor,

      race_winner_number: r.race_winner_number != null ? Number(r.race_winner_number) : null,
      race_laps_completed: r.race_laps_completed != null ? Number(r.race_laps_completed) : null,
      race_total_time_seconds: r.race_total_time_seconds != null ? Number(r.race_total_time_seconds) : null,

      sprint_winner_number: r.sprint_winner_number != null ? Number(r.sprint_winner_number) : null,
      sprint_laps_completed: r.sprint_laps_completed != null ? Number(r.sprint_laps_completed) : null,
      sprint_total_time_seconds: r.sprint_total_time_seconds != null ? Number(r.sprint_total_time_seconds) : null,

      fastest_lap_time_seconds: r.fastest_lap_time_seconds != null ? Number(r.fastest_lap_time_seconds) : null,

      driver_id: r.race_winner_driver_id || null,
      winner_name: r.race_winner_driver || null,
      winner_code: r.race_winner_code || null,
      winner_headshot_url: r.race_winner_headshot_url || null,
      winner_number: r.race_winner_number != null ? Number(r.race_winner_number) : null,
      team_id: r.race_winner_team_id || null,
      team_name: r.race_winner_team || null,
      team_color: raceWinnerTeamColor,
      laps_completed: r.race_laps_completed != null ? Number(r.race_laps_completed) : null,
      total_time_seconds: r.race_total_time_seconds != null ? Number(r.race_total_time_seconds) : null,
      time_formatted: r.race_time_formatted || null,
    };
  });
}

export async function getCircuitDrivers(circuitId: string): Promise<DriverCircuitPerformanceItem[]> {
  const sql = `
    SELECT 
      circuit_id,
      circuit_id AS circuit_sk,
      circuit_name,
      location,
      country,
      track_type,
      driver_id,
      broadcast_name,
      driver_abbreviation,
      driver_full_name,
      driver_nationality,
      driver_headshot_url,
      total_gps,
      first_year,
      last_year,
      total_wins,
      race_wins,
      sprint_wins,
      total_podiums,
      race_podiums,
      sprint_podiums,
      race_poles,
      sprint_poles,
      total_fastest_laps,
      total_points,
      race_points,
      sprint_points,
      best_finish_position,
      best_grid_position,
      total_dnfs
    FROM website.v_circuit_driver_performance
    WHERE circuit_id = $1
    ORDER BY total_wins DESC, total_podiums DESC, race_poles DESC, total_points DESC;
  `;
  try {
    if (pool) {
      const res = await pool.query(sql, [circuitId]);
      if (res.rows) {
        return res.rows.map((r: any) => ({
          ...r,
          total_gps: Number(r.total_gps) || 0,
          first_year: Number(r.first_year) || 0,
          last_year: Number(r.last_year) || 0,
          total_wins: Number(r.total_wins) || 0,
          race_wins: Number(r.race_wins) || 0,
          sprint_wins: Number(r.sprint_wins) || 0,
          total_podiums: Number(r.total_podiums) || 0,
          race_podiums: Number(r.race_podiums) || 0,
          sprint_podiums: Number(r.sprint_podiums) || 0,
          race_poles: Number(r.race_poles) || 0,
          sprint_poles: Number(r.sprint_poles) || 0,
          total_fastest_laps: Number(r.total_fastest_laps) || 0,
          total_points: Number(r.total_points) || 0,
          race_points: Number(r.race_points) || 0,
          sprint_points: Number(r.sprint_points) || 0,
          best_finish_position: r.best_finish_position != null ? Number(r.best_finish_position) : undefined,
          best_grid_position: r.best_grid_position != null ? Number(r.best_grid_position) : undefined,
          total_dnfs: Number(r.total_dnfs) || 0,
        }));
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch circuit drivers for ${circuitId}:`, e);
  }
  return [];
}

