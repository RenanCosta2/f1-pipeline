export interface DriverStanding {
    driver_id?: string;
    year: number;
    driver_headshot_url: string | null;
    driver_full_name: string;
    driver_nationality: string | null;
    sprint_wins: number;
    race_wins: number;
    total_wins: number;
    sprint_podiums: number;
    race_podiums: number;
    total_podiums: number;
    sprint_points: number;
    race_points: number;
    total_points: number;
    championship_position: number;
    team_name?: string;
    team_color?: string;
}

export interface ConstructorStanding {
    year: number;
    team_name: string;
    team_color: string | null;
    sprint_wins: number;
    race_wins: number;
    total_wins: number;
    sprint_podiums: number;
    race_podiums: number;
    total_podiums: number;
    sprint_points: number;
    race_points: number;
    total_points: number;
    championship_position: number;
}

export interface CumulativeDriverPoint {
    driver_id?: string;
    year: number;
    round_number: number;
    country?: string;
    location?: string;
    event_name?: string;
    official_event_name: string;
    session_name: string;
    driver_full_name: string;
    team_name: string;
    team_color: string | null;
    finishing_position?: number | null;
    is_race_win?: number;
    is_sprint_win?: number;
    is_race_podium?: number;
    is_sprint_podium?: number;
    is_win?: number;
    is_podium?: number;
    points: number;
    cumulative_driver_points: number;
}

export interface CumulativeTeamPoint {
    year: number;
    round_number: number;
    country?: string;
    location?: string;
    event_name?: string;
    official_event_name: string;
    session_name: string;
    team_name: string;
    team_color: string | null;
    race_wins?: number;
    sprint_wins?: number;
    race_podiums?: number;
    sprint_podiums?: number;
    wins?: number;
    podiums?: number;
    points: number;
    cumulative_team_points: number;
}

export interface SessionSummary {
    session_sk?: string;
    driver_id?: string;
    team_id?: string | null;
    year: number;
    round_number: number;
    country: string;
    location: string;
    official_event_name: string;
    session_name: string;
    driver_full_name: string;
    driver_abbreviation?: string | null;
    driver_number: number;
    driver_nationality: string | null;
    driver_headshot_url?: string | null;
    team_name: string;
    team_color?: string | null;
    points: number | null;
    finishing_position: number | null;
    grid_position: number | null;
    starting_grid_position?: number | null;
    delta_position: number | null;
    stops: number | null;
    gap_to_leader?: string | null;
    interval_to_car_ahead?: string | null;
    best_lap: string | null;
    status: string | null;
    laps_completed: number | null;
}

export interface TyreStrategy {
    year: number;
    round_number: number;
    official_event_name: string;
    session_name: string;
    driver_full_name: string;
    driver_headshot_url?: string | null;
    team_name: string;
    stint: number;
    compound: string;
    lap_start: number;
    lap_end: number;
    stint_laps_completed: number;
    stint_avg_lap_time: string;
    pit_under_safety_car?: boolean;
    pit_under_vsc?: boolean;
    pit_under_red_flag?: boolean;
}

export interface LapByLap {
    year: number;
    round_number: number;
    official_event_name: string;
    session_name: string;
    driver_full_name: string;
    driver_abbreviation: string;
    team_name: string;
    team_color: string | null;
    lap_number: number;
    sector_1_time_seconds: number | null;
    sector_2_time_seconds: number | null;
    sector_3_time_seconds: number | null;
    lap_time_seconds: number | null;
    lap_time: string | null;
    compound: string | null;
    tyre_life: number | null;
    track_status_description: string | null;
    position: number | null;
}

export interface RacePace {
    year: number;
    round_number: number;
    official_event_name: string;
    session_name: string;
    driver_full_name: string;
    driver_headshot_url?: string | null;
    team_name: string;
    team_color?: string | null;
    avg_lap_time_seconds: number;
    lap_pace: string;
    pace_stddev: number | null;
}

export interface MaxSpeed {
    year: number;
    round_number: number;
    official_event_name: string;
    session_name: string;
    driver_full_name: string;
    team_name: string;
    max_speed_trap: number | null;
    max_speed_i1: number | null;
    max_speed_i2: number | null;
    max_speed_fl: number | null;
}

export interface IdealLap {
    year: number;
    round_number: number;
    official_event_name: string;
    session_number: number;
    session_name: string;
    driver_full_name: string;
    driver_headshot_url?: string | null;
    team_name: string;
    team_color?: string | null;
    sector_1: string;
    sector_2: string;
    sector_3: string;
    lap_time: string;
    delta_ideal_lap: string;
}

export interface RaceWeekendInfo {
    circuit_id?: string | null;
    round_number: number;
    official_event_name: string;
    country: string;
    location: string;
    circuit_name: string;
    event_date: string;
    is_upcoming: boolean;
    race_timestamp_utc?: string | null;
    track_length_km?: string;
    laps?: number;
    drs_zones?: number;
    sessions: {
        name: string;
        session_name?: string;
        session_code?: string;
        date: string;
        time: string;
        completed: boolean;
        waiting_data?: boolean;
        session_date_utc?: string;
        leader?: string;
        best_lap?: string;
    }[];
    circuit_records: {
        has_historical_data?: boolean;
        lap_record: string;
        lap_record_holder: string;
        lap_record_year: number;
        all_time_record?: string;
        all_time_holder?: string;
        all_time_year?: number;
        all_time_session?: string;
        max_speed_kmh?: number;
        max_speed_driver?: string;
        max_speed_year?: number;
        total_laps_analyzed?: number;
        most_wins_driver: string;
        most_wins_drivers?: string[];
        most_wins_count: number;
        most_poles_driver: string;
        most_poles_drivers?: string[];
        most_poles_count: number;
        typical_strategy: string;
    };
}

export interface SeasonRaceSummary {
    year: number;
    round_number: number;
    event_sk: string;
    official_event_name: string;
    event_date: string;
    circuit_id: string;
    country: string;
    location: string;
    circuit_name: string;
    track_type?: string | null;

    // Pole Position
    pole_driver?: string | null;
    pole_team?: string | null;

    // Race Winner
    race_winner_driver_id?: string | null;
    race_winner_driver?: string | null;
    race_winner_code?: string | null;
    race_winner_headshot_url?: string | null;
    race_winner_number?: number | null;
    race_winner_team_id?: string | null;
    race_winner_team?: string | null;
    race_winner_team_color?: string | null;
    race_laps_completed?: number | null;
    race_total_time_seconds?: number | null;
    race_time_formatted?: string | null;

    // Fastest Lap
    fastest_lap_driver_id?: string | null;
    fastest_lap_driver?: string | null;
    fastest_lap_code?: string | null;
    fastest_lap_headshot_url?: string | null;
    fastest_lap_team?: string | null;
    fastest_lap_team_color?: string | null;
    fastest_lap_time_seconds?: number | null;
    fastest_lap_time_formatted?: string | null;

    // Sprint Winner
    sprint_winner_driver_id?: string | null;
    sprint_winner_driver?: string | null;
    sprint_winner_code?: string | null;
    sprint_winner_headshot_url?: string | null;
    sprint_winner_number?: number | null;
    sprint_winner_team_id?: string | null;
    sprint_winner_team?: string | null;
    sprint_winner_team_color?: string | null;
    sprint_laps_completed?: number | null;
    sprint_total_time_seconds?: number | null;
    sprint_time_formatted?: string | null;

    // Stats & Status
    total_dnfs?: number;
    completed_sessions_count?: number;
    race_status: 'Completed' | 'In Progress' | 'Scheduled';

    // Aliases retrocompatíveis
    circuit_sk?: string;
    race_session_sk?: string | null;
    driver_id?: string | null;
    winner_name?: string | null;
    winner_code?: string | null;
    winner_headshot_url?: string | null;
    winner_number?: number | null;
    team_id?: string | null;
    team_name?: string | null;
    team_color?: string | null;
    laps_completed?: number | null;
    total_time_seconds?: number | null;
    time_formatted?: string | null;
}

export interface SeasonMatrixItem {
    year: number;
    round_number: number;
    circuit_sk: string;
    country: string;
    location: string;
    official_event_name: string;
    circuit_short_code: string;
    country_flag: string;
    round_status: 'Completed' | 'In Progress' | 'Scheduled';
    has_sprint: boolean;
    driver_id: string;
    driver_full_name: string;
    driver_abbreviation: string;
    driver_number: number | null;
    driver_nationality: string | null;
    driver_headshot_url: string | null;
    team_id: string;
    team_name: string;
    team_color: string | null;
    championship_position: number;
    total_driver_points: number;
    total_driver_wins: number;
    total_driver_podiums: number;
    is_participated: boolean;
    race_grid_position: number | null;
    race_finishing_position: number | null;
    race_status: string | null;
    classification_status: string | null;
    classified_position: string | null;
    laps_completed: number | null;
    race_points: number;
    sprint_grid_position: number | null;
    sprint_finishing_position: number | null;
    sprint_points: number;
    total_round_points: number;
    is_pole: boolean;
    is_fastest_lap: boolean;
    result_category:
    | 'p1'
    | 'p2'
    | 'p3'
    | 'points'
    | 'no_points'
    | 'retired'
    | 'dns'
    | 'dsq'
    | 'scheduled'
    | 'in_progress'
    | 'not_participated';
    result_code: string | null;
    sprint_result_category?:
    | 'p1'
    | 'p2'
    | 'p3'
    | 'points'
    | 'no_points'
    | 'retired'
    | 'dns'
    | 'dsq'
    | 'scheduled'
    | 'in_progress'
    | 'not_participated'
    | null;
    sprint_result_code?: string | null;
}

export interface DriverCatalogItem {
    driver_id: string;
    broadcast_name?: string;
    driver_abbreviation?: string;
    driver_full_name: string;
    driver_nationality?: string;
    driver_headshot_url?: string;
    team_id?: string | null;
    team_name?: string;
    team_color?: string;
    is_active: boolean;
    total_world_championships: number;
    total_gps: number;
    total_seasons: number;
    first_season: number;
    last_season: number;
    total_wins: number;
    race_wins: number;
    sprint_wins: number;
    total_poles_to_win?: number;
    pole_to_win_rate?: number;
    total_podiums: number;
    race_podiums?: number;
    sprint_podiums?: number;
    race_poles: number;
    sprint_poles?: number;
    total_q2_appearences?: number;
    total_q3_appearences?: number;
    total_fastest_laps: number;
    total_points: number;
    best_finish_position?: number;
    best_grid_position?: number;
    total_dnfs?: number;
    rank_world_championships?: number;
    rank_wins?: number;
    rank_race_wins?: number;
    rank_sprint_wins?: number;
    rank_total_wins?: number;
    rank_poles?: number;
    rank_podiums?: number;
    rank_race_podiums?: number;
    rank_sprint_podiums?: number;
    rank_total_podiums?: number;
    rank_gps?: number;
    rank_seasons?: number;
    rank_q3_appearences?: number;
    rank_q2_appearences?: number;
    rank_points?: number;
}

export interface DriverSeasonSummaryItem {
    year: number;
    driver_id: string;
    driver_full_name: string;
    team_name: string;
    team_color: string;
    championship_position: number;
    is_season_completed: boolean;
    total_gps: number;
    total_wins: number;
    race_wins: number;
    sprint_wins: number;
    total_podiums: number;
    race_podiums: number;
    sprint_podiums: number;
    race_poles: number;
    sprint_poles: number;
    fastest_laps: number;
    total_points: number;
    race_points: number;
    sprint_points: number;
    best_finish_position?: number;
    best_grid_position?: number;
    total_dnfs: number;
    q2_appearences?: number;
    q3_appearences?: number;
    poles_to_win?: number;
    pole_to_win_rate?: number;
}

export interface DriverCircuitPerformanceItem {
    circuit_sk: string;
    circuit_id?: string;
    circuit_name: string;
    location?: string;
    country?: string;
    track_type?: string;
    driver_id: string;
    broadcast_name?: string;
    driver_abbreviation?: string;
    driver_full_name: string;
    driver_nationality?: string;
    driver_headshot_url?: string;
    total_gps: number;
    first_year: number;
    last_year: number;
    total_wins: number;
    race_wins: number;
    sprint_wins: number;
    total_podiums: number;
    race_podiums: number;
    sprint_podiums: number;
    race_poles: number;
    sprint_poles: number;
    total_fastest_laps: number;
    total_points: number;
    race_points: number;
    sprint_points: number;
    best_finish_position?: number;
    best_grid_position?: number;
    total_dnfs: number;
}

export interface DriverRaceLogItem {
    year: number;
    round_number: number;
    official_event_name: string;
    session_name: string;
    driver_id: string;
    driver_full_name: string;
    driver_number?: number;
    team_id?: string | null;
    team_name: string;
    team_color: string;
    grid_position?: number;
    finishing_position?: number;
    delta_position?: number;
    points: number;
    best_lap?: string;
    gap_to_leader?: string;
    status: string;
    laps_completed?: number;
}

export interface ConstructorCatalogItem {
    team_id: string;
    team_name: string;
    team_color: string;
    is_active: boolean;
    total_world_championships: number;
    total_gps: number;
    total_seasons: number;
    first_season: number;
    last_season: number;
    active_season_competitive_gps?: number;
    total_wins: number;
    race_wins: number;
    sprint_wins: number;
    total_one_two: number;
    race_poles: number;
    sprint_poles: number;
    total_front_row: number;
    total_poles_to_win: number;
    pole_to_win_rate?: number;
    total_podiums: number;
    race_podiums: number;
    sprint_podiums: number;
    total_double_podium: number;
    total_fastest_laps: number;
    total_double_points: number;
    race_points: number;
    sprint_points: number;
    total_points: number;
    best_finish_position?: number;
    best_grid_position?: number;
    total_dnfs: number;
    total_q2_appearences: number;
    total_q3_appearences: number;
    rank_world_championships?: number;
    rank_race_wins?: number;
    rank_sprint_wins?: number;
    rank_total_wins?: number;
    rank_poles?: number;
    rank_race_podiums?: number;
    rank_sprint_podiums?: number;
    rank_total_podiums?: number;
    rank_gps?: number;
    rank_seasons?: number;
    rank_q3_appearences?: number;
    rank_q2_appearences?: number;
    rank_points?: number;
}

export interface ConstructorSeasonDriverLineup {
    driver_id: string;
    driver_full_name: string;
    driver_abbreviation?: string;
    driver_headshot_url?: string | null;
    gps_raced: number;
    points: number;
}

export interface ConstructorSeasonSummaryItem {
    year: number;
    team_id: string;
    team_name: string;
    team_color: string;
    total_gps: number;
    competitive_gps: number;
    race_wins: number;
    sprint_wins: number;
    total_wins: number;
    race_poles: number;
    sprint_poles: number;
    poles_to_win: number;
    race_podiums: number;
    sprint_podiums: number;
    total_podiums: number;
    q2_appearences: number;
    q3_appearences: number;
    race_points: number;
    sprint_points: number;
    total_points: number;
    best_finish_position?: number;
    best_grid_position?: number;
    total_dnfs: number;
    total_one_two: number;
    total_double_podium: number;
    total_double_points: number;
    total_front_row: number;
    fastest_laps: number;
    pole_to_win_rate?: number;
    is_season_completed: boolean;
    championship_position: number;
    drivers_lineup?: ConstructorSeasonDriverLineup[];
    drivers_used_count?: number;
}

export interface ConstructorDriverSummaryItem {
    team_id: string;
    team_name: string;
    team_color: string;
    driver_id: string;
    broadcast_name?: string;
    driver_abbreviation?: string;
    driver_full_name: string;
    driver_nationality?: string;
    driver_headshot_url?: string;
    seasons_count: number;
    first_season: number;
    last_season: number;
    seasons_list: string;
    gps_raced: number;
    competitive_gps: number;
    driver_titles_with_team: number;
    race_wins: number;
    sprint_wins: number;
    total_wins: number;
    race_poles: number;
    sprint_poles: number;
    race_podiums: number;
    sprint_podiums: number;
    total_podiums: number;
    fastest_laps: number;
    points_finishes: number;
    race_points: number;
    sprint_points: number;
    total_points: number;
    best_finish_position?: number;
    best_grid_position?: number;
    total_dnfs: number;
    rank_in_team_points: number;
    rank_in_team_wins: number;
    rank_in_team_gps: number;
    rank_in_team_titles: number;
}

export interface ConstructorRaceLogDriverResult {
    driver_id: string;
    driver_full_name: string;
    driver_headshot_url?: string;
    driver_number?: number;
    grid_position?: number;
    finishing_position?: number;
    points: number;
    status?: string;
}

export interface ConstructorRaceLogItem {
    year: number;
    round_number: number;
    official_event_name: string;
    session_name: string;
    team_name: string;
    team_color: string;
    drivers_results: ConstructorRaceLogDriverResult[];
    team_points: number;
    best_finish?: number;
    podiums_count: number;
    wins_count: number;
    is_one_two: boolean;
    is_double_podium: boolean;
    is_double_points: boolean;
}

export interface CircuitOverviewItem {
    circuit_id: string;
    circuit_name: string;
    country: string;
    location: string;
    track_type: string | null;

    total_gps_completed: number;
    total_gps_scheduled: number;
    first_gp_year: number | null;
    last_gp_year: number | null;
    seasons_list?: string | null;
    years_held?: number[] | null;
    total_dnfs: number;
    avg_dnfs_per_race: number;

    // Equipe mais vitoriosa
    most_wins_team_id?: string | null;
    most_wins_team?: string | null;
    most_wins_team_color?: string | null;
    most_wins_team_count?: number;

    // Maior vencedor de GP
    most_wins_driver_id?: string | null;
    most_wins_driver?: string | null;
    most_wins_driver_code?: string | null;
    most_wins_driver_nationality?: string | null;
    most_wins_driver_headshot_url?: string | null;
    most_wins_count?: number;

    // Maior número de pódios em GP
    most_podiums_driver_id?: string | null;
    most_podiums_driver?: string | null;
    most_podiums_driver_code?: string | null;
    most_podiums_driver_nationality?: string | null;
    most_podiums_driver_headshot_url?: string | null;
    most_podiums_count?: number;

    // Maior número de poles
    most_poles_driver_id?: string | null;
    most_poles_driver?: string | null;
    most_poles_driver_code?: string | null;
    most_poles_driver_nationality?: string | null;
    most_poles_driver_headshot_url?: string | null;
    most_poles_count?: number;

    // Maior vencedor de sprint
    most_sprint_wins_driver_id?: string | null;
    most_sprint_wins_driver?: string | null;
    most_sprint_wins_driver_code?: string | null;
    most_sprint_wins_driver_nationality?: string | null;
    most_sprint_wins_driver_headshot_url?: string | null;
    most_sprint_wins_count?: number;

    // Recorde de volta em corrida
    race_lap_record_driver_id?: string | null;
    race_lap_record_driver?: string | null;
    race_lap_record_driver_code?: string | null;
    race_lap_record_headshot_url?: string | null;
    race_lap_record_team?: string | null;
    race_lap_record_team_color?: string | null;
    race_lap_record_year?: number | null;
    race_lap_record_seconds?: number | null;
    race_lap_record_formatted?: string | null;

    // Recorde de volta em classificação
    quali_lap_record_driver_id?: string | null;
    quali_lap_record_driver?: string | null;
    quali_lap_record_driver_code?: string | null;
    quali_lap_record_headshot_url?: string | null;
    quali_lap_record_team?: string | null;
    quali_lap_record_team_color?: string | null;
    quali_lap_record_year?: number | null;
    quali_lap_record_seconds?: number | null;
    quali_lap_record_formatted?: string | null;
}

