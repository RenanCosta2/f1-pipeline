"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CircuitOverviewItem,
  SeasonRaceSummary,
  DriverCircuitPerformanceItem
} from "@/types/f1";
import DriverLink, { getDriverProfileUrl } from "@/lib/driverUtils";
import { TeamLink } from "@/lib/teamUtils";
import { getTrackTypeBadge, formatSeasonsRanges } from "@/lib/circuitUtils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from "recharts";
import {
  TrendingUp,
  Table2,
  Trophy,
  Flag,
  Calendar,
  Zap,
  Timer,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Users,
  Shield,
  ExternalLink,
  Award,
  Crown,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Gauge,
  MapPin
} from "lucide-react";

interface Props {
  overview: CircuitOverviewItem;
  seasons: SeasonRaceSummary[];
  drivers: DriverCircuitPerformanceItem[];
}

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemName = "itens"
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-white/10 bg-black/40 text-xs">
      <span className="text-f1-subtle font-mono text-[11px]">
        Exibindo <strong className="text-white">{startItem}–{endItem}</strong> de <strong className="text-white">{totalItems}</strong> {itemName}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold transition-all text-[11px]"
        >
          Anterior
        </button>
        <span className="px-2 font-mono text-[11px] font-bold text-white/80">
          Pág. {currentPage} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold transition-all text-[11px]"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

const SEASONS_PER_PAGE = 8;
const DRIVERS_PER_PAGE = 10;
const TEAMS_PER_PAGE = 10;

export default function CircuitProfileTabs({ overview, seasons, drivers }: Props) {
  // Aba inicial: Edições da Temporada (o Overview agora está na Sidebar Cockpit à esquerda)
  const [activeTab, setActiveTab] = useState<"seasons" | "drivers" | "teams">("seasons");

  // Paginação
  const [seasonsPage, setSeasonsPage] = useState<number>(1);
  const [driversPage, setDriversPage] = useState<number>(1);
  const [teamsPage, setTeamsPage] = useState<number>(1);

  // Edição selecionada no gráfico e mini Raio-X
  const [selectedEditionYear, setSelectedEditionYear] = useState<number>(() => {
    return seasons.length > 0 ? seasons[0].year : 2026;
  });

  const editionsChartData = useMemo(() => {
    const sorted = seasons.slice().sort((a, b) => a.year - b.year);
    return sorted.map((s) => {
      const winner = s.race_winner_driver || "A definir";
      const winnerCode = s.race_winner_code || (s.race_winner_driver ? s.race_winner_driver.split(" ").pop()?.slice(0, 3).toUpperCase() : "—");
      const teamColor = s.race_winner_team_color || "#334155";
      const dnfs = Number(s.total_dnfs) || 0;

      return {
        year: s.year.toString(),
        yearNum: s.year,
        round: s.round_number,
        winner,
        winnerCode,
        winnerTeam: s.race_winner_team || "—",
        winnerColor: teamColor,
        poleDriver: s.pole_driver || "—",
        poleTeam: s.pole_team || "—",
        fastestLap: s.fastest_lap_driver || "—",
        fastestLapTime: s.fastest_lap_time_formatted || "—",
        dnfs,
        barHeight: Math.max(dnfs, 1),
        raw: s
      };
    });
  }, [seasons]);

  const currentEdition = useMemo(() => {
    return (
      editionsChartData.find((e) => e.yearNum === selectedEditionYear) ||
      editionsChartData[editionsChartData.length - 1] ||
      null
    );
  }, [editionsChartData, selectedEditionYear]);

  // Label no topo das colunas do gráfico (Código do Vencedor)
  const renderCustomCircuitBarLabel = (props: any) => {
    const { x, y, width, index } = props;
    const item = editionsChartData[index];
    if (!item) return <g />;

    return (
      <text
        x={x + width / 2}
        y={y - 6}
        fill="#FFFFFF"
        textAnchor="middle"
        fontSize={editionsChartData.length > 12 ? 9 : 10}
        fontWeight="800"
      >
        {item.winnerCode}
      </text>
    );
  };

  // Tooltip customizado do gráfico de edições
  const CustomCircuitTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="rounded-xl border border-white/10 bg-[#0B0B10]/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-black text-sm text-white">Temporada {d.year}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-f1-red/20 text-f1-red border border-f1-red/30 font-mono">
              Etapa R{d.round}
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-f1-subtle">Vencedor:</span>
              <span className="font-bold text-amber-400">{d.winner}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-f1-subtle">Equipe:</span>
              <span className="text-white font-medium">{d.winnerTeam}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-white/5">
              <span className="text-f1-subtle">Pole Position:</span>
              <span className="text-purple-300 font-medium">{d.poleDriver}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-f1-subtle">Volta Mais Rápida:</span>
              <span className="text-emerald-400 font-mono">{d.fastestLapTime}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-white/5 font-mono">
              <span className="text-f1-subtle">Abandonos (DNFs):</span>
              <span className={d.dnfs > 3 ? "text-rose-400 font-bold" : "text-white"}>{d.dnfs} pilotos</span>
            </div>
          </div>

          <div className="text-[10px] text-center pt-1 text-f1-subtle/70 italic border-t border-white/5">
            Clique na barra para detalhes desta edição
          </div>
        </div>
      );
    }
    return null;
  };

  // Busca e ordenação de Pilotos
  const [driverSearch, setDriverSearch] = useState("");
  const [driverSortKey, setDriverSortKey] = useState<string>("total_wins");
  const [driverSortDir, setDriverSortDir] = useState<"asc" | "desc">("desc");

  const trackBadge = getTrackTypeBadge(overview.track_type);

  // Ordenação de colunas da aba de pilotos
  const handleSortDriver = (key: string) => {
    setDriversPage(1);
    if (driverSortKey === key) {
      setDriverSortDir(driverSortDir === "asc" ? "desc" : "asc");
    } else {
      setDriverSortKey(key);
      setDriverSortDir("desc");
    }
  };

  const filteredAndSortedDrivers = useMemo(() => {
    let result = [...drivers];

    if (driverSearch.trim()) {
      const q = driverSearch.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.driver_full_name.toLowerCase().includes(q) ||
          (d.driver_abbreviation && d.driver_abbreviation.toLowerCase().includes(q)) ||
          (d.driver_nationality && d.driver_nationality.toLowerCase().includes(q))
      );
    }

    result.sort((a: any, b: any) => {
      let valA = a[driverSortKey];
      let valB = b[driverSortKey];

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (typeof valA === "string") {
        return driverSortDir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return driverSortDir === "asc" ? valA - valB : valB - valA;
    });

    return result;
  }, [drivers, driverSearch, driverSortKey, driverSortDir]);

  // Delta entre quali e corrida para o painel de recordes
  const lapDeltaSeconds = useMemo(() => {
    if (overview.race_lap_record_seconds && overview.quali_lap_record_seconds) {
      return Number(overview.race_lap_record_seconds - overview.quali_lap_record_seconds).toFixed(3);
    }
    return null;
  }, [overview.race_lap_record_seconds, overview.quali_lap_record_seconds]);

  // Estatísticas agregadas de equipes na pista
  const teamStats = useMemo(() => {
    const map = new Map<
      string,
      {
        team_name: string;
        team_color: string;
        wins: number;
        poles: number;
        fastest_laps: number;
        first_win_year?: number;
        last_win_year?: number;
      }
    >();

    seasons.forEach((s) => {
      if (s.race_winner_team) {
        const team = s.race_winner_team;
        const color = s.race_winner_team_color || "#E10600";
        const curr = map.get(team) || {
          team_name: team,
          team_color: color,
          wins: 0,
          poles: 0,
          fastest_laps: 0,
          first_win_year: s.year,
          last_win_year: s.year
        };
        curr.wins += 1;
        if (!curr.first_win_year || s.year < curr.first_win_year) curr.first_win_year = s.year;
        if (!curr.last_win_year || s.year > curr.last_win_year) curr.last_win_year = s.year;
        map.set(team, curr);
      }
      if (s.pole_team) {
        const team = s.pole_team;
        const curr = map.get(team) || {
          team_name: team,
          team_color: "#E10600",
          wins: 0,
          poles: 0,
          fastest_laps: 0
        };
        curr.poles += 1;
        map.set(team, curr);
      }
      if (s.fastest_lap_team) {
        const team = s.fastest_lap_team;
        const curr = map.get(team) || {
          team_name: team,
          team_color: s.fastest_lap_team_color || "#E10600",
          wins: 0,
          poles: 0,
          fastest_laps: 0
        };
        curr.fastest_laps += 1;
        map.set(team, curr);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.poles !== a.poles) return b.poles - a.poles;
      return b.fastest_laps - a.fastest_laps;
    });
  }, [seasons]);

  // Paginações
  const totalSeasonPages = Math.ceil(seasons.length / SEASONS_PER_PAGE) || 1;
  const paginatedSeasons = useMemo(() => {
    const start = (seasonsPage - 1) * SEASONS_PER_PAGE;
    return seasons.slice(start, start + SEASONS_PER_PAGE);
  }, [seasons, seasonsPage]);

  const totalDriverPages = Math.ceil(filteredAndSortedDrivers.length / DRIVERS_PER_PAGE) || 1;
  const paginatedDrivers = useMemo(() => {
    const start = (driversPage - 1) * DRIVERS_PER_PAGE;
    return filteredAndSortedDrivers.slice(start, start + DRIVERS_PER_PAGE);
  }, [filteredAndSortedDrivers, driversPage]);

  const totalTeamPages = Math.ceil(teamStats.length / TEAMS_PER_PAGE) || 1;
  const paginatedTeams = useMemo(() => {
    const start = (teamsPage - 1) * TEAMS_PER_PAGE;
    return teamStats.slice(start, start + TEAMS_PER_PAGE);
  }, [teamStats, teamsPage]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ========================================================================= */}
      {/* COLUNA ESQUERDA (33%): COCKPIT SIDEBAR - RECORDES & LENDAS DO AUTÓDROMO   */}
      {/* ========================================================================= */}
      <aside className="lg:col-span-4 space-y-4">
        {/* CARD 1: LENDAS DO AUTÓDROMO (HALL OF FAME) */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Lendas da Pista
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Hall of Fame
            </span>
          </div>

          <div className="space-y-2">
            {/* Mais Vitorioso */}
            {overview.most_wins_driver && (
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-mono font-black text-xs text-white">
                    {overview.most_wins_driver_headshot_url ? (
                      <img
                        src={overview.most_wins_driver_headshot_url}
                        alt={overview.most_wins_driver}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      overview.most_wins_driver_code || "F1"
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block -mb-0.5">
                      Mais Vitorioso
                    </span>
                    <DriverLink
                      driverName={overview.most_wins_driver}
                      className="font-bold text-white text-xs truncate block hover:text-amber-300 transition-colors"
                      title={`Ver perfil de ${overview.most_wins_driver}`}
                    >
                      {overview.most_wins_driver}
                    </DriverLink>
                  </div>
                </div>
                <span className="font-mono font-black text-amber-400 text-xs shrink-0">
                  {overview.most_wins_count}V
                </span>
              </div>
            )}

            {/* Mais Pódios */}
            {overview.most_podiums_driver && (
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-mono font-black text-xs text-white">
                    {overview.most_podiums_driver_headshot_url ? (
                      <img
                        src={overview.most_podiums_driver_headshot_url}
                        alt={overview.most_podiums_driver}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      overview.most_podiums_driver_code || "F1"
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block -mb-0.5">
                      Mais Pódios
                    </span>
                    <DriverLink
                      driverName={overview.most_podiums_driver}
                      className="font-bold text-white text-xs truncate block hover:text-blue-300 transition-colors"
                      title={`Ver perfil de ${overview.most_podiums_driver}`}
                    >
                      {overview.most_podiums_driver}
                    </DriverLink>
                  </div>
                </div>
                <span className="font-mono font-black text-blue-300 text-xs shrink-0">
                  {overview.most_podiums_count}P
                </span>
              </div>
            )}

            {/* Rei da Pole */}
            {overview.most_poles_driver && (
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-mono font-black text-xs text-white">
                    {overview.most_poles_driver_headshot_url ? (
                      <img
                        src={overview.most_poles_driver_headshot_url}
                        alt={overview.most_poles_driver}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      overview.most_poles_driver_code || "F1"
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-purple-400 block -mb-0.5">
                      Rei da Pole
                    </span>
                    <DriverLink
                      driverName={overview.most_poles_driver}
                      className="font-bold text-white text-xs truncate block hover:text-purple-300 transition-colors"
                      title={`Ver perfil de ${overview.most_poles_driver}`}
                    >
                      {overview.most_poles_driver}
                    </DriverLink>
                  </div>
                </div>
                <span className="font-mono font-black text-purple-300 text-xs shrink-0">
                  {overview.most_poles_count} Poles
                </span>
              </div>
            )}

            {/* Equipe Dominante */}
            {overview.most_wins_team && (
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${overview.most_wins_team_color || "#E10600"}22` }}
                  >
                    <Shield
                      className="h-4 w-4"
                      style={{ color: overview.most_wins_team_color || "#E10600" }}
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block -mb-0.5">
                      Equipe Top
                    </span>
                    <TeamLink
                      teamName={overview.most_wins_team}
                      className="font-bold text-white text-xs truncate block hover:underline hover:text-white transition-colors"
                      title={`Ver perfil de ${overview.most_wins_team}`}
                    >
                      {overview.most_wins_team}
                    </TeamLink>
                  </div>
                </div>
                <span className="font-mono font-black text-white text-xs shrink-0">
                  {overview.most_wins_team_count}V
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: ESTATUTO DO AUTÓDROMO & CRONOMETRAGEM OFICIAL */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Recordes Oficiais
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
              Cronometragem
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Recorde em Corrida */}
            <div className="p-2.5 rounded-xl bg-purple-500/[0.04] border border-purple-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1">
                  <Timer className="h-3 w-3" /> Recorde Oficial (GP)
                </span>
                {overview.race_lap_record_year && (
                  <span className="font-mono text-[10px] text-f1-subtle font-bold">
                    {overview.race_lap_record_year}
                  </span>
                )}
              </div>
              <div className="text-xl font-black text-purple-300 font-mono tracking-tight">
                {overview.race_lap_record_formatted || "Não registrado"}
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-300 mt-1 pt-1 border-t border-purple-500/15">
                <span className="font-bold text-white truncate">
                  {overview.race_lap_record_driver || "—"}
                </span>
                <span className="text-f1-subtle font-mono text-[10px]">
                  {overview.race_lap_record_team || ""}
                </span>
              </div>
            </div>

            {/* Recorde Absoluto Quali */}
            <div className="p-2.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Recorde Absoluto (Quali)
                </span>
                {overview.quali_lap_record_year && (
                  <span className="font-mono text-[10px] text-f1-subtle font-bold">
                    {overview.quali_lap_record_year}
                  </span>
                )}
              </div>
              <div className="text-xl font-black text-emerald-300 font-mono tracking-tight">
                {overview.quali_lap_record_formatted || "Não registrado"}
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-300 mt-1 pt-1 border-t border-emerald-500/15">
                <span className="font-bold text-white truncate">
                  {overview.quali_lap_record_driver || "—"}
                </span>
                <span className="text-f1-subtle font-mono text-[10px]">
                  {overview.quali_lap_record_team || ""}
                </span>
              </div>
            </div>

            {/* Delta Quali vs Corrida */}
            {lapDeltaSeconds && (
              <div className="flex items-center justify-between py-1 px-1 border-t border-white/5 font-mono text-[11px]">
                <span className="text-f1-subtle">Delta Quali vs GP:</span>
                <span className="font-bold text-emerald-400">-{lapDeltaSeconds}s</span>
              </div>
            )}

            {/* Total de Edições & Anos */}
            <div className="flex items-center justify-between py-1 px-1 border-t border-white/5 font-mono text-[11px]">
              <span className="text-f1-subtle">Edições Disputadas:</span>
              <span className="font-bold text-white">{overview.total_gps_completed} GPs</span>
            </div>
          </div>
        </div>

        {/* CARD 3: RAIO-X DE COMPETITIVIDADE & SEGURANÇA */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-f1-red" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Raio-X do Traçado
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-f1-subtle bg-white/5 px-2 py-0.5 rounded">
              Desgaste & Atrito
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Média de DNFs por Prova */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-f1-subtle text-[11px]">Média de Abandonos / GP</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {Number(overview.avg_dnfs_per_race || 0).toFixed(1)} /corrida
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (Number(overview.avg_dnfs_per_race || 0) / 6) * 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Total de Abandonos */}
            <div className="flex items-center justify-between py-1 border-t border-white/5 pt-2">
              <span className="text-f1-subtle text-[11px]">Total de Abandonos (DNFs):</span>
              <span className="font-mono font-bold text-rose-400 text-xs">
                {overview.total_dnfs} pilotos
              </span>
            </div>

            {/* Tipo de Pista */}
            <div className="flex items-center justify-between py-1 border-t border-white/5 pt-1.5">
              <span className="text-f1-subtle text-[11px]">Classificação da Pista:</span>
              <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${trackBadge.badgeClass}`}>
                {trackBadge.label}
              </span>
            </div>

            {/* Temporadas com GP Disputadas */}
            <div className="border-t border-white/5 pt-2 space-y-1.5">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-f1-subtle">Temporadas com GP:</span>
                <span className="font-bold text-white">
                  {formatSeasonsRanges(overview.years_held || overview.seasons_list || (overview.first_gp_year ? [overview.first_gp_year, overview.last_gp_year || overview.first_gp_year] : []))}
                </span>
              </div>
              {/* Pills com todos os anos individuais onde houve GP no circuito */}
              {((overview.years_held && overview.years_held.length > 0) || (overview.seasons_list)) && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5 max-h-20 overflow-y-auto scrollbar-thin">
                  {(overview.years_held && overview.years_held.length > 0
                    ? overview.years_held
                    : overview.seasons_list!.split(",").map((s) => Number(s.trim()))
                  ).map((y) => {
                    const isSelected = y === selectedEditionYear;
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setSelectedEditionYear(y)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                          isSelected
                            ? "bg-f1-red text-white shadow-sm shadow-f1-red/30 scale-105"
                            : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                        }`}
                        title={`Clique para selecionar o GP de ${y}`}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* COLUNA DIREITA (67%): PAINEL ANALÍTICO PRINCIPAL COM ABAS COMPACTAS       */}
      {/* ========================================================================= */}
      <main className="lg:col-span-8 space-y-4">
        {/* SELETOR DE ABAS COMPACTO (Estilo Segmented Control Cockpit) */}
        <div className="flex items-center justify-between bg-[#0E0E14] border border-white/10 rounded-2xl p-1.5 shadow-md">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("seasons")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "seasons"
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                  : "text-f1-subtle hover:text-white hover:bg-white/5"
              }`}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>Edições da Temporada</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === "seasons" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                }`}
              >
                {seasons.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("drivers")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "drivers"
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                  : "text-f1-subtle hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>Histórico de Pilotos</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === "drivers" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                }`}
              >
                {drivers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("teams")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "teams"
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                  : "text-f1-subtle hover:text-white hover:bg-white/5"
              }`}
            >
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>Histórico de Equipes</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === "teams" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                }`}
              >
                {teamStats.length}
              </span>
            </button>
          </div>
        </div>

                {/* ========================================================================= */}
        {/* ABA 1: EDIÇÕES DO GP (TEMPORADA A TEMPORADA NO CIRCUITO)                  */}
        {/* ========================================================================= */}
        {activeTab === "seasons" && (
          <div className="space-y-4">
            {/* Bloco Unificado: Gráfico de Vencedores & Atrito + Mini Raio-X da Edição */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    Histórico de Grandes Prêmios & Atrito do Traçado
                  </h3>
                  <p className="text-[11px] text-f1-subtle mt-0.5">
                    Vencedores e taxa de abandonos (DNFs) ano a ano. Clique em uma barra para detalhes da edição.
                  </p>
                </div>

                {/* Seletor rápido de edição */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-f1-subtle font-mono hidden sm:inline">
                    Edição:
                  </span>
                  <select
                    value={selectedEditionYear}
                    onChange={(e) => setSelectedEditionYear(Number(e.target.value))}
                    className="bg-[#1b1b26] border border-white/15 text-white text-xs font-bold font-mono rounded-lg px-2.5 py-1 focus:outline-none focus:border-f1-red cursor-pointer hover:border-white/30 transition-colors"
                    title="Selecionar Edição"
                  >
                    {editionsChartData
                      .slice()
                      .reverse()
                      .map((s) => (
                        <option key={s.yearNum} value={s.yearNum} className="bg-[#12121A] text-white">
                          GP de {s.year} (R{s.round}) — {s.winnerCode}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Seletor Rápido de Anos (Pills com cor da equipe vencedora) */}
              <div className="flex flex-wrap items-center gap-1 max-h-16 overflow-y-auto scrollbar-thin">
                {editionsChartData
                  .slice()
                  .reverse()
                  .map((s) => {
                    const isSelected = s.yearNum === selectedEditionYear;
                    return (
                      <button
                        key={s.yearNum}
                        type="button"
                        onClick={() => setSelectedEditionYear(s.yearNum)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all shrink-0 ${
                          isSelected
                            ? "bg-f1-red text-white shadow-sm shadow-f1-red/30 scale-105"
                            : "bg-white/5 text-f1-subtle hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: s.winnerColor }}
                        />
                        <span>{s.year}</span>
                        <span className="text-[9px] opacity-75">{s.winnerCode}</span>
                      </button>
                    );
                  })}
              </div>

              {/* Gráfico de Colunas de Histórico & Atrito (h-44 sm:h-48) */}
              <div className="h-44 sm:h-48 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={editionsChartData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 15 }}
                    barCategoryGap={editionsChartData.length > 14 ? "4%" : "10%"}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis
                      dataKey="year"
                      stroke="#888888"
                      fontSize={editionsChartData.length > 14 ? 9 : 10}
                      tickLine={false}
                      axisLine={{ stroke: '#ffffff15' }}
                      interval={0}
                      tickFormatter={(yearStr) => editionsChartData.length > 12 ? `'${yearStr.slice(-2)}` : yearStr}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={9}
                      tickLine={false}
                      axisLine={{ stroke: '#ffffff15' }}
                      tickFormatter={(v) => `${v} DNF`}
                      width={38}
                    />
                    <Tooltip
                      content={<CustomCircuitTooltip />}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                    />
                    <Bar
                      dataKey="barHeight"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={editionsChartData.length > 14 ? 24 : 32}
                      label={renderCustomCircuitBarLabel}
                      onClick={(data) => {
                        if (data && data.yearNum) {
                          setSelectedEditionYear(data.yearNum);
                        }
                      }}
                    >
                      {editionsChartData.map((entry, index) => {
                        const isSelected = entry.yearNum === selectedEditionYear;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.winnerColor || "#334155"}
                            stroke={isSelected ? "#FFFFFF" : `${entry.winnerColor}aa`}
                            strokeWidth={isSelected ? 2.5 : 1}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda Informativa */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5 text-[10px] font-bold">
                <span className="text-f1-subtle font-mono">
                  * Altura da barra: Abandonos (DNFs) da corrida · Cor: Escuderia vencedora · Topo: Piloto vitorioso
                </span>
                <span className="text-white/70 font-mono">
                  {overview.circuit_name} ({editionsChartData.length} GPs)
                </span>
              </div>

              {/* Mini Raio-X da Edição Selecionada (Integrado no mesmo card!) */}
              {currentEdition && (
                <div className="rounded-xl border border-white/5 bg-[#12121A] p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-6 rounded-full shrink-0 shadow"
                        style={{ backgroundColor: currentEdition.winnerColor }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">
                            Grande Prêmio de {currentEdition.year}
                          </h4>
                          <span className="text-xs font-bold text-white/80">
                            • Etapa R{currentEdition.round}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[11px] font-black">
                        🏆 {currentEdition.winner}
                      </span>

                      <Link
                        href={`/season/round/${currentEdition.round}?year=${currentEdition.yearNum}`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-f1-red text-white border border-white/15 hover:border-f1-red text-[11px] font-bold transition-all group"
                        title={`Acessar central completa do GP de ${currentEdition.year}`}
                      >
                        <span>Ver Central do GP</span>
                        <ExternalLink className="h-3 w-3 text-f1-subtle group-hover:text-white transition-colors" />
                      </Link>
                    </div>
                  </div>

                  {/* 4 KPIs Compactos em Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    {/* Vencedor */}
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-f1-subtle font-bold uppercase block">
                        Vencedor do GP
                      </span>
                      {currentEdition.winner && currentEdition.winner !== "—" ? (
                        <DriverLink
                          driverName={currentEdition.winner}
                          className="font-mono text-xs font-black text-amber-400 block mt-0.5 truncate hover:text-amber-300 transition-colors"
                          title={`Ver perfil de ${currentEdition.winner}`}
                        >
                          {currentEdition.winner}
                        </DriverLink>
                      ) : (
                        <span className="font-mono text-xs font-black text-amber-400 block mt-0.5 truncate">
                          {currentEdition.winner}
                        </span>
                      )}
                      {currentEdition.winnerTeam && currentEdition.winnerTeam !== "—" ? (
                        <TeamLink
                          teamName={currentEdition.winnerTeam}
                          className="text-[10px] text-white/70 block truncate hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                          title={`Ver perfil de ${currentEdition.winnerTeam}`}
                        >
                          {currentEdition.winnerTeam}
                        </TeamLink>
                      ) : (
                        <span className="text-[10px] text-white/70 block truncate">
                          {currentEdition.winnerTeam}
                        </span>
                      )}
                    </div>

                    {/* Pole Position */}
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-purple-400 font-bold uppercase block">
                        Pole Position
                      </span>
                      {currentEdition.poleDriver && currentEdition.poleDriver !== "—" ? (
                        <DriverLink
                          driverName={currentEdition.poleDriver}
                          className="font-mono text-xs font-black text-purple-300 block mt-0.5 truncate hover:text-purple-200 transition-colors"
                          title={`Ver perfil de ${currentEdition.poleDriver}`}
                        >
                          {currentEdition.poleDriver}
                        </DriverLink>
                      ) : (
                        <span className="font-mono text-xs font-black text-purple-300 block mt-0.5 truncate">
                          {currentEdition.poleDriver}
                        </span>
                      )}
                      {currentEdition.poleTeam && currentEdition.poleTeam !== "—" ? (
                        <TeamLink
                          teamName={currentEdition.poleTeam}
                          className="text-[10px] text-white/70 block truncate hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                          title={`Ver perfil de ${currentEdition.poleTeam}`}
                        >
                          {currentEdition.poleTeam}
                        </TeamLink>
                      ) : (
                        <span className="text-[10px] text-white/70 block truncate">
                          {currentEdition.poleTeam}
                        </span>
                      )}
                    </div>

                    {/* Volta Mais Rápida */}
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                        Volta Mais Rápida
                      </span>
                      {currentEdition.fastestLap && currentEdition.fastestLap !== "—" ? (
                        <DriverLink
                          driverName={currentEdition.fastestLap}
                          className="font-mono text-xs font-black text-emerald-300 block mt-0.5 truncate hover:text-emerald-200 transition-colors"
                          title={`Ver perfil de ${currentEdition.fastestLap}`}
                        >
                          {currentEdition.fastestLap}
                        </DriverLink>
                      ) : (
                        <span className="font-mono text-xs font-black text-emerald-300 block mt-0.5 truncate">
                          {currentEdition.fastestLap}
                        </span>
                      )}
                      <span className="text-[10px] text-emerald-400/80 font-mono block">
                        {currentEdition.fastestLapTime}
                      </span>
                    </div>

                    {/* Atrito / Abandonos */}
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-rose-400 font-bold uppercase block">
                        Abandonos (DNFs)
                      </span>
                      <span className="font-mono text-sm font-black text-white block mt-0.5">
                        {currentEdition.dnfs} pilotos
                      </span>
                      <span className="text-[10px] text-f1-subtle font-mono block">
                        {((currentEdition.dnfs / 20) * 100).toFixed(0)}% do grid
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TABELA DETALHADA DE EDIÇÕES (ALTA DENSIDADE COM PAGINAÇÃO) */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-lg">
              <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-f1-subtle" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Tabela Detalhada de Grandes Prêmios ({seasons.length} edições)
                  </span>
                </div>
                <span className="text-[11px] text-f1-subtle font-mono hidden sm:inline">
                  Página {seasonsPage} de {totalSeasonPages}
                </span>
              </div>

              {/* Tabela de Edições */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#12121A] text-f1-subtle uppercase text-[11px]">
                      <th className="py-2.5 px-3">Temporada</th>
                      <th className="py-2.5 px-3">Vencedor do GP</th>
                      <th className="py-2.5 px-3">Equipe</th>
                      <th className="py-2.5 px-3">Pole Position</th>
                      <th className="py-2.5 px-3">Volta Mais Rápida</th>
                      <th className="py-2.5 px-3 text-center">DNFs</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedSeasons.map((race) => {
                      const isSelected = race.year === selectedEditionYear;
                      return (
                        <tr
                          key={`${race.year}-${race.round_number}`}
                          onClick={() => setSelectedEditionYear(race.year)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-white/[0.08] border-l-4 border-l-f1-red"
                              : "hover:bg-white/5"
                          }`}
                        >
                          {/* Temporada e Evento */}
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-f1-red/10 border border-f1-red/30 px-1.5 py-0.5 text-xs font-black text-f1-red">
                                {race.year}
                              </span>
                              <span className="font-bold text-white text-xs font-sans">
                                R{race.round_number}
                              </span>
                            </div>
                          </td>

                          {/* Vencedor do GP */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {race.race_winner_driver ? (
                              <div className="flex items-center gap-2 font-sans">
                                {race.race_winner_headshot_url && (
                                  <img
                                    src={race.race_winner_headshot_url}
                                    alt={race.race_winner_driver}
                                    className="h-6 w-6 rounded-full object-cover bg-white/5 border border-white/10 shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                )}
                                <div>
                                  {race.race_winner_driver_id ? (
                                    <Link
                                      href={getDriverProfileUrl(race.race_winner_driver_id)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="font-bold text-white hover:text-white hover:underline decoration-white/30 transition-colors text-xs block"
                                    >
                                      {race.race_winner_driver}
                                    </Link>
                                  ) : (
                                    <span className="font-bold text-white text-xs block">
                                      {race.race_winner_driver}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>

                          {/* Equipe Vencedora */}
                          <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                            {race.race_winner_team ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: race.race_winner_team_color || "#E10600" }}
                                />
                                <span className="text-white font-medium text-xs truncate max-w-[120px]">
                                  {race.race_winner_team}
                                </span>
                              </div>
                            ) : (
                              <span className="text-white/20 font-mono">—</span>
                            )}
                          </td>

                          {/* Pole Position */}
                          <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                            {race.pole_driver ? (
                              <div>
                                <span className="font-bold text-white text-xs block">
                                  {race.pole_driver}
                                </span>
                                <span className="text-[10px] text-f1-subtle block">
                                  {race.pole_team || "—"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-white/20 font-mono">—</span>
                            )}
                          </td>

                          {/* Volta Mais Rápida */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {race.fastest_lap_driver ? (
                              <div>
                                <span className="font-bold text-purple-300 text-xs block font-sans">
                                  {race.fastest_lap_driver}
                                </span>
                                <span className="text-[10px] text-f1-subtle font-mono block">
                                  {race.fastest_lap_time_formatted || "—"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>

                          {/* DNFs */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-mono font-bold ${
                                Number(race.total_dnfs) > 3
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-white/5 text-zinc-400"
                              }`}
                            >
                              {race.total_dnfs}
                            </span>
                          </td>

                          {/* Ação */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-right">
                            <Link
                              href={`/season/round/${race.round_number}?year=${race.year}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              <span>Ver GP</span>
                              <ChevronRight className="h-3 w-3 text-f1-subtle" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <TablePagination
                currentPage={seasonsPage}
                totalPages={totalSeasonPages}
                totalItems={seasons.length}
                pageSize={SEASONS_PER_PAGE}
                onPageChange={setSeasonsPage}
                itemName="edições"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: HISTÓRICO DE PILOTOS NO CIRCUITO                                   */}
        {/* ========================================================================= */}
        {activeTab === "drivers" && (
          <div className="space-y-4">
            {/* Barra de Busca de Piloto */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-[#12121A]">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-f1-subtle" />
                <input
                  type="text"
                  value={driverSearch}
                  onChange={(e) => {
                    setDriverSearch(e.target.value);
                    setDriversPage(1);
                  }}
                  placeholder="Buscar piloto por nome ou país..."
                  className="w-full bg-[#0A0A10] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-f1-subtle focus:outline-none focus:border-white/30"
                />
              </div>

              <span className="text-xs font-mono text-f1-subtle">
                {filteredAndSortedDrivers.length} de {drivers.length} pilotos
              </span>
            </div>

            {/* Tabela de Pilotos */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#12121A] text-f1-subtle uppercase text-[11px]">
                      <th
                        onClick={() => handleSortDriver("driver_full_name")}
                        className="py-3 px-3 cursor-pointer hover:text-white select-none"
                      >
                        Piloto
                      </th>
                      <th
                        onClick={() => handleSortDriver("total_gps")}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white select-none"
                      >
                        GPs
                      </th>
                      <th
                        onClick={() => handleSortDriver("total_wins")}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white select-none"
                      >
                        Vitórias
                      </th>
                      <th
                        onClick={() => handleSortDriver("total_podiums")}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white select-none"
                      >
                        Pódios
                      </th>
                      <th
                        onClick={() => handleSortDriver("race_poles")}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white select-none"
                      >
                        Poles
                      </th>
                      <th
                        onClick={() => handleSortDriver("total_points")}
                        className="py-3 px-3 text-right cursor-pointer hover:text-white select-none"
                      >
                        Pontos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedDrivers.map((driver) => {
                      const profileUrl = getDriverProfileUrl(driver.driver_id, driver.driver_full_name);

                      return (
                        <tr
                          key={driver.driver_id}
                          className="hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="py-3 px-3">
                            <Link href={profileUrl} className="flex items-center gap-2 group font-sans">
                              <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-mono font-black text-xs text-white">
                                {driver.driver_headshot_url ? (
                                  <img
                                    src={driver.driver_headshot_url}
                                    alt={driver.driver_full_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  driver.driver_abbreviation || driver.driver_full_name.slice(0, 3).toUpperCase()
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-white group-hover:text-white group-hover:underline decoration-white/30 transition-colors block text-xs">
                                  {driver.driver_full_name}
                                </span>
                                <span className="text-[10px] text-f1-subtle font-mono">
                                  {driver.first_year}–{driver.last_year} ({driver.driver_nationality})
                                </span>
                              </div>
                            </Link>
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-white">
                            {driver.total_gps}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={driver.total_wins > 0 ? "text-amber-400 font-bold" : "text-white/30"}>
                              {driver.total_wins}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={driver.total_podiums > 0 ? "text-blue-300 font-bold" : "text-white/30"}>
                              {driver.total_podiums}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={driver.race_poles > 0 ? "text-purple-300 font-bold" : "text-white/30"}>
                              {driver.race_poles}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-black text-white">
                            {driver.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <TablePagination
                currentPage={driversPage}
                totalPages={totalDriverPages}
                totalItems={filteredAndSortedDrivers.length}
                pageSize={DRIVERS_PER_PAGE}
                onPageChange={setDriversPage}
                itemName="pilotos"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: HISTÓRICO DE EQUIPES NO CIRCUITO                                   */}
        {/* ========================================================================= */}
        {activeTab === "teams" && (
          <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 bg-[#12121A] text-f1-subtle uppercase text-[11px]">
                    <th className="py-3 px-3">Equipe / Construtor</th>
                    <th className="py-3 px-3 text-center">Vitórias</th>
                    <th className="py-3 px-3 text-center">Poles</th>
                    <th className="py-3 px-3 text-center">Voltas Mais Rápidas</th>
                    <th className="py-3 px-3 text-right">Período Vencedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedTeams.map((team) => (
                    <tr key={team.team_name} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: team.team_color }}
                          />
                          <TeamLink
                            teamName={team.team_name}
                            className="font-bold text-white text-xs hover:underline decoration-white/30 underline-offset-2 hover:text-white transition-colors"
                            title={`Ver perfil de ${team.team_name}`}
                          >
                            {team.team_name}
                          </TeamLink>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-bold">
                        <span className={team.wins > 0 ? "text-amber-400" : "text-white/30"}>
                          {team.wins}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold">
                        <span className={team.poles > 0 ? "text-purple-300" : "text-white/30"}>
                          {team.poles}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold">
                        <span className={team.fastest_laps > 0 ? "text-emerald-400" : "text-white/30"}>
                          {team.fastest_laps}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-f1-subtle font-mono text-[11px]">
                        {team.first_win_year && team.last_win_year ? (
                          team.first_win_year === team.last_win_year ? (
                            team.first_win_year
                          ) : (
                            `${team.first_win_year} – ${team.last_win_year}`
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={teamsPage}
              totalPages={totalTeamPages}
              totalItems={teamStats.length}
              pageSize={TEAMS_PER_PAGE}
              onPageChange={setTeamsPage}
              itemName="equipes"
            />
          </div>
        )}
      </main>
    </div>
  );
}
