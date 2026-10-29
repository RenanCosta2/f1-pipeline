"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  DriverCatalogItem,
  DriverSeasonSummaryItem,
  DriverCircuitPerformanceItem,
  DriverRaceLogItem
} from "@/types/f1";
import {
  Trophy,
  Flag,
  Table2,
  Calendar,
  TrendingUp,
  Zap,
  Timer,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RotateCcw,
  Minus,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Crosshair,
  ExternalLink,
  Gauge,
  Crown,
  MapPin,
  Sparkles,
  ArrowRightLeft
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { CircuitLink, getCountryFlag } from "@/lib/circuitUtils";
import { TeamLink } from "@/lib/teamUtils";

interface Props {
  profile: DriverCatalogItem;
  seasons: DriverSeasonSummaryItem[];
  circuits: DriverCircuitPerformanceItem[];
  raceLog: DriverRaceLogItem[];
}

const SEASONS_PER_PAGE = 8;
const CIRCUITS_PER_PAGE = 10;
const RACES_PER_PAGE = 12;

function TableSortHeader({
  label,
  columnKey,
  currentSortKey,
  currentSortDir,
  onSort,
  align = "left",
  className = "",
  colSpan,
  rowSpan,
}: {
  label: string;
  columnKey: string;
  currentSortKey: string | null;
  currentSortDir: "asc" | "desc";
  onSort: (key: string) => void;
  align?: "left" | "center" | "right";
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  const isActive = currentSortKey === columnKey;
  const justifyClass =
    align === "center"
      ? "justify-center"
      : align === "right"
        ? "justify-end"
        : "justify-start";

  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      onClick={() => onSort(columnKey)}
      className={`py-2.5 px-3 cursor-pointer select-none transition-colors group hover:text-white ${isActive ? "text-white bg-white/[0.08]" : "text-f1-subtle"
        } ${className}`}
      title={`Clique para ordenar por ${label}`}
    >
      <div className={`inline-flex items-center gap-1 w-full ${justifyClass}`}>
        <span>{label}</span>
        {isActive ? (
          currentSortDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-f1-red shrink-0" />
          ) : (
            <ArrowDown className="h-3 w-3 text-f1-red shrink-0" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-25 group-hover:opacity-80 transition-opacity shrink-0" />
        )}
      </div>
    </th>
  );
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

export default function DriverProfileTabs({ profile, seasons, circuits, raceLog }: Props) {
  const [activeTab, setActiveTab] = useState<"seasons" | "circuits" | "races">("seasons");
  const [circuitSearch, setCircuitSearch] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");

  // Paginação das tabelas
  const [seasonsPage, setSeasonsPage] = useState<number>(1);
  const [circuitsPage, setCircuitsPage] = useState<number>(1);
  const [raceLogPage, setRaceLogPage] = useState<number>(1);

  // Temporada selecionada para o Raio-X na aba "Temporada a Temporada"
  const [selectedSeasonYear, setSelectedSeasonYear] = useState<number>(() => {
    const latest = seasons.slice().sort((a, b) => b.year - a.year)[0];
    return latest ? latest.year : new Date().getFullYear();
  });
  const [showFullTable, setShowFullTable] = useState<boolean>(true);
  const [seasonQualiStage, setSeasonQualiStage] = useState<"q3" | "q2">("q3");
  const [careerQualiStage, setCareerQualiStage] = useState<"q3" | "q2">("q3");

  const teamColor = profile.team_color || "#E10600";

  // ---------------------------------------------------------------------------
  // ORDENAÇÃO DE TABELAS
  // ---------------------------------------------------------------------------
  // 1. Race Log
  const [raceLogSortKey, setRaceLogSortKey] = useState<string | null>(null);
  const [raceLogSortDir, setRaceLogSortDir] = useState<"asc" | "desc">("desc");

  const getRaceLogDefaultDir = (key: string): "asc" | "desc" => {
    if (key === "points" || key === "delta_position") return "desc";
    return "asc";
  };

  const handleRaceLogSort = (key: string) => {
    setRaceLogPage(1);
    const defaultDir = getRaceLogDefaultDir(key);
    if (raceLogSortKey !== key) {
      setRaceLogSortKey(key);
      setRaceLogSortDir(defaultDir);
    } else {
      if (raceLogSortDir === defaultDir) {
        setRaceLogSortDir(defaultDir === "asc" ? "desc" : "asc");
      } else {
        setRaceLogSortKey(null);
      }
    }
  };

  // 2. Circuitos
  const [circuitSortKey, setCircuitSortKey] = useState<string | null>(null);
  const [circuitSortDir, setCircuitSortDir] = useState<"asc" | "desc">("desc");

  const getCircuitDefaultDir = (key: string): "asc" | "desc" => {
    if (
      key === "circuit_name" ||
      key === "country" ||
      key === "best_finish_position"
    ) {
      return "asc";
    }
    return "desc";
  };

  const handleCircuitSort = (key: string) => {
    setCircuitsPage(1);
    const defaultDir = getCircuitDefaultDir(key);
    if (circuitSortKey !== key) {
      setCircuitSortKey(key);
      setCircuitSortDir(defaultDir);
    } else {
      if (circuitSortDir === defaultDir) {
        setCircuitSortDir(defaultDir === "asc" ? "desc" : "asc");
      } else {
        setCircuitSortKey(null);
      }
    }
  };

  // 3. Temporadas
  const [seasonSortKey, setSeasonSortKey] = useState<string | null>(null);
  const [seasonSortDir, setSeasonSortDir] = useState<"asc" | "desc">("desc");

  const getSeasonDefaultDir = (key: string): "asc" | "desc" => {
    if (key === "championship_position" || key === "team_name") {
      return "asc";
    }
    return "desc";
  };

  const handleSeasonSort = (key: string) => {
    setSeasonsPage(1);
    const defaultDir = getSeasonDefaultDir(key);
    if (seasonSortKey !== key) {
      setSeasonSortKey(key);
      setSeasonSortDir(defaultDir);
    } else {
      if (seasonSortDir === defaultDir) {
        setSeasonSortDir(defaultDir === "asc" ? "desc" : "asc");
      } else {
        setSeasonSortKey(null);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // DADOS FILTRADOS E ORDENADOS
  // ---------------------------------------------------------------------------
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(raceLog.map((r) => r.year)));
    return years.sort((a, b) => b - a);
  }, [raceLog]);

  const filteredRaceLog = useMemo(() => {
    if (selectedSeason === "all") return raceLog;
    return raceLog.filter((r) => r.year.toString() === selectedSeason);
  }, [raceLog, selectedSeason]);

  const sortedRaceLog = useMemo(() => {
    if (!raceLogSortKey) return filteredRaceLog;
    return [...filteredRaceLog].sort((a, b) => {
      const valA: any = (a as any)[raceLogSortKey];
      const valB: any = (b as any)[raceLogSortKey];

      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return raceLogSortDir === "asc" ? valA - valB : valB - valA;
      }

      const strA = valA.toString().toLowerCase();
      const strB = valB.toString().toLowerCase();
      return raceLogSortDir === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [filteredRaceLog, raceLogSortKey, raceLogSortDir]);

  const totalRaceLogPages = Math.ceil(sortedRaceLog.length / RACES_PER_PAGE) || 1;
  const paginatedRaceLog = useMemo(() => {
    const start = (raceLogPage - 1) * RACES_PER_PAGE;
    return sortedRaceLog.slice(start, start + RACES_PER_PAGE);
  }, [sortedRaceLog, raceLogPage]);

  const filteredCircuits = useMemo(() => {
    if (!circuitSearch.trim()) return circuits;
    const term = circuitSearch.toLowerCase();
    return circuits.filter(
      (c) =>
        c.circuit_name.toLowerCase().includes(term) ||
        (c.country && c.country.toLowerCase().includes(term)) ||
        (c.location && c.location.toLowerCase().includes(term))
    );
  }, [circuits, circuitSearch]);

  const sortedCircuits = useMemo(() => {
    if (!circuitSortKey) return filteredCircuits;
    return [...filteredCircuits].sort((a, b) => {
      const valA: any = (a as any)[circuitSortKey];
      const valB: any = (b as any)[circuitSortKey];

      if (circuitSortKey === "best_finish_position") {
        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        return circuitSortDir === "asc" ? valA - valB : valB - valA;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return circuitSortDir === "asc" ? valA - valB : valB - valA;
      }

      const strA = (valA ?? "").toString().toLowerCase();
      const strB = (valB ?? "").toString().toLowerCase();
      return circuitSortDir === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [filteredCircuits, circuitSortKey, circuitSortDir]);

  const totalCircuitPages = Math.ceil(sortedCircuits.length / CIRCUITS_PER_PAGE) || 1;
  const paginatedCircuits = useMemo(() => {
    const start = (circuitsPage - 1) * CIRCUITS_PER_PAGE;
    return sortedCircuits.slice(start, start + CIRCUITS_PER_PAGE);
  }, [sortedCircuits, circuitsPage]);

  const sortedSeasons = useMemo(() => {
    if (!seasonSortKey) return seasons;
    return [...seasons].sort((a, b) => {
      const valA: any = (a as any)[seasonSortKey];
      const valB: any = (b as any)[seasonSortKey];

      if (seasonSortKey === "championship_position") {
        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        return seasonSortDir === "asc" ? valA - valB : valB - valA;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return seasonSortDir === "asc" ? valA - valB : valB - valA;
      }

      const strA = (valA ?? "").toString().toLowerCase();
      const strB = (valB ?? "").toString().toLowerCase();
      return seasonSortDir === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [seasons, seasonSortKey, seasonSortDir]);

  const totalSeasonPages = Math.ceil(sortedSeasons.length / SEASONS_PER_PAGE) || 1;
  const paginatedSeasons = useMemo(() => {
    const start = (seasonsPage - 1) * SEASONS_PER_PAGE;
    return sortedSeasons.slice(start, start + SEASONS_PER_PAGE);
  }, [sortedSeasons, seasonsPage]);

  // ---------------------------------------------------------------------------
  // DADOS DO GRÁFICO DE TEMPORADAS
  // ---------------------------------------------------------------------------
  const seasonPositionData = useMemo(() => {
    const sorted = [...seasons].sort((a, b) => a.year - b.year);
    if (!sorted.length) return [];

    const validPositions = sorted
      .map((s) => s.championship_position)
      .filter((pos): pos is number => typeof pos === "number" && pos > 0);
    const maxPos = Math.max(...validPositions, 20);

    return sorted.map((s) => {
      const pos = s.championship_position;
      const heightScore = pos ? Math.max(1, maxPos + 2 - pos) : 0;
      const totalPoles = (s.race_poles || 0) + (s.sprint_poles || 0);
      const raceWins = s.race_wins ?? s.total_wins;
      const racePodiums = s.race_podiums ?? s.total_podiums;
      const winRate = s.total_gps > 0 ? ((raceWins / s.total_gps) * 100).toFixed(1) : "0";
      const podiumRate = s.total_gps > 0 ? ((racePodiums / s.total_gps) * 100).toFixed(1) : "0";
      const q3Rate = s.total_gps > 0 ? (((s.q3_appearences || 0) / s.total_gps) * 100).toFixed(1) : "0";
      const q2Rate = s.total_gps > 0 ? (((s.q2_appearences || 0) / s.total_gps) * 100).toFixed(1) : "0";
      const finishRate = s.total_gps > 0 ? (((s.total_gps - s.total_dnfs) / s.total_gps) * 100).toFixed(1) : "0";
      const ptsPerGp = s.total_gps > 0 ? (s.total_points / s.total_gps).toFixed(1) : "0";

      return {
        year: s.year.toString(),
        yearNum: s.year,
        position: pos,
        heightScore,
        team_name: s.team_name,
        team_color: s.team_color || teamColor,
        is_season_completed: s.is_season_completed,
        total_points: s.total_points,
        race_points: s.race_points,
        sprint_points: s.sprint_points,
        total_wins: s.total_wins,
        race_wins: s.race_wins,
        sprint_wins: s.sprint_wins,
        total_podiums: s.total_podiums,
        race_podiums: s.race_podiums,
        sprint_podiums: s.sprint_podiums,
        race_poles: s.race_poles || 0,
        sprint_poles: s.sprint_poles || 0,
        total_poles: totalPoles,
        poles_to_win: s.poles_to_win || 0,
        pole_to_win_rate: s.pole_to_win_rate,
        q2_appearences: s.q2_appearences || 0,
        q3_appearences: s.q3_appearences || 0,
        total_gps: s.total_gps,
        fastest_laps: s.fastest_laps || 0,
        best_finish_position: s.best_finish_position,
        best_grid_position: s.best_grid_position,
        total_dnfs: s.total_dnfs,
        winRate,
        podiumRate,
        q3Rate,
        q2Rate,
        finishRate,
        ptsPerGp
      };
    });
  }, [seasons, teamColor]);

  const currentSeason = useMemo(() => {
    return (
      seasonPositionData.find((s) => s.yearNum === selectedSeasonYear) ||
      seasonPositionData[seasonPositionData.length - 1] ||
      null
    );
  }, [seasonPositionData, selectedSeasonYear]);

  // ---------------------------------------------------------------------------
  // CÁLCULOS DO RAIO-X DE CARREIRA
  // ---------------------------------------------------------------------------
  const careerStats = useMemo(() => {
    const raceWins = profile.race_wins ?? profile.total_wins;
    const sprintWins = profile.sprint_wins ?? 0;
    const racePodiums = profile.race_podiums ?? (profile.total_podiums - (profile.sprint_podiums ?? 0));
    const sprintPodiums = profile.sprint_podiums ?? 0;

    const winRate = profile.total_gps > 0 ? ((raceWins / profile.total_gps) * 100).toFixed(1) : "0.0";
    const podiumRate = profile.total_gps > 0 ? ((profile.total_podiums / profile.total_gps) * 100).toFixed(1) : "0.0";
    const avgPoints = profile.total_gps > 0 ? (profile.total_points / profile.total_gps).toFixed(1) : "0.0";

    const poles = profile.race_poles || 0;
    const polesToWin = profile.total_poles_to_win || 0;
    const poleToWinRate =
      poles > 0
        ? ((polesToWin / poles) * 100).toFixed(1)
        : null;

    const q3 = profile.total_q3_appearences || 0;
    const q3Rate = profile.total_gps > 0 ? ((q3 / profile.total_gps) * 100).toFixed(1) : "0.0";
    const q2 = profile.total_q2_appearences || 0;
    const q2Rate = profile.total_gps > 0 ? ((q2 / profile.total_gps) * 100).toFixed(1) : "0.0";

    const dnfs = profile.total_dnfs || 0;
    const finishRate = profile.total_gps > 0 ? (((profile.total_gps - dnfs) / profile.total_gps) * 100).toFixed(1) : "100.0";

    return {
      raceWins,
      sprintWins,
      racePodiums,
      sprintPodiums,
      winRate,
      podiumRate,
      avgPoints,
      poles,
      polesToWin,
      poleToWinRate,
      q3,
      q3Rate,
      q2,
      q2Rate,
      dnfs,
      finishRate,
      fastestLaps: profile.total_fastest_laps || 0
    };
  }, [profile]);

  // Top 3 Pistas Favoritas
  const topCircuits = useMemo(() => {
    return [...circuits]
      .sort((a, b) => {
        const winsDiff = (b.race_wins || b.total_wins || 0) - (a.race_wins || a.total_wins || 0);
        if (winsDiff !== 0) return winsDiff;
        const podiumsDiff = (b.total_podiums || 0) - (a.total_podiums || 0);
        if (podiumsDiff !== 0) return podiumsDiff;
        return (b.total_points || 0) - (a.total_points || 0);
      })
      .slice(0, 3);
  }, [circuits]);

  const handleSelectFavoriteCircuit = (circuitName: string) => {
    setActiveTab("circuits");
    setCircuitSearch(circuitName);
    setCircuitsPage(1);
  };

  // Label do gráfico
  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, index } = props;
    const item = seasonPositionData[index];
    if (!item || !item.position) return <g />;

    const isP1 = item.position === 1;
    const isP2 = item.position === 2;
    const isP3 = item.position === 3;
    const textColor = isP1
      ? "#FACC15"
      : isP2
        ? "#E2E8F0"
        : isP3
          ? "#F59E0B"
          : item.position <= 10
            ? "#60A5FA"
            : "#94A3B8";

    const isMany = seasonPositionData.length > 12;
    const labelText = isP1 ? (isMany ? "👑" : "👑 #1") : `#${item.position}`;

    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill={textColor}
        textAnchor="middle"
        fontSize={isMany ? 9 : 10}
        fontWeight="800"
      >
        {labelText}
      </text>
    );
  };

  // Tooltip customizado do gráfico
  const CustomSeasonTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="rounded-xl border border-white/10 bg-[#0B0B10]/95 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-black text-sm text-white">{d.year}</span>
            {!d.is_season_completed ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                EM ANDAMENTO
              </span>
            ) : (
              <span className="text-[10px] text-f1-subtle font-medium">Finalizada</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: d.team_color || "#888" }}
            />
            <TeamLink
              teamName={d.team_name}
              className="text-white font-bold truncate text-[11px] hover:underline decoration-white/30 underline-offset-2"
              title={`Ver perfil de ${d.team_name}`}
            >
              {d.team_name}
            </TeamLink>
          </div>

          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-f1-subtle text-[11px]">Classificação:</span>
            <span className={`font-black text-xs ${d.position === 1 ? "text-amber-400" : "text-white"}`}>
              {d.position === 1 ? "👑 Campeão (#1)" : `P${d.position} Geral`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/5 text-center text-[10px]">
            <div className="bg-white/5 p-1 rounded">
              <div className="text-f1-subtle text-[9px]">GPs</div>
              <div className="font-bold text-white">{d.total_gps}</div>
            </div>
            <div className="bg-white/5 p-1 rounded">
              <div className="text-f1-subtle text-[9px]">Vitórias</div>
              <div className="font-bold text-amber-400">{d.total_wins}</div>
            </div>
            <div className="bg-white/5 p-1 rounded">
              <div className="text-f1-subtle text-[9px]">Pódios</div>
              <div className="font-bold text-blue-300">{d.total_podiums}</div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ========================================================================= */}
      {/* COLUNA ESQUERDA (33%): COCKPIT SIDEBAR - INSIGHTS HISTÓRICOS & EFICIÊNCIA */}
      {/* ========================================================================= */}
      <aside className="lg:col-span-4 space-y-4">
        {/* CARD 1: ESTATUTO HISTÓRICO ALL-TIME (COLOCADO NO TOPO CONFORME SOLICITADO) */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Estatuto Histórico
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              All-Time F1
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Títulos */}
            {profile.total_world_championships > 0 && (
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-f1-subtle text-[11px] flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  Títulos Mundiais:
                </span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-black text-amber-400 text-xs">
                    {profile.total_world_championships}x
                  </span>
                  {profile.rank_world_championships && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      #{profile.rank_world_championships}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Vitórias */}
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-f1-subtle text-[11px] flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                Vitórias em GPs:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-black text-white text-xs">
                  {careerStats.raceWins}
                </span>
                {(profile.rank_race_wins || profile.rank_wins) && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                    #{profile.rank_race_wins || profile.rank_wins}
                  </span>
                )}
              </div>
            </div>

            {/* Pódios */}
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-f1-subtle text-[11px] flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-blue-400" />
                Pódios Totais:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-black text-white text-xs">
                  {profile.total_podiums}
                </span>
                {profile.rank_podiums && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                    #{profile.rank_podiums}
                  </span>
                )}
              </div>
            </div>

            {/* Poles */}
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-f1-subtle text-[11px] flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-purple-400" />
                Pole Positions:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-black text-white text-xs">
                  {profile.race_poles}
                </span>
                {profile.rank_poles && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                    #{profile.rank_poles}
                  </span>
                )}
              </div>
            </div>

            {/* Pontos */}
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-f1-subtle text-[11px]">Pontuação Histórica:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-black text-white text-xs">
                  {Math.round(profile.total_points).toLocaleString("pt-BR")}
                </span>
                {profile.rank_points && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                    #{profile.rank_points}
                  </span>
                )}
              </div>
            </div>

            {/* GPs */}
            <div className="flex items-center justify-between py-1">
              <span className="text-f1-subtle text-[11px]">GPs Disputados:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-black text-white text-xs">
                  {profile.total_gps}
                </span>
                {profile.rank_gps && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                    #{profile.rank_gps}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: RAIO-X DE EFICIÊNCIA DE CARREIRA */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-f1-red" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Raio-X de Eficiência
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-f1-subtle bg-white/5 px-2 py-0.5 rounded">
              Carreira Completa
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Taxa de Vitórias */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-f1-subtle text-[11px]">Taxa de Vitórias (GP)</span>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="font-black text-amber-400 text-sm">{careerStats.winRate}%</span>
                  <span className="text-[10px] text-f1-subtle">
                    ({careerStats.raceWins}/{profile.total_gps})
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Number(careerStats.winRate)))}%` }}
                />
              </div>
            </div>

            {/* Taxa de Pódios */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-f1-subtle text-[11px]">Taxa de Pódios (GP)</span>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="font-black text-blue-300 text-sm">{careerStats.podiumRate}%</span>
                  <span className="text-[10px] text-f1-subtle">
                    ({careerStats.racePodiums}/{profile.total_gps})
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Number(careerStats.podiumRate)))}%` }}
                />
              </div>
            </div>

            {/* Grid 2x2 de Eficiência Secundária */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
              {/* Pole to Win */}
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                <span className="block text-[10px] text-f1-subtle uppercase font-bold tracking-wider">
                  Pole ➔ Vitória
                </span>
                <span className="font-mono text-sm font-black text-purple-300 block mt-0.5">
                  {careerStats.poleToWinRate ? `${careerStats.poleToWinRate}%` : "—"}
                </span>
                <span className="text-[10px] text-f1-subtle font-mono block">
                  {careerStats.polesToWin} de {careerStats.poles} poles
                </span>
              </div>

              {/* Presença Q3 / Q2 */}
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] text-f1-subtle uppercase font-bold tracking-wider">
                    {careerQualiStage === "q3" ? "Presença Q3" : "Presença Q2"}
                  </span>
                  {/* Sliding Toggle: Q3 <-> Q2 */}
                  <button
                    type="button"
                    onClick={() => setCareerQualiStage((prev) => (prev === "q3" ? "q2" : "q3"))}
                    className="relative inline-flex items-center p-0.5 rounded-md bg-black/60 border border-white/10 shrink-0 cursor-pointer select-none group/toggle transition-colors hover:border-white/20 focus:outline-none"
                    title={`Clique para alternar para ${careerQualiStage === "q3" ? "Q2" : "Q3"}`}
                    aria-label={`Alternar entre Q3 e Q2 (atualmente ${careerQualiStage.toUpperCase()})`}
                  >
                    {/* Sliding Thumb */}
                    <span
                      aria-hidden="true"
                      className={`absolute top-0.5 bottom-0.5 w-6 rounded border transition-all duration-200 ease-out shadow-sm pointer-events-none ${careerQualiStage === "q3"
                          ? "left-0.5 translate-x-0 bg-purple-500/25 border-purple-500/40"
                          : "left-0.5 translate-x-6 bg-sky-500/25 border-sky-500/40"
                        }`}
                    />
                    {/* Labels */}
                    <span
                      className={`relative z-10 w-6 text-center py-0.5 text-[9px] font-mono font-bold transition-colors duration-200 pointer-events-none ${careerQualiStage === "q3" ? "text-purple-200" : "text-white/40 group-hover/toggle:text-white/70"
                        }`}
                    >
                      Q3
                    </span>
                    <span
                      className={`relative z-10 w-6 text-center py-0.5 text-[9px] font-mono font-bold transition-colors duration-200 pointer-events-none ${careerQualiStage === "q2" ? "text-sky-200" : "text-white/40 group-hover/toggle:text-white/70"
                        }`}
                    >
                      Q2
                    </span>
                  </button>
                </div>
                <div
                  key={careerQualiStage}
                  className="w-full text-left pt-0.5 animate-in fade-in duration-150"
                >
                  <span className={`font-mono tabular-nums text-sm font-black block mt-0.5 transition-colors duration-150 ${careerQualiStage === "q3" ? "text-purple-300" : "text-sky-300"
                    }`}>
                    {careerQualiStage === "q3" ? careerStats.q3Rate : careerStats.q2Rate}%
                  </span>
                  <span className="text-[10px] text-f1-subtle font-mono tabular-nums block transition-colors duration-200">
                    {careerQualiStage === "q3" ? careerStats.q3 : careerStats.q2} de {profile.total_gps} GPs
                  </span>
                </div>
              </div>

              {/* Média Pontos / GP */}
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                <span className="block text-[10px] text-f1-subtle uppercase font-bold tracking-wider">
                  Média pts / GP
                </span>
                <span className="font-mono text-sm font-black text-white block mt-0.5">
                  {careerStats.avgPoints}
                </span>
                <span className="text-[10px] text-f1-subtle font-mono block">
                  {Math.round(profile.total_points).toLocaleString("pt-BR")} pts tot.
                </span>
              </div>

              {/* Confiabilidade / DNFs */}
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                <span className="block text-[10px] text-f1-subtle uppercase font-bold tracking-wider">
                  Conclusão de GPs
                </span>
                <span className="font-mono text-sm font-black text-emerald-400 block mt-0.5">
                  {careerStats.finishRate}%
                </span>
                <span className="text-[10px] text-rose-400 font-mono block">
                  {careerStats.dnfs} {careerStats.dnfs === 1 ? "abandono" : "abandonos"}
                </span>
              </div>
            </div>

            {/* Linha Rápida de Voltas Mais Rápidas */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-f1-subtle">
              <span className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-zinc-400" />
                Voltas Mais Rápidas:
              </span>
              <span className="font-mono font-bold text-white">
                {careerStats.fastestLaps} voltas
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: PISTAS FAVORITAS (TOP 3 CIRCUITOS) */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Pistas Favoritas
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-f1-subtle bg-white/5 px-2 py-0.5 rounded">
              Top 3 Histórico
            </span>
          </div>

          <div className="space-y-2">
            {topCircuits.map((c) => {
              const flag = getCountryFlag(c.country);
              const wins = c.race_wins || c.total_wins || 0;
              const podiums = c.total_podiums || 0;
              const winPct = c.total_gps > 0 ? ((wins / c.total_gps) * 100).toFixed(0) : "0";

              return (
                <button
                  key={c.circuit_id}
                  type="button"
                  onClick={() => handleSelectFavoriteCircuit(c.circuit_name)}
                  className="w-full text-left rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 p-2.5 transition-all group flex items-center justify-between gap-3"
                  title={`Filtrar desempenho no ${c.circuit_name}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate group-hover:text-white group-hover:underline decoration-white/30 transition-colors">
                          {c.circuit_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-f1-subtle font-mono block">
                        {c.country ? `${c.country} · ` : ""}{c.total_gps} GPs disputados
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-mono tabular-nums font-bold">
                      <span className="text-amber-400" title="Vitórias">
                        {wins}V
                      </span>
                      <span className="text-white/20">•</span>
                      <span className="text-blue-300" title="Pódios">
                        {podiums}P
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono block font-semibold">
                      {winPct}% vitórias
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {circuits.length > 3 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("circuits");
                setCircuitSearch("");
                setCircuitsPage(1);
              }}
              className="w-full mt-3 pt-2 border-t border-white/5 text-[11px] font-bold text-f1-subtle hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <span>Ver todos os {circuits.length} circuitos disputados</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
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
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "seasons"
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                  : "text-f1-subtle hover:text-white hover:bg-white/5"
                }`}
            >
              <Trophy className="h-3.5 w-3.5 shrink-0" />
              <span>Temporadas</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === "seasons" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                  }`}
              >
                {seasons.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("circuits")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "circuits"
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                  : "text-f1-subtle hover:text-white hover:bg-white/5"
                }`}
            >
              <Flag className="h-3.5 w-3.5 shrink-0" />
              <span>Circuitos</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === "circuits" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                  }`}
              >
                {circuits.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("races")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "races"
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                  : "text-f1-subtle hover:text-white hover:bg-white/5"
                }`}
            >
              <Timer className="h-3.5 w-3.5 shrink-0" />
              <span>Corrida a Corrida</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === "races" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                  }`}
              >
                {raceLog.length}
              </span>
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* CONTEÚDO DA ABA 1: TEMPORADA A TEMPORADA                              */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === "seasons" && (
          <div className="space-y-4">
            {/* Bloco Unificado: Gráfico de Posições + Mini Raio-X da Temporada Selecionada */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    Trajetória no Campeonato Mundial
                  </h3>
                  <p className="text-[11px] text-f1-subtle mt-0.5">
                    Classificação final ano a ano. Clique em uma barra para detalhes.
                  </p>
                </div>

                {/* Seletor rápido de temporada */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-f1-subtle font-mono hidden sm:inline">
                    Temporada:
                  </span>
                  <select
                    value={selectedSeasonYear}
                    onChange={(e) => setSelectedSeasonYear(Number(e.target.value))}
                    className="bg-[#1b1b26] border border-white/15 text-white text-xs font-bold font-mono rounded-lg px-2.5 py-1 focus:outline-none focus:border-f1-red cursor-pointer hover:border-white/30 transition-colors"
                    title="Selecionar Temporada"
                  >
                    {seasonPositionData
                      .slice()
                      .reverse()
                      .map((s) => (
                        <option key={s.yearNum} value={s.yearNum} className="bg-[#12121A] text-white">
                          {s.year} {s.position === 1 && s.is_season_completed ? "👑 Campeão" : `(P${s.position})`}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Seletor Rápido de Anos (Pills) */}
              <div className="flex flex-wrap items-center gap-1 max-h-16 overflow-y-auto scrollbar-thin">
                {seasonPositionData
                  .slice()
                  .reverse()
                  .map((s) => {
                    const isSelected = s.yearNum === selectedSeasonYear;
                    const isChamp = s.position === 1 && s.is_season_completed;
                    return (
                      <button
                        key={s.yearNum}
                        type="button"
                        onClick={() => setSelectedSeasonYear(s.yearNum)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all shrink-0 ${isSelected
                            ? "bg-f1-red text-white shadow-sm shadow-f1-red/30 scale-105"
                            : "bg-white/5 text-f1-subtle hover:bg-white/10 hover:text-white"
                          }`}
                      >
                        {isChamp && <span>👑</span>}
                        <span>{s.year}</span>
                      </button>
                    );
                  })}
              </div>

              {/* Gráfico de Colunas de Trajetória */}
              <div className="h-48 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={seasonPositionData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 15 }}
                    barCategoryGap={seasonPositionData.length > 14 ? "4%" : "10%"}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis
                      dataKey="year"
                      stroke="#888888"
                      fontSize={seasonPositionData.length > 14 ? 9 : 10}
                      tickLine={false}
                      axisLine={{ stroke: "#ffffff15" }}
                      interval={0}
                      tickFormatter={(yearStr) =>
                        seasonPositionData.length > 12 ? `'${yearStr.slice(-2)}` : yearStr
                      }
                    />
                    <YAxis hide={true} />
                    <Tooltip
                      content={<CustomSeasonTooltip />}
                      cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                    />
                    <Bar
                      dataKey="heightScore"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={seasonPositionData.length > 14 ? 24 : 32}
                      label={renderCustomBarLabel}
                      onClick={(data) => {
                        if (data && data.yearNum) {
                          setSelectedSeasonYear(data.yearNum);
                        }
                      }}
                    >
                      {seasonPositionData.map((entry, index) => {
                        const isSelected = entry.yearNum === selectedSeasonYear;
                        let barFill = "#334155";
                        let barStroke = isSelected ? "#FFFFFF" : "#475569";

                        if (entry.position === 1) {
                          barFill = "#EAB308";
                          barStroke = isSelected ? "#FFFFFF" : "#FDE047";
                        } else if (entry.position === 2) {
                          barFill = "#94A3B8";
                          barStroke = isSelected ? "#FFFFFF" : "#CBD5E1";
                        } else if (entry.position === 3) {
                          barFill = "#D97706";
                          barStroke = isSelected ? "#FFFFFF" : "#F59E0B";
                        } else if (entry.position <= 10) {
                          barFill = "#2563EB";
                          barStroke = isSelected ? "#FFFFFF" : "#60A5FA";
                        }

                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={barFill}
                            stroke={barStroke}
                            strokeWidth={isSelected ? 2.5 : 1}
                            className="cursor-pointer transition-all hover:opacity-80"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Mini Raio-X da Temporada Selecionada */}
              {currentSeason && (
                <div className="rounded-xl border border-white/5 bg-[#12121A] p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-6 rounded-full shrink-0"
                        style={{ backgroundColor: currentSeason.team_color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">
                            Temporada {currentSeason.year}
                          </h4>
                          <span className="text-xs font-bold text-white/80">
                            • <TeamLink teamName={currentSeason.team_name} className="hover:underline hover:text-white transition-colors">{currentSeason.team_name}</TeamLink>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentSeason.position === 1 && currentSeason.is_season_completed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[11px] font-black">
                          👑 Campeão Mundial
                        </span>
                      ) : !currentSeason.is_season_completed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Em Andamento (P{currentSeason.position})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/15 text-[11px] font-bold font-mono">
                          P{currentSeason.position} Oficial
                        </span>
                      )}

                      <Link
                        href={`/season?year=${currentSeason.year}`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-f1-red text-white border border-white/15 hover:border-f1-red text-[11px] font-bold transition-all group"
                        title={`Acessar central da Temporada ${currentSeason.year}`}
                      >
                        <span>Ver Temporada</span>
                        <ExternalLink className="h-3 w-3 text-f1-subtle group-hover:text-white transition-colors" />
                      </Link>
                    </div>
                  </div>

                  {/* KPIs da Temporada em 5 Colunas (Vitórias, Pódios, Poles, Qualificação Q3/Q2 Interativa, Pontos) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-center text-xs">
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-f1-subtle font-bold uppercase block">
                        Vitórias (GP/Sprint)
                      </span>
                      <span className="font-mono tabular-nums text-sm font-black text-amber-400 block mt-0.5">
                        {currentSeason.total_wins}
                      </span>
                      <span className="text-[10px] text-f1-subtle font-mono tabular-nums block">
                        {currentSeason.race_wins} GP · {currentSeason.sprint_wins} Sprint
                      </span>
                    </div>

                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-f1-subtle font-bold uppercase block">
                        Pódios (GP/Sprint)
                      </span>
                      <span className="font-mono tabular-nums text-sm font-black text-blue-300 block mt-0.5">
                        {currentSeason.total_podiums}
                      </span>
                      <span className="text-[10px] text-f1-subtle font-mono tabular-nums block">
                        {currentSeason.race_podiums} GP · {currentSeason.sprint_podiums} Sprint
                      </span>
                    </div>

                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-f1-subtle font-bold uppercase block">
                        Poles (GP/Sprint)
                      </span>
                      <span className="font-mono tabular-nums text-sm font-black text-purple-300 block mt-0.5">
                        {currentSeason.total_poles}
                      </span>
                      <span className="text-[10px] text-f1-subtle font-mono tabular-nums block">
                        {currentSeason.race_poles} GP · {currentSeason.sprint_poles} Sprint
                      </span>
                    </div>

                    {/* Card Interativo: Q3 e Q2 dividindo o mesmo espaço com alternância fluida */}
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5 flex flex-col justify-between relative">
                      <div className="flex items-center justify-between gap-1 text-[10px] text-f1-subtle font-bold uppercase">
                        <span className="flex items-center gap-1.5 truncate" title={seasonQualiStage === "q3" ? "Aparições no Q3 da classificação" : "Aparições no Q2 da classificação"}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-200 ${seasonQualiStage === "q3" ? "bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]" : "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]"}`} />
                          <span className="text-white/90 transition-colors duration-200">{seasonQualiStage === "q3" ? "Aparições Q3" : "Aparições Q2"}</span>
                        </span>

                        {/* Sliding Toggle Pill: Q3 <-> Q2 */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSeasonQualiStage((prev) => (prev === "q3" ? "q2" : "q3"));
                          }}
                          className="relative inline-flex items-center p-0.5 rounded-md bg-black/60 border border-white/10 shrink-0 cursor-pointer select-none group/toggle transition-colors hover:border-white/20 focus:outline-none"
                          title={`Clique para alternar para ${seasonQualiStage === "q3" ? "Q2" : "Q3"}`}
                          aria-label={`Alternar entre Q3 e Q2 (atualmente ${seasonQualiStage.toUpperCase()})`}
                        >
                          {/* Sliding Thumb */}
                          <span
                            aria-hidden="true"
                            className={`absolute top-0.5 bottom-0.5 w-6 rounded border transition-all duration-200 ease-out shadow-sm pointer-events-none ${seasonQualiStage === "q3"
                                ? "left-0.5 translate-x-0 bg-purple-500/25 border-purple-500/40"
                                : "left-0.5 translate-x-6 bg-sky-500/25 border-sky-500/40"
                              }`}
                          />
                          {/* Labels */}
                          <span
                            className={`relative z-10 w-6 text-center py-0.5 text-[9px] font-mono font-bold transition-colors duration-200 pointer-events-none ${seasonQualiStage === "q3" ? "text-purple-200" : "text-white/40 group-hover/toggle:text-white/70"
                              }`}
                          >
                            Q3
                          </span>
                          <span
                            className={`relative z-10 w-6 text-center py-0.5 text-[9px] font-mono font-bold transition-colors duration-200 pointer-events-none ${seasonQualiStage === "q2" ? "text-sky-200" : "text-white/40 group-hover/toggle:text-white/70"
                              }`}
                          >
                            Q2
                          </span>
                        </button>
                      </div>

                      <div className="w-full text-center py-0.5">
                        <div key={seasonQualiStage} className="animate-in fade-in duration-150">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`font-mono tabular-nums text-sm font-black block mt-0.5 transition-colors duration-150 ${seasonQualiStage === "q3" ? "text-purple-300" : "text-sky-300"
                              }`}>
                              {seasonQualiStage === "q3" ? currentSeason.q3_appearences : currentSeason.q2_appearences}
                            </span>
                            <span className="text-[10px] text-white/30 font-mono tabular-nums">
                              / {currentSeason.total_gps}
                            </span>
                          </div>
                          <span className="text-[10px] text-f1-subtle font-mono tabular-nums block transition-colors duration-150">
                            {seasonQualiStage === "q3"
                              ? `${currentSeason.q3Rate}% das qualis`
                              : `${currentSeason.q2Rate}% das qualis`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-f1-subtle font-bold uppercase block">
                        Pontos Totais
                      </span>
                      <span className="font-mono tabular-nums text-sm font-black text-white block mt-0.5">
                        {Math.round(currentSeason.total_points).toLocaleString("pt-BR")}
                      </span>
                      <span className="text-[10px] text-f1-subtle font-mono tabular-nums block">
                        {currentSeason.ptsPerGp} pts/GP · {currentSeason.total_dnfs} DNF
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TABELA COMPLETA DE TEMPORADAS (ALTA DENSIDADE COM PAGINAÇÃO) */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-lg">
              <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-f1-subtle" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Tabela Detalhada ({seasons.length} temporadas)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {seasonSortKey && (
                    <button
                      type="button"
                      onClick={() => setSeasonSortKey(null)}
                      className="inline-flex items-center gap-1 text-[11px] text-f1-red hover:underline font-bold"
                    >
                      <RotateCcw className="h-3 w-3" /> Restaurar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFullTable(!showFullTable)}
                    className="flex items-center gap-1.5 text-xs font-bold text-f1-subtle hover:text-white"
                  >
                    <span>{showFullTable ? "Ocultar" : "Expandir"}</span>
                    {showFullTable ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {showFullTable && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-black/50 text-[10px] font-black uppercase tracking-wider">
                          <TableSortHeader
                            rowSpan={2}
                            label="Ano"
                            columnKey="year"
                            currentSortKey={seasonSortKey}
                            currentSortDir={seasonSortDir}
                            onSort={handleSeasonSort}
                            className="border-b border-white/10"
                          />
                          <TableSortHeader
                            rowSpan={2}
                            label="Equipe"
                            columnKey="team_name"
                            currentSortKey={seasonSortKey}
                            currentSortDir={seasonSortDir}
                            onSort={handleSeasonSort}
                            className="border-b border-white/10"
                          />
                          <TableSortHeader
                            rowSpan={2}
                            label="Pos."
                            columnKey="championship_position"
                            currentSortKey={seasonSortKey}
                            currentSortDir={seasonSortDir}
                            onSort={handleSeasonSort}
                            align="center"
                            className="border-b border-white/10"
                          />
                          <TableSortHeader
                            rowSpan={2}
                            label="GPs"
                            columnKey="total_gps"
                            currentSortKey={seasonSortKey}
                            currentSortDir={seasonSortDir}
                            onSort={handleSeasonSort}
                            align="center"
                            className="border-b border-white/10"
                          />
                          <TableSortHeader
                            colSpan={2}
                            label="Vitórias"
                            columnKey="total_wins"
                            currentSortKey={seasonSortKey}
                            currentSortDir={seasonSortDir}
                            onSort={handleSeasonSort}
                            align="center"
                            className="border-b border-l border-white/10"
                          />
                          <TableSortHeader
                            colSpan={2}
                            label="Pódios"
                            columnKey="total_podiums"
                            currentSortKey={seasonSortKey}
                            currentSortDir={seasonSortDir}
                            onSort={handleSeasonSort}
                            align="center"
                            className="border-b border-l border-white/10"
                          />
                          <TableSortHeader
                            colSpan={2}
                            label="Poles"
                            columnKey="race_poles"
                            currentSortKey={seasonSortKey}
                            currentSortDir={seasonSortDir}
                            onSort={handleSeasonSort}
                            align="center"
                            className="border-b border-l border-white/10"
                          />
                          <TableSortHeader
                            colSpan={2}
                            label="Quali"
                            columnKey="q3_appearences"
                            currentSortKey={seasonSortKey}
                            currentSortDir={seasonSortDir}
                            onSort={handleSeasonSort}
                            align="center"
                            className="border-b border-l border-white/10"
                          />
                          <TableSortHeader
                            rowSpan={2}
                            label="V. Ráp."
                            columnKey="fastest_laps"
                            currentSortKey={seasonSortKey}
                            currentSortDir={seasonSortDir}
                            onSort={handleSeasonSort}
                            align="center"
                            className="border-b border-l border-white/10"
                          />
                          <TableSortHeader
                            rowSpan={2}
                            label="Pontos"
                            columnKey="total_points"
                            currentSortKey={seasonSortKey}
                            currentSortDir={seasonSortDir}
                            onSort={handleSeasonSort}
                            align="right"
                            className="border-b border-white/10"
                          />
                          <TableSortHeader
                            rowSpan={2}
                            label="DNFs"
                            columnKey="total_dnfs"
                            currentSortKey={seasonSortKey}
                            currentSortDir={seasonSortDir}
                            onSort={handleSeasonSort}
                            align="center"
                            className="border-b border-white/10"
                          />
                        </tr>
                        <tr className="border-b border-white/10 bg-black/30 text-[9px] font-bold tracking-wider uppercase">
                          <th
                            onClick={() => handleSeasonSort("race_wins")}
                            className="pt-1 pb-1.5 text-center text-white/70 w-10 min-w-[36px] border-l border-white/10 cursor-pointer hover:text-white select-none"
                            title="Vitórias GP"
                          >
                            GP
                          </th>
                          <th
                            onClick={() => handleSeasonSort("sprint_wins")}
                            className="pt-1 pb-1.5 text-center text-purple-400 w-10 min-w-[36px] cursor-pointer hover:text-purple-300 select-none"
                            title="Vitórias Sprint"
                          >
                            Spr
                          </th>
                          <th
                            onClick={() => handleSeasonSort("race_podiums")}
                            className="pt-1 pb-1.5 text-center text-white/70 w-10 min-w-[36px] border-l border-white/10 cursor-pointer hover:text-white select-none"
                            title="Pódios GP"
                          >
                            GP
                          </th>
                          <th
                            onClick={() => handleSeasonSort("sprint_podiums")}
                            className="pt-1 pb-1.5 text-center text-purple-400 w-10 min-w-[36px] cursor-pointer hover:text-purple-300 select-none"
                            title="Pódios Sprint"
                          >
                            Spr
                          </th>
                          <th
                            onClick={() => handleSeasonSort("race_poles")}
                            className="pt-1 pb-1.5 text-center text-white/70 w-10 min-w-[36px] border-l border-white/10 cursor-pointer hover:text-white select-none"
                            title="Poles GP"
                          >
                            GP
                          </th>
                          <th
                            onClick={() => handleSeasonSort("sprint_poles")}
                            className="pt-1 pb-1.5 text-center text-purple-400 w-10 min-w-[36px] cursor-pointer hover:text-purple-300 select-none"
                            title="Poles Sprint"
                          >
                            Spr
                          </th>
                          <th
                            onClick={() => handleSeasonSort("q3_appearences")}
                            className="pt-1 pb-1.5 text-center text-purple-300 w-10 min-w-[36px] border-l border-white/10 cursor-pointer hover:text-purple-200 select-none"
                            title="Aparições no Q3 (Top 10)"
                          >
                            Q3
                          </th>
                          <th
                            onClick={() => handleSeasonSort("q2_appearences")}
                            className="pt-1 pb-1.5 text-center text-sky-300 w-10 min-w-[36px] cursor-pointer hover:text-sky-200 select-none"
                            title="Aparições no Q2 (Top 15)"
                          >
                            Q2
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {paginatedSeasons.map((s) => {
                          const isInProgress = !s.is_season_completed;
                          const isChampion = s.championship_position === 1 && s.is_season_completed;
                          const seasonTeamColor = s.team_color || teamColor;
                          const isSelected = s.year === selectedSeasonYear;

                          return (
                            <tr
                              key={s.year}
                              onClick={() => setSelectedSeasonYear(s.year)}
                              className={`cursor-pointer transition-colors ${isSelected
                                  ? "bg-white/[0.08] border-l-4 border-l-f1-red"
                                  : isInProgress
                                    ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]"
                                    : "hover:bg-white/5"
                                }`}
                            >
                              <td className="py-2.5 px-3 font-black text-white font-mono text-xs">
                                <div className="flex items-center gap-1.5">
                                  <Link
                                    href={`/season?year=${s.year}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:text-white hover:underline decoration-white/30 transition-colors inline-flex items-center gap-1 group"
                                    title={`Abrir Temporada de ${s.year}`}
                                  >
                                    <span>{s.year}</span>
                                    <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/60" />
                                  </Link>
                                  {isInProgress && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 font-sans">
                                      <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                                      Atual
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: seasonTeamColor }}
                                  />
                                  <TeamLink
                                    teamName={s.team_name}
                                    className="font-bold text-white/90 truncate max-w-[140px] hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                                    title={`Ver perfil de ${s.team_name}`}
                                  >
                                    {s.team_name}
                                  </TeamLink>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                {isChampion ? (
                                  <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.2 text-[9px] font-black text-amber-400">
                                    👑 P1
                                  </span>
                                ) : isInProgress ? (
                                  <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.2 text-[10px] font-mono font-bold text-emerald-300">
                                    P{s.championship_position}
                                  </span>
                                ) : (
                                  <span className="font-mono font-bold text-white/80">
                                    P{s.championship_position}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-white/80">
                                {s.total_gps}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5">
                                {s.race_wins > 0 ? (
                                  <span className="text-amber-400">{s.race_wins}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono font-bold">
                                {s.sprint_wins > 0 ? (
                                  <span className="text-purple-300">{s.sprint_wins}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5">
                                {s.race_podiums > 0 ? (
                                  <span className="text-blue-300">{s.race_podiums}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono font-bold">
                                {s.sprint_podiums > 0 ? (
                                  <span className="text-purple-300">{s.sprint_podiums}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono font-bold text-white/80 border-l border-white/5">
                                {s.race_poles > 0 ? (
                                  <span className="text-purple-300">{s.race_poles}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono font-bold">
                                {s.sprint_poles > 0 ? (
                                  <span className="text-purple-300">{s.sprint_poles}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono tabular-nums font-bold border-l border-white/5">
                                {s.q3_appearences != null && s.q3_appearences > 0 ? (
                                  <span className="text-purple-300">{s.q3_appearences}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono tabular-nums font-bold">
                                {s.q2_appearences != null && s.q2_appearences > 0 ? (
                                  <span className="text-sky-300">{s.q2_appearences}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-white/80 border-l border-white/5">
                                {s.fastest_laps > 0 ? (
                                  <span className="text-white/90">{s.fastest_laps}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-black text-white">
                                {s.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-f1-subtle">
                                {s.total_dnfs > 0 ? (
                                  <span className="text-rose-400/90 font-bold">{s.total_dnfs}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
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
                    totalItems={sortedSeasons.length}
                    pageSize={SEASONS_PER_PAGE}
                    onPageChange={setSeasonsPage}
                    itemName="temporadas"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* CONTEÚDO DA ABA 2: DESEMPENHO POR CIRCUITO                            */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === "circuits" && (
          <div className="space-y-4">
            {/* Barra de Filtro de Circuito */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0E0E14] p-3.5 shadow-lg">
              <div className="relative min-w-[260px] flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-f1-subtle" />
                <input
                  type="text"
                  value={circuitSearch}
                  onChange={(e) => {
                    setCircuitSearch(e.target.value);
                    setCircuitsPage(1);
                  }}
                  placeholder="Buscar circuito, cidade ou país..."
                  className="w-full rounded-xl border border-white/15 bg-black/40 pl-9 pr-3 py-1.5 text-xs font-bold text-white placeholder-f1-subtle/60 outline-none transition-colors hover:border-white/30 focus:border-f1-red"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-f1-subtle">
                  Exibindo {sortedCircuits.length} de {circuits.length} pistas
                </span>
                {circuitSortKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setCircuitSortKey(null);
                      setCircuitsPage(1);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-f1-red hover:underline font-bold ml-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Restaurar
                  </button>
                )}
              </div>
            </div>

            {/* Tabela de Circuitos */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/50 text-[10px] font-black uppercase tracking-wider">
                      <TableSortHeader
                        rowSpan={2}
                        label="Circuito / GP"
                        columnKey="circuit_name"
                        currentSortKey={circuitSortKey}
                        currentSortDir={circuitSortDir}
                        onSort={handleCircuitSort}
                        className="border-b border-white/10"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="País"
                        columnKey="country"
                        currentSortKey={circuitSortKey}
                        currentSortDir={circuitSortDir}
                        onSort={handleCircuitSort}
                        className="border-b border-white/10"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="GPs"
                        columnKey="total_gps"
                        currentSortKey={circuitSortKey}
                        currentSortDir={circuitSortDir}
                        onSort={handleCircuitSort}
                        align="center"
                        className="border-b border-white/10"
                      />
                      <TableSortHeader
                        colSpan={2}
                        label="Vitórias"
                        columnKey="total_wins"
                        currentSortKey={circuitSortKey}
                        currentSortDir={circuitSortDir}
                        onSort={handleCircuitSort}
                        align="center"
                        className="border-b border-l border-white/10"
                      />
                      <TableSortHeader
                        colSpan={2}
                        label="Pódios"
                        columnKey="total_podiums"
                        currentSortKey={circuitSortKey}
                        currentSortDir={circuitSortDir}
                        onSort={handleCircuitSort}
                        align="center"
                        className="border-b border-l border-white/10"
                      />
                      <TableSortHeader
                        colSpan={2}
                        label="Poles"
                        columnKey="race_poles"
                        currentSortKey={circuitSortKey}
                        currentSortDir={circuitSortDir}
                        onSort={handleCircuitSort}
                        align="center"
                        className="border-b border-l border-white/10"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="Melhor"
                        columnKey="best_finish_position"
                        currentSortKey={circuitSortKey}
                        currentSortDir={circuitSortDir}
                        onSort={handleCircuitSort}
                        align="center"
                        className="border-b border-l border-white/10"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="Pontos"
                        columnKey="total_points"
                        currentSortKey={circuitSortKey}
                        currentSortDir={circuitSortDir}
                        onSort={handleCircuitSort}
                        align="right"
                        className="border-b border-white/10"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="DNFs"
                        columnKey="total_dnfs"
                        currentSortKey={circuitSortKey}
                        currentSortDir={circuitSortDir}
                        onSort={handleCircuitSort}
                        align="center"
                        className="border-b border-white/10"
                      />
                    </tr>
                    <tr className="border-b border-white/10 bg-black/30 text-[9px] font-bold tracking-wider uppercase">
                      <th
                        onClick={() => handleCircuitSort("race_wins")}
                        className="pt-1 pb-1.5 text-center text-white/70 w-10 min-w-[36px] border-l border-white/10 cursor-pointer hover:text-white select-none"
                      >
                        GP
                      </th>
                      <th
                        onClick={() => handleCircuitSort("sprint_wins")}
                        className="pt-1 pb-1.5 text-center text-purple-400 w-10 min-w-[36px] cursor-pointer hover:text-purple-300 select-none"
                      >
                        Spr
                      </th>
                      <th
                        onClick={() => handleCircuitSort("race_podiums")}
                        className="pt-1 pb-1.5 text-center text-white/70 w-10 min-w-[36px] border-l border-white/10 cursor-pointer hover:text-white select-none"
                      >
                        GP
                      </th>
                      <th
                        onClick={() => handleCircuitSort("sprint_podiums")}
                        className="pt-1 pb-1.5 text-center text-purple-400 w-10 min-w-[36px] cursor-pointer hover:text-purple-300 select-none"
                      >
                        Spr
                      </th>
                      <th
                        onClick={() => handleCircuitSort("race_poles")}
                        className="pt-1 pb-1.5 text-center text-white/70 w-10 min-w-[36px] border-l border-white/10 cursor-pointer hover:text-white select-none"
                      >
                        GP
                      </th>
                      <th
                        onClick={() => handleCircuitSort("sprint_poles")}
                        className="pt-1 pb-1.5 text-center text-purple-400 w-10 min-w-[36px] cursor-pointer hover:text-purple-300 select-none"
                      >
                        Spr
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedCircuits.map((c) => {
                      const flag = getCountryFlag(c.country);
                      return (
                        <tr key={c.circuit_id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">
                            <CircuitLink
                              circuitId={c.circuit_id}
                              circuitName={c.circuit_name}
                              className="hover:text-white hover:underline decoration-white/30 transition-colors inline-block"
                              title={`Ver perfil do circuito ${c.circuit_name}`}
                            >
                              {c.circuit_name}
                            </CircuitLink>
                          </td>
                          <td className="py-2.5 px-3 text-f1-subtle">
                            <span className="inline-flex items-center gap-1.5">
                              <span>{flag}</span>
                              <span>{c.country}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-white">
                            {c.total_gps}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5">
                            {c.race_wins > 0 ? (
                              <span className="text-amber-400">{c.race_wins}</span>
                            ) : (
                              <span className="text-white/20">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-mono font-bold">
                            {c.sprint_wins > 0 ? (
                              <span className="text-purple-300">{c.sprint_wins}</span>
                            ) : (
                              <span className="text-white/20">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5">
                            {c.race_podiums > 0 ? (
                              <span className="text-blue-300">{c.race_podiums}</span>
                            ) : (
                              <span className="text-white/20">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-mono font-bold">
                            {c.sprint_podiums > 0 ? (
                              <span className="text-purple-300">{c.sprint_podiums}</span>
                            ) : (
                              <span className="text-white/20">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-mono font-bold text-white/80 border-l border-white/5">
                            {c.race_poles > 0 ? (
                              <span className="text-purple-300">{c.race_poles}</span>
                            ) : (
                              <span className="text-white/20">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-mono font-bold">
                            {c.sprint_poles > 0 ? (
                              <span className="text-purple-300">{c.sprint_poles}</span>
                            ) : (
                              <span className="text-white/20">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold border-l border-white/5">
                            {c.best_finish_position ? (
                              <span className={c.best_finish_position === 1 ? "text-amber-400" : "text-white"}>
                                P{c.best_finish_position}
                              </span>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-white">
                            {c.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-f1-subtle">
                            {c.total_dnfs > 0 ? (
                              <span className="text-rose-400/90 font-bold">{c.total_dnfs}</span>
                            ) : (
                              <span className="text-white/20">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <TablePagination
                currentPage={circuitsPage}
                totalPages={totalCircuitPages}
                totalItems={sortedCircuits.length}
                pageSize={CIRCUITS_PER_PAGE}
                onPageChange={setCircuitsPage}
                itemName="pistas"
              />
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* CONTEÚDO DA ABA 3: HISTÓRICO CORRIDA A CORRIDA (RACE LOG)             */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === "races" && (
          <div className="space-y-4">
            {/* Barra de Filtro de Temporada */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0E0E14] p-3.5 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-f1-subtle">Temporada:</span>
                <select
                  value={selectedSeason}
                  onChange={(e) => {
                    setSelectedSeason(e.target.value);
                    setRaceLogPage(1);
                  }}
                  className="rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-bold font-mono text-white outline-none hover:border-white/30 focus:border-f1-red cursor-pointer"
                >
                  <option value="all">Todas as Temporadas ({availableYears.length} anos)</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y.toString()}>
                      Temporada {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-f1-subtle">
                  Exibindo {sortedRaceLog.length} corridas
                </span>
                {raceLogSortKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setRaceLogSortKey(null);
                      setRaceLogPage(1);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-f1-red hover:underline font-bold ml-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Restaurar
                  </button>
                )}
              </div>
            </div>

            {/* Tabela do Race Log */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/50 text-[10px] font-black uppercase tracking-wider">
                      <TableSortHeader label="Ano" columnKey="year" currentSortKey={raceLogSortKey} currentSortDir={raceLogSortDir} onSort={handleRaceLogSort} />
                      <TableSortHeader label="Rnd" columnKey="round_number" currentSortKey={raceLogSortKey} currentSortDir={raceLogSortDir} onSort={handleRaceLogSort} align="center" />
                      <TableSortHeader label="Grande Prêmio" columnKey="official_event_name" currentSortKey={raceLogSortKey} currentSortDir={raceLogSortDir} onSort={handleRaceLogSort} />
                      <TableSortHeader label="Equipe" columnKey="team_name" currentSortKey={raceLogSortKey} currentSortDir={raceLogSortDir} onSort={handleRaceLogSort} />
                      <TableSortHeader label="Grid" columnKey="grid_position" currentSortKey={raceLogSortKey} currentSortDir={raceLogSortDir} onSort={handleRaceLogSort} align="center" />
                      <TableSortHeader label="Chegada" columnKey="finishing_position" currentSortKey={raceLogSortKey} currentSortDir={raceLogSortDir} onSort={handleRaceLogSort} align="center" />
                      <TableSortHeader label="Delta" columnKey="delta_position" currentSortKey={raceLogSortKey} currentSortDir={raceLogSortDir} onSort={handleRaceLogSort} align="center" />
                      <TableSortHeader label="Pontos" columnKey="points" currentSortKey={raceLogSortKey} currentSortDir={raceLogSortDir} onSort={handleRaceLogSort} align="right" />
                      <TableSortHeader label="Melhor Volta" columnKey="best_lap" currentSortKey={raceLogSortKey} currentSortDir={raceLogSortDir} onSort={handleRaceLogSort} />
                      <TableSortHeader label="Status" columnKey="status" currentSortKey={raceLogSortKey} currentSortDir={raceLogSortDir} onSort={handleRaceLogSort} align="center" />
                      <th className="py-2.5 px-3 text-center text-f1-subtle">Atalho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedRaceLog.map((r, idx) => {
                      const isWin = r.finishing_position === 1;
                      const isPodium = r.finishing_position && r.finishing_position <= 3;
                      const delta = r.delta_position ?? 0;

                      return (
                        <tr key={`${r.year}-${r.round_number}-${idx}`} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-f1-subtle">
                            <Link
                              href={`/season?year=${r.year}`}
                              className="hover:text-white hover:underline decoration-white/30 transition-colors"
                              title={`Ver temporada ${r.year}`}
                            >
                              {r.year}
                            </Link>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-white/60 text-center">
                            <Link
                              href={`/season/round/${r.round_number}?year=${r.year}`}
                              className="hover:text-white transition-colors"
                              title={`Ver GP da etapa ${r.round_number}`}
                            >
                              R{r.round_number}
                            </Link>
                          </td>
                          <td className="py-2 px-3 font-bold text-white">
                            <Link
                              href={`/season/round/${r.round_number}?year=${r.year}`}
                              className="hover:text-white hover:underline decoration-white/30 transition-colors inline-flex items-center gap-1 group"
                              title={`Abrir telemetria e análise completa do GP`}
                            >
                              <span className="truncate max-w-[200px]">
                                {r.official_event_name || `Grand Prix - Round ${r.round_number}`}
                              </span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/60 shrink-0" />
                            </Link>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: r.team_color || teamColor }}
                              />
                              <TeamLink
                                teamName={r.team_name}
                                teamId={r.team_id}
                                className="text-white/80 truncate max-w-[120px] hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                                title={`Ver perfil de ${r.team_name}`}
                              >
                                {r.team_name}
                              </TeamLink>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-f1-subtle">
                            {r.grid_position ? `P${r.grid_position}` : "-"}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-black">
                            {isWin ? (
                              <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/20 text-amber-400 px-1.5 py-0.2 border border-amber-500/30 text-[11px]">
                                🏆 P1
                              </span>
                            ) : isPodium ? (
                              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 border border-emerald-500/30 text-[11px]">
                                P{r.finishing_position}
                              </span>
                            ) : r.finishing_position ? (
                              <span className="text-white">P{r.finishing_position}</span>
                            ) : (
                              <span className="text-f1-subtle">-</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold">
                            {delta > 0 ? (
                              <span className="inline-flex items-center text-emerald-400 gap-0.5">
                                <ArrowUp className="h-2.5 w-2.5" /> +{delta}
                              </span>
                            ) : delta < 0 ? (
                              <span className="inline-flex items-center text-rose-400 gap-0.5">
                                <ArrowDown className="h-2.5 w-2.5" /> {delta}
                              </span>
                            ) : (
                              <span className="text-white/30 font-normal">
                                <Minus className="h-2.5 w-2.5 inline" /> 0
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-white">
                            {r.points > 0 ? (
                              <span className="text-white">+{r.points}</span>
                            ) : (
                              <span className="text-white/30">0</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-f1-subtle text-[11px]">
                            {r.best_lap || "-"}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${r.status === "Finished" || r.status?.startsWith("+")
                                  ? "bg-white/5 text-white/80"
                                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Link
                              href={`/season/round/${r.round_number}?year=${r.year}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-f1-red text-white text-[10px] font-bold border border-white/10 hover:border-f1-red transition-all group"
                              title={`Abrir telemetria e análise completa do GP`}
                            >
                              <span>Ver</span>
                              <ExternalLink className="h-2.5 w-2.5 text-f1-subtle group-hover:text-white transition-colors" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <TablePagination
                currentPage={raceLogPage}
                totalPages={totalRaceLogPages}
                totalItems={sortedRaceLog.length}
                pageSize={RACES_PER_PAGE}
                onPageChange={setRaceLogPage}
                itemName="corridas"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
