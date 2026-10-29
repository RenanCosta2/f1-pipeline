"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ConstructorCatalogItem,
  ConstructorSeasonSummaryItem,
  ConstructorDriverSummaryItem,
  ConstructorRaceLogItem
} from "@/types/f1";
import {
  Trophy,
  Flag,
  Table2,
  Calendar,
  TrendingUp,
  Zap,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RotateCcw,
  Users,
  Award,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Crown,
  Timer,
  Crosshair,
  Gauge,
  Shield
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
import DriverLink, { getDriverProfileUrl } from "@/lib/driverUtils";

interface Props {
  profile: ConstructorCatalogItem;
  seasons: ConstructorSeasonSummaryItem[];
  drivers: ConstructorDriverSummaryItem[];
  raceLog: ConstructorRaceLogItem[];
}

function TableSortHeader({
  label,
  columnKey,
  currentSortKey,
  currentSortDir,
  onSort,
  align = "left",
  className = "",
  colSpan,
  rowSpan
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
      className={`py-3 px-3 cursor-pointer select-none transition-colors group hover:text-white ${isActive ? "text-white bg-white/[0.08]" : "text-f1-subtle"
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

const SEASONS_PER_PAGE = 8;
const DRIVERS_PER_PAGE = 10;
const RACES_PER_PAGE = 12;

export default function ConstructorProfileTabs({
  profile,
  seasons,
  drivers,
  raceLog
}: Props) {
  // Aba padrão inicial alinhada com o perfil de pilotos: "seasons"
  const [activeTab, setActiveTab] = useState<"seasons" | "drivers" | "races">("seasons");
  const [showFullTable, setShowFullTable] = useState(true);

  // Paginação das tabelas
  const [seasonsPage, setSeasonsPage] = useState<number>(1);
  const [driversPage, setDriversPage] = useState<number>(1);
  const [racesPage, setRacesPage] = useState<number>(1);

  const teamColor = profile.team_color || "#E10600";

  // ---------------------------------------------------------------------------
  // 1. TEMPORADA A TEMPORADA
  // ---------------------------------------------------------------------------
  const [selectedSeasonYear, setSelectedSeasonYear] = useState<number>(() => {
    if (seasons.length === 0) return 2026;
    return seasons[0].year;
  });

  const [seasonSortKey, setSeasonSortKey] = useState<string | null>(null);
  const [seasonSortDir, setSeasonSortDir] = useState<"asc" | "desc">("desc");

  const getSeasonDefaultDir = (key: string): "asc" | "desc" => {
    if (
      key === "year" ||
      key === "total_points" ||
      key === "total_wins" ||
      key === "race_wins" ||
      key === "sprint_wins" ||
      key === "total_podiums" ||
      key === "race_podiums" ||
      key === "sprint_podiums" ||
      key === "race_poles" ||
      key === "sprint_poles" ||
      key === "total_one_two" ||
      key === "total_front_row" ||
      key === "total_double_points" ||
      key === "total_gps" ||
      key === "fastest_laps"
    ) {
      return "desc";
    }
    return "asc";
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

  // Dados calculados para cada temporada (para gráfico e cards)
  const seasonPositionData = useMemo(() => {
    const sorted = seasons.slice().sort((a, b) => a.year - b.year);
    if (!sorted.length) return [];

    const validPositions = sorted
      .map((s) => s.championship_position)
      .filter((pos): pos is number => typeof pos === "number" && pos > 0);
    const maxPos = Math.max(...validPositions, 10);
    const maxScore = maxPos + 2;

    return sorted.map((s) => {
      const pos = s.championship_position;
      // Altura inversa proporcional para que P1 seja a barra mais alta
      const heightScore = pos ? Math.max(1, maxScore - pos) : 0;
      const ptsPerGp = s.total_gps > 0 ? (s.total_points / s.total_gps).toFixed(1) : "0";
      const winRate = s.total_gps > 0 ? ((s.race_wins / s.total_gps) * 100).toFixed(1) : "0";
      const podiumRate = s.total_gps > 0 ? ((s.race_podiums / s.total_gps) * 100).toFixed(1) : "0";

      return {
        year: s.year.toString(),
        yearNum: s.year,
        position: pos,
        heightScore,
        maxScore,
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
        race_poles: s.race_poles,
        sprint_poles: s.sprint_poles,
        total_one_two: s.total_one_two,
        total_double_podium: s.total_double_podium,
        total_double_points: s.total_double_points,
        total_front_row: s.total_front_row,
        q3_appearences: s.q3_appearences,
        total_gps: s.total_gps,
        total_dnfs: s.total_dnfs,
        fastest_laps: s.fastest_laps,
        pole_to_win_rate: s.pole_to_win_rate,
        drivers_lineup: s.drivers_lineup,
        ptsPerGp,
        winRate,
        podiumRate
      };
    });
  }, [seasons]);

  const currentSeason = useMemo(() => {
    return (
      seasonPositionData.find((s) => s.yearNum === selectedSeasonYear) ||
      seasonPositionData[seasonPositionData.length - 1] ||
      null
    );
  }, [seasonPositionData, selectedSeasonYear]);

  // Label no topo das colunas do gráfico
  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, index } = props;
    const item = seasonPositionData[index];
    if (!item) return <g />;
    if (!item.position) return <g />;

    const isP1 = item.position === 1;
    const isP2 = item.position === 2;
    const isP3 = item.position === 3;
    const textColor = isP1
      ? "#FACC15"
      : isP2
        ? "#E2E8F0"
        : isP3
          ? "#F59E0B"
          : item.position <= 5
            ? "#60A5FA"
            : "#94A3B8";

    const isMany = seasonPositionData.length > 12;
    const labelText = isP1 ? (isMany ? "👑" : "👑 #1") : `#${item.position}`;

    return (
      <text
        x={x + width / 2}
        y={y - 6}
        fill={textColor}
        textAnchor="middle"
        fontSize={isMany ? 9 : 11}
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
        <div className="rounded-xl border border-white/10 bg-[#0B0B10]/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-black text-sm text-white">{d.year}</span>
            {!d.is_season_completed ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                EM ANDAMENTO
              </span>
            ) : (
              <span className="text-[10px] text-f1-subtle font-medium">Temporada Finalizada</span>
            )}
          </div>

          <div className="pt-1 flex items-baseline justify-between">
            <span className="text-f1-subtle">Classificação Final:</span>
            <span
              className={`font-black text-sm ${d.position === 1
                  ? "text-amber-400 font-extrabold"
                  : d.position <= 3
                    ? "text-white"
                    : "text-white/90"
                }`}
            >
              {d.position === 1 ? "👑 Campeã de Construtores (#1)" : `#${d.position} no Campeonato`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-white/5 text-center text-[10px]">
            <div className="bg-white/5 p-1.5 rounded">
              <div className="text-f1-subtle">GPs</div>
              <div className="font-bold text-white">{d.total_gps}</div>
            </div>
            <div className="bg-white/5 p-1.5 rounded">
              <div className="text-f1-subtle">Vitórias</div>
              <div className="font-bold text-amber-400">{d.total_wins}</div>
              <div className="text-[9px] text-f1-subtle font-mono">{d.race_wins} GP · {d.sprint_wins} Sprint</div>
            </div>
            <div className="bg-white/5 p-1.5 rounded">
              <div className="text-f1-subtle">Pódios</div>
              <div className="font-bold text-emerald-400">{d.total_podiums}</div>
              <div className="text-[9px] text-f1-subtle font-mono">{d.race_podiums} GP · {d.sprint_podiums} Sprint</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
            <div className="bg-white/5 p-1.5 rounded flex justify-between">
              <span className="text-f1-subtle">1-2 Dobradinhas:</span>
              <strong className="text-amber-400 font-bold">{d.total_one_two}</strong>
            </div>
            <div className="bg-white/5 p-1.5 rounded flex justify-between">
              <span className="text-f1-subtle">Poles:</span>
              <strong className="text-purple-300 font-bold">{d.race_poles}</strong>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1 text-f1-subtle border-t border-white/5">
            <span>Pontos Totais: <strong className="text-white font-bold">{d.total_points}</strong></span>
            <span>Média: <strong className="text-white/80 font-bold">{d.ptsPerGp} pts/GP</strong></span>
          </div>

          <div className="text-[10px] text-center pt-1 text-f1-subtle/70 italic">
            Clique para carregar o Raio-X detalhado da temporada
          </div>
        </div>
      );
    }
    return null;
  };

  // Ordenação da tabela de temporadas
  const sortedSeasons = useMemo(() => {
    let list = [...seasons];
    if (seasonSortKey) {
      list.sort((a, b) => {
        let valA: any = (a as any)[seasonSortKey];
        let valB: any = (b as any)[seasonSortKey];
        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;
        return seasonSortDir === "asc" ? valA - valB : valB - valA;
      });
    }
    return list;
  }, [seasons, seasonSortKey, seasonSortDir]);

  const totalSeasonPages = Math.ceil(sortedSeasons.length / SEASONS_PER_PAGE);
  const paginatedSeasons = useMemo(() => {
    const start = (seasonsPage - 1) * SEASONS_PER_PAGE;
    return sortedSeasons.slice(start, start + SEASONS_PER_PAGE);
  }, [sortedSeasons, seasonsPage]);

  // ---------------------------------------------------------------------------
  // 2. PILOTOS DA HISTÓRIA
  // ---------------------------------------------------------------------------
  const [driverSearch, setDriverSearch] = useState("");
  const [driverSortKey, setDriverSortKey] = useState<string | null>("total_points");
  const [driverSortDir, setDriverSortDir] = useState<"asc" | "desc">("desc");

  const handleDriverSort = (key: string) => {
    setDriversPage(1);
    if (driverSortKey !== key) {
      setDriverSortKey(key);
      setDriverSortDir("desc");
    } else {
      setDriverSortDir(driverSortDir === "desc" ? "asc" : "desc");
    }
  };

  const filteredDrivers = useMemo(() => {
    let list = [...drivers];

    if (driverSearch.trim() !== "") {
      const q = driverSearch.toLowerCase();
      list = list.filter(
        (d) =>
          d.driver_full_name.toLowerCase().includes(q) ||
          d.driver_nationality?.toLowerCase().includes(q) ||
          d.seasons_list.includes(q)
      );
    }

    if (driverSortKey) {
      list.sort((a, b) => {
        let valA: any = (a as any)[driverSortKey];
        let valB: any = (b as any)[driverSortKey];
        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;

        if (typeof valA === "string") {
          return driverSortDir === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return driverSortDir === "asc" ? valA - valB : valB - valA;
      });
    }

    return list;
  }, [drivers, driverSearch, driverSortKey, driverSortDir]);

  const totalDriverPages = Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE);
  const paginatedDrivers = useMemo(() => {
    const start = (driversPage - 1) * DRIVERS_PER_PAGE;
    return filteredDrivers.slice(start, start + DRIVERS_PER_PAGE);
  }, [filteredDrivers, driversPage]);

  // ---------------------------------------------------------------------------
  // 3. REGISTRO CORRIDA A CORRIDA
  // ---------------------------------------------------------------------------
  const [selectedSeasonForRaces, setSelectedSeasonForRaces] = useState<string>("all");

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(raceLog.map((r) => r.year))).sort((a, b) => b - a);
    return years;
  }, [raceLog]);

  const filteredRaces = useMemo(() => {
    if (selectedSeasonForRaces === "all") return raceLog;
    const y = Number(selectedSeasonForRaces);
    return raceLog.filter((r) => r.year === y);
  }, [raceLog, selectedSeasonForRaces]);

  const totalRacePages = Math.ceil(filteredRaces.length / RACES_PER_PAGE);
  const paginatedRaces = useMemo(() => {
    const start = (racesPage - 1) * RACES_PER_PAGE;
    return filteredRaces.slice(start, start + RACES_PER_PAGE);
  }, [filteredRaces, racesPage]);

  // Estatísticas do Raio-X Histórico de Eficiência (Pilar 2)
  const winRate = profile.total_gps > 0 ? ((profile.total_wins / profile.total_gps) * 100).toFixed(1) : "0";
  const poleToWinRate = profile.race_poles > 0
    ? ((profile.total_poles_to_win / profile.race_poles) * 100).toFixed(1)
    : profile.pole_to_win_rate
      ? Number(profile.pole_to_win_rate).toFixed(1)
      : "—";
  const finishRate = profile.total_gps > 0
    ? Math.max(0, 100 - ((profile.total_dnfs / (profile.total_gps * 2)) * 100)).toFixed(1)
    : "—";
  const ptsPerGp = profile.total_gps > 0 ? (profile.total_points / profile.total_gps).toFixed(1) : "0";

  const legendaryDrivers = useMemo(() => {
    return [...drivers]
      .sort((a, b) => {
        if (b.driver_titles_with_team !== a.driver_titles_with_team) {
          return b.driver_titles_with_team - a.driver_titles_with_team;
        }
        if (b.total_wins !== a.total_wins) {
          return b.total_wins - a.total_wins;
        }
        return b.total_points - a.total_points;
      })
      .slice(0, 3);
  }, [drivers]);

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* PILAR 1: PAINEL EXECUTIVO HORIZONTAL (FULL-WIDTH 4 CARDS)                 */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* CARD 1: ESTATUTO HISTÓRICO ALL-TIME DA ESCUDERIA */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Estatuto Histórico
                </h3>
              </div>
              <span className="text-[10px] font-mono tabular-nums font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                All-Time F1
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Títulos Mundiais */}
              {profile.total_world_championships > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-f1-subtle text-[11px] flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    Títulos de Construtores:
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
                  Vitórias Totais:
                </span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-black text-white text-xs">
                    {profile.total_wins}
                  </span>
                  {(profile.rank_total_wins || profile.rank_race_wins) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                      #{profile.rank_total_wins || profile.rank_race_wins}
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
                  {profile.rank_total_podiums && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                      #{profile.rank_total_podiums}
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

              {/* Pontos Históricos */}
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

              {/* GPs Disputados */}
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
        </div>

        {/* CARD 2: RAIO-X DE EFICIÊNCIA EM PISTA */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-f1-red" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Eficiência em Pista
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-f1-subtle bg-white/5 px-2 py-0.5 rounded">
                Conversão
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Taxa de Vitórias */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-f1-subtle text-[11px]">Taxa de Vitórias (Win Rate)</span>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="font-black text-amber-400 text-sm">{winRate}%</span>
                    <span className="text-[10px] text-f1-subtle">
                      ({profile.total_wins}/{profile.total_gps})
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Number(winRate))}%` }}
                  />
                </div>
              </div>

              {/* Conversão Pole -> Vitória */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-f1-subtle text-[11px]">Conversão Pole ➔ Vitória</span>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="font-black text-purple-300 text-sm">{poleToWinRate}%</span>
                    <span className="text-[10px] text-f1-subtle">
                      ({profile.total_poles_to_win}/{profile.race_poles})
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Number(poleToWinRate) || 0)}%` }}
                  />
                </div>
              </div>

              {/* Média Pontos/GP */}
              <div className="flex items-center justify-between py-1 border-t border-white/5 pt-2">
                <span className="text-f1-subtle text-[11px]">Média Histórica:</span>
                <span className="font-mono font-black text-white text-xs">
                  {ptsPerGp} pts / GP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: DOMÍNIO & CONFIABILIDADE */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Domínio & Confiabilidade
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Dupla
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Dobradinhas 1-2 */}
              <div className="flex items-center justify-between py-1">
                <span className="text-f1-subtle text-[11px]">Dobradinhas 1-2:</span>
                <div className="text-right font-mono">
                  <span className="font-bold text-amber-300 text-xs">{profile.total_one_two} vezes</span>
                  <span className="text-[10px] text-zinc-400 block -mt-0.5">
                    {profile.total_gps > 0 ? ((profile.total_one_two / profile.total_gps) * 100).toFixed(1) : 0}% dos GPs
                  </span>
                </div>
              </div>

              {/* Pódios Duplos */}
              <div className="flex items-center justify-between py-1 border-t border-white/5 pt-1.5">
                <span className="text-f1-subtle text-[11px]">Pódios Duplos:</span>
                <span className="font-mono font-bold text-emerald-300 text-xs">
                  {profile.total_double_podium} GPs
                </span>
              </div>

              {/* Pontos Duplos */}
              <div className="flex items-center justify-between py-1 border-t border-white/5 pt-1.5">
                <span className="text-f1-subtle text-[11px]">Pontos Duplos:</span>
                <div className="text-right font-mono">
                  <span className="font-bold text-sky-300 text-xs">{profile.total_double_points} GPs</span>
                  <span className="text-[10px] text-zinc-400 block -mt-0.5">
                    {profile.total_gps > 0 ? ((profile.total_double_points / profile.total_gps) * 100).toFixed(1) : 0}% dos GPs
                  </span>
                </div>
              </div>

              {/* Confiabilidade */}
              <div className="border-t border-white/5 pt-2">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-f1-subtle text-[11px]">Confiabilidade (~Término)</span>
                  <span className="font-mono font-black text-emerald-400 text-xs">
                    {finishRate}% ({profile.total_dnfs} DNFs)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Number(finishRate) || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: HALL DA FAMA (PILOTOS NOTÁVEIS) */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Pilotos Notáveis
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-f1-subtle bg-white/5 px-2 py-0.5 rounded">
                Hall of Fame
              </span>
            </div>

            <div className="space-y-2">
              {legendaryDrivers.map((driver) => {
                const profileUrl = getDriverProfileUrl(driver.driver_id, driver.driver_full_name);
                const isChamp = driver.driver_titles_with_team > 0;

                return (
                  <Link
                    key={driver.driver_id}
                    href={profileUrl}
                    className="flex items-center justify-between p-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all group"
                    title={`Ver perfil de ${driver.driver_full_name}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-mono font-black text-[11px] text-white">
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
                      <div className="min-w-0">
                        <span className="font-bold text-white group-hover:text-white group-hover:underline decoration-white/30 transition-colors block text-xs truncate">
                          {driver.driver_full_name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] text-f1-subtle font-mono">
                          {isChamp && (
                            <span className="text-amber-400 font-bold">
                              👑 {driver.driver_titles_with_team}x
                            </span>
                          )}
                          <span>{driver.seasons_count} {driver.seasons_count === 1 ? "temp" : "temps"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span className="font-bold text-amber-400 text-xs block">
                        {driver.total_wins}V
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {drivers.length > 3 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("drivers");
                setDriverSearch("");
                setDriversPage(1);
              }}
              className="w-full mt-2 pt-2 border-t border-white/5 text-[11px] font-bold text-f1-subtle hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <span>Ver todos os {drivers.length} pilotos</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ABAS EM LARGURA TOTAL (FULL-WIDTH ARCHITECTURE)                           */}
      {/* ========================================================================= */}
      <section className="space-y-4">
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
              onClick={() => setActiveTab("drivers")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "drivers"
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                  : "text-f1-subtle hover:text-white hover:bg-white/5"
                }`}
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>Pilotos da História</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === "drivers" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                  }`}
              >
                {drivers.length}
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

        {/* ========================================================================= */}
        {/* ABA 1: TEMPORADA A TEMPORADA                                              */}
        {/* ========================================================================= */}
        {activeTab === "seasons" && (
          <div className="space-y-4">
            {/* Bloco Unificado: Gráfico de Posições + Mini Raio-X da Temporada Selecionada */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    Trajetória no Campeonato Mundial de Construtores
                  </h3>
                  <p className="text-[11px] text-f1-subtle mt-0.5">
                    Classificação final ano a ano. Clique em uma barra para detalhes da temporada.
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
                          {s.year} {s.position === 1 && s.is_season_completed ? "👑 Campeã" : !s.is_season_completed ? `(P${s.position} Atual)` : `(P${s.position})`}
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
                    const isInProgress = !s.is_season_completed;
                    return (
                      <button
                        key={s.yearNum}
                        type="button"
                        onClick={() => setSelectedSeasonYear(s.yearNum)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all shrink-0 ${isSelected
                            ? "bg-f1-red text-white shadow-sm shadow-f1-red/30 scale-105"
                            : isInProgress
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-white/5 text-f1-subtle hover:bg-white/10 hover:text-white"
                          }`}
                      >
                        {isChamp && <span>👑</span>}
                        {isInProgress && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        <span>{s.year}</span>
                      </button>
                    );
                  })}
              </div>

              {/* Gráfico de Colunas de Trajetória (Altura compacta h-48 igual a Pilotos) */}
              <div className="h-44 sm:h-48 w-full pt-1">
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
                      axisLine={{ stroke: '#ffffff15' }}
                      interval={0}
                      tickFormatter={(yearStr) => seasonPositionData.length > 12 ? `'${yearStr.slice(-2)}` : yearStr}
                    />
                    <YAxis hide={true} />
                    <Tooltip
                      content={<CustomSeasonTooltip />}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
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
                        } else if (entry.position <= 5) {
                          barFill = "#2563EB";
                          barStroke = isSelected ? "#FFFFFF" : "#60A5FA";
                        }

                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={barFill}
                            stroke={barStroke}
                            strokeWidth={isSelected ? 2.5 : 1}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda de Posições (Compacta em linha única) */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> 👑 Campeã
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-slate-300" /> #2 Vice
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-600" /> #3 Bronze
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> Top 5
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-600" /> P6+
                </span>
              </div>

              {/* Mini Raio-X da Temporada Selecionada (Integrado no mesmo card!) */}
              {currentSeason && (
                <div className="rounded-xl border border-white/5 bg-[#12121A] p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-6 rounded-full shrink-0"
                        style={{ backgroundColor: teamColor }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">
                            Temporada {currentSeason.year}
                          </h4>
                          <span className="text-xs font-bold text-white/80">
                            • {profile.team_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {currentSeason.position === 1 && currentSeason.is_season_completed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[11px] font-black">
                          👑 Campeã de Construtores
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

                  {/* 5 KPIs Compactos em Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    {/* Vitórias */}
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-f1-subtle font-bold uppercase block">
                        Vitórias Totais
                      </span>
                      <span className="font-mono text-sm font-black text-amber-400 block mt-0.5">
                        {currentSeason.total_wins}
                      </span>
                      <span className="text-[10px] text-f1-subtle font-mono block">
                        {currentSeason.race_wins} GP · {currentSeason.sprint_wins} Sp
                      </span>
                    </div>

                    {/* Dobradinhas 1-2 */}
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-amber-300 font-bold uppercase block">
                        Dobradinhas 1-2
                      </span>
                      <span className="font-mono text-sm font-black text-amber-300 block mt-0.5">
                        {currentSeason.total_one_two}
                      </span>
                      <span className="text-[10px] text-f1-subtle font-mono block">
                        {currentSeason.total_gps > 0 ? ((currentSeason.total_one_two / currentSeason.total_gps) * 100).toFixed(0) : 0}% dos GPs
                      </span>
                    </div>

                    {/* Pódios */}
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-blue-400 font-bold uppercase block">
                        Pódios Totais
                      </span>
                      <span className="font-mono text-sm font-black text-blue-300 block mt-0.5">
                        {currentSeason.total_podiums}
                      </span>
                      <span className="text-[10px] text-f1-subtle font-mono block">
                        {currentSeason.total_double_podium}x duplos
                      </span>
                    </div>

                    {/* Poles */}
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-purple-400 font-bold uppercase block">
                        Pole Positions
                      </span>
                      <span className="font-mono text-sm font-black text-purple-300 block mt-0.5">
                        {currentSeason.race_poles}
                      </span>
                      <span className="text-[10px] text-f1-subtle font-mono block">
                        {currentSeason.total_front_row}x 1ª fila
                      </span>
                    </div>

                    {/* Pontuação */}
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-white font-bold uppercase block">
                        Pontos Totais
                      </span>
                      <span className="font-mono text-sm font-black text-white block mt-0.5">
                        {Math.round(currentSeason.total_points).toLocaleString("pt-BR")}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono block">
                        {currentSeason.ptsPerGp} pts/GP
                      </span>
                    </div>
                  </div>

                  {/* Dupla de Pilotos da Temporada */}
                  {currentSeason.drivers_lineup && currentSeason.drivers_lineup.length > 0 && (
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5 text-xs">
                      <span className="text-[10px] font-mono font-bold uppercase text-f1-subtle tracking-wider">
                        Dupla de Pilotos {currentSeason.year}:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {currentSeason.drivers_lineup.map((d) => (
                          <Link
                            key={d.driver_id}
                            href={getDriverProfileUrl(d.driver_id, d.driver_full_name)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs group"
                            title={`Ver perfil de ${d.driver_full_name}`}
                          >
                            <span className="font-mono font-black text-[10px] text-f1-subtle group-hover:text-white">
                              {d.driver_abbreviation || d.driver_full_name.slice(0, 3).toUpperCase()}
                            </span>
                            <span className="font-bold text-white group-hover:text-white/90">
                              {d.driver_full_name}
                            </span>
                            <span className="font-mono tabular-nums font-bold text-amber-400 text-[11px] ml-0.5">
                              {d.points} pts
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* TABELA DETALHADA DE TEMPORADAS (ALTA DENSIDADE COM PAGINAÇÃO - IDÊNTICA AO DE PILOTOS) */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-lg">
              <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-f1-subtle" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Tabela Detalhada de Temporadas ({seasons.length} anos)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {seasonSortKey && (
                    <button
                      type="button"
                      onClick={() => setSeasonSortKey(null)}
                      className="inline-flex items-center gap-1 text-[11px] text-f1-red hover:underline font-bold"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Restaurar Ordem</span>
                    </button>
                  )}
                  <span className="text-[11px] text-f1-subtle font-mono hidden sm:inline">
                    Página {seasonsPage} de {totalSeasonPages}
                  </span>
                </div>
              </div>

              {/* Tabela de Temporadas */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#12121A] text-f1-subtle uppercase text-[11px]">
                      <th
                        onClick={() => handleSeasonSort("year")}
                        className="py-3 px-3 cursor-pointer hover:text-white select-none"
                      >
                        Temporada
                      </th>
                      <th className="py-3 px-3">Dupla Principal</th>
                      <th
                        onClick={() => handleSeasonSort("championship_position")}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white select-none"
                      >
                        Posição
                      </th>
                      <th
                        onClick={() => handleSeasonSort("total_gps")}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white select-none"
                      >
                        GPs
                      </th>
                      <th
                        onClick={() => handleSeasonSort("total_wins")}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white select-none"
                      >
                        Vitórias
                      </th>
                      <th
                        onClick={() => handleSeasonSort("total_one_two")}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white select-none"
                      >
                        1-2
                      </th>
                      <th
                        onClick={() => handleSeasonSort("total_podiums")}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white select-none"
                      >
                        Pódios
                      </th>
                      <th
                        onClick={() => handleSeasonSort("race_poles")}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white select-none"
                      >
                        Poles
                      </th>
                      <th
                        onClick={() => handleSeasonSort("total_points")}
                        className="py-3 px-3 text-right cursor-pointer hover:text-white select-none"
                      >
                        Pontos
                      </th>
                      <th
                        onClick={() => handleSeasonSort("total_dnfs")}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white select-none"
                      >
                        DNFs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedSeasons.map((s) => {
                      const isInProgress = !s.is_season_completed;
                      const isChampion = s.championship_position === 1 && s.is_season_completed;
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
                          {/* Temporada */}
                          <td className="py-2.5 px-3 font-black text-white font-mono text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold">{s.year}</span>
                              {isChampion && <span title="Campeã Mundial">👑</span>}
                              {isInProgress && (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" title="Em andamento" />
                              )}
                            </div>
                          </td>

                          {/* Dupla Principal */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              {s.drivers_lineup?.slice(0, 3).map((d) => (
                                <span
                                  key={d.driver_id}
                                  className="px-1.5 py-0.2 rounded bg-white/5 text-[10px] font-mono text-zinc-300 font-bold"
                                  title={`${d.driver_full_name} (${d.points} pts)`}
                                >
                                  {d.driver_abbreviation || d.driver_full_name.slice(0, 3).toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Posição */}
                          <td className="py-2.5 px-3 text-center">
                            {isChampion ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 font-black text-[10px]">
                                #1 Campeã
                              </span>
                            ) : isInProgress ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                                P{s.championship_position} Atual
                              </span>
                            ) : (
                              <span className="font-bold text-white text-xs">
                                P{s.championship_position}
                              </span>
                            )}
                          </td>

                          {/* GPs */}
                          <td className="py-2.5 px-3 text-center text-zinc-300 font-mono text-xs">
                            {s.total_gps}
                          </td>

                          {/* Vitórias */}
                          <td className="py-2.5 px-3 text-center font-mono text-xs">
                            <span className={s.total_wins > 0 ? "font-bold text-amber-400" : "text-white/20"}>
                              {s.total_wins}
                            </span>
                          </td>

                          {/* Dobradinhas 1-2 */}
                          <td className="py-2.5 px-3 text-center font-mono text-xs">
                            <span className={(s.total_one_two || 0) > 0 ? "font-bold text-amber-300" : "text-white/20"}>
                              {s.total_one_two || 0}
                            </span>
                          </td>

                          {/* Pódios */}
                          <td className="py-2.5 px-3 text-center font-mono text-xs">
                            <span className={s.total_podiums > 0 ? "font-bold text-blue-300" : "text-white/20"}>
                              {s.total_podiums}
                            </span>
                          </td>

                          {/* Poles */}
                          <td className="py-2.5 px-3 text-center font-mono text-xs">
                            <span className={s.race_poles > 0 ? "font-bold text-purple-300" : "text-white/20"}>
                              {s.race_poles}
                            </span>
                          </td>

                          {/* Pontos Totais */}
                          <td className="py-2.5 px-3 text-right font-black text-white font-mono text-xs">
                            {Math.round(s.total_points).toLocaleString("pt-BR")}
                          </td>

                          {/* DNFs */}
                          <td className="py-2.5 px-3 text-center font-mono text-xs">
                            <span className={s.total_dnfs > 3 ? "text-rose-400 font-bold" : "text-zinc-400"}>
                              {s.total_dnfs}
                            </span>
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
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: PILOTOS DA HISTÓRIA DA EQUIPE                                      */}
        {/* ========================================================================= */}
        {activeTab === "drivers" && (
          <div className="space-y-4">
            {/* Barra de Filtros e Busca de Pilotos */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-[#12121A]">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-f1-subtle" />
                <input
                  type="text"
                  value={driverSearch}
                  onChange={(e) => {
                    setDriverSearch(e.target.value);
                    setDriversPage(1);
                  }}
                  placeholder="Buscar piloto por nome, país, anos..."
                  className="w-full bg-[#0A0A10] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-f1-subtle focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-f1-subtle">
                <span>{filteredDrivers.length} de {drivers.length} pilotos</span>
              </div>
            </div>

            {/* Tabela de Pilotos da História */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#12121A] text-f1-subtle uppercase text-[11px]">
                      <TableSortHeader
                        label="Piloto"
                        columnKey="driver_full_name"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                      />
                      <th className="py-3 px-3">Anos na Equipe</th>
                      <TableSortHeader
                        label="GPs"
                        columnKey="gps_raced"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="center"
                      />
                      <TableSortHeader
                        label="Vitórias"
                        columnKey="total_wins"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="center"
                      />
                      <TableSortHeader
                        label="Pódios"
                        columnKey="total_podiums"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="center"
                      />
                      <TableSortHeader
                        label="Poles"
                        columnKey="race_poles"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="center"
                      />
                      <TableSortHeader
                        label="Títulos c/ Equipe"
                        columnKey="driver_titles_with_team"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="center"
                      />
                      <TableSortHeader
                        label="Pontos p/ Equipe"
                        columnKey="total_points"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="right"
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedDrivers.map((driver) => {
                      const profileUrl = getDriverProfileUrl(driver.driver_id, driver.driver_full_name);
                      const isChampionWithTeam = driver.driver_titles_with_team > 0;

                      return (
                        <tr
                          key={driver.driver_id}
                          className="hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="py-3 px-3">
                            <Link
                              href={profileUrl}
                              className="flex items-center gap-2.5 group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-mono font-black text-xs text-white">
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
                                <span className="font-bold text-white group-hover:text-white group-hover:underline decoration-white/30 transition-colors block">
                                  {driver.driver_full_name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-f1-subtle">
                                  {driver.driver_abbreviation && (
                                    <span className="font-mono bg-white/5 px-1 rounded">
                                      {driver.driver_abbreviation}
                                    </span>
                                  )}
                                  <span>{driver.driver_nationality}</span>
                                </div>
                              </div>
                            </Link>
                          </td>

                          <td className="py-3 px-3 text-f1-subtle max-w-[200px] truncate" title={driver.seasons_list}>
                            <span className="font-semibold text-white/80">{driver.seasons_list}</span>
                            <span className="block text-[10px] text-white/40">
                              {driver.seasons_count} {driver.seasons_count === 1 ? "temporada" : "temporadas"}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-white">
                            {driver.gps_raced}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={driver.total_wins > 0 ? "text-amber-400 font-bold" : "text-white/40"}>
                              {driver.total_wins}
                            </span>
                            {driver.total_wins > 0 && (
                              <span className="block text-[9px] text-white/40">
                                {driver.race_wins} GP · {driver.sprint_wins} Sp
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={driver.total_podiums > 0 ? "text-emerald-400 font-bold" : "text-white/40"}>
                              {driver.total_podiums}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={driver.race_poles > 0 ? "text-purple-300 font-bold" : "text-white/40"}>
                              {driver.race_poles}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {isChampionWithTeam ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-xs">
                                👑 {driver.driver_titles_with_team}x
                              </span>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right font-black text-white">
                            {driver.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <TablePagination
                  currentPage={driversPage}
                  totalPages={totalDriverPages}
                  totalItems={filteredDrivers.length}
                  pageSize={DRIVERS_PER_PAGE}
                  onPageChange={setDriversPage}
                  itemName="pilotos"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: REGISTRO CORRIDA A CORRIDA                                         */}
        {/* ========================================================================= */}
        {activeTab === "races" && (
          <div className="space-y-4">
            {/* Seletor de Ano */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-[#12121A]">
              <div className="flex items-center gap-3">
                <Flag className="h-4 w-4 text-f1-subtle" />
                <span className="text-xs font-bold uppercase text-white font-mono">
                  Filtrar por Temporada:
                </span>
                <select
                  value={selectedSeasonForRaces}
                  onChange={(e) => {
                    setSelectedSeasonForRaces(e.target.value);
                    setRacesPage(1);
                  }}
                  className="bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer font-mono"
                >
                  <option value="all">Todas as Temporadas ({raceLog.length} corridas)</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      Temporada {y}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs font-mono text-f1-subtle">
                {filteredRaces.length} corridas listadas
              </span>
            </div>

            {/* Tabela de Corridas */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#12121A] text-f1-subtle uppercase text-[11px]">
                      <th className="py-3 px-3">Temporada / Etapa</th>
                      <th className="py-3 px-3">Grande Prêmio</th>
                      <th className="py-3 px-3">Sessão</th>
                      <th className="py-3 px-3">Carro #1 (Grid ➔ Final)</th>
                      <th className="py-3 px-3">Carro #2 (Grid ➔ Final)</th>
                      <th className="py-3 px-3 text-center">Destaque</th>
                      <th className="py-3 px-3 text-right">Pontos Equipe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedRaces.map((race, idx) => {
                      const car1 = race.drivers_results && race.drivers_results[0];
                      const car2 = race.drivers_results && race.drivers_results[1];

                      return (
                        <tr key={`${race.year}-${race.round_number}-${race.session_name}-${idx}`} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-3 font-bold text-white">
                            {race.year} · R{race.round_number}
                          </td>
                          <td className="py-3 px-3">
                            <Link
                              href={`/season/round/${race.round_number}?year=${race.year}`}
                              className="text-white font-semibold hover:text-white hover:underline decoration-white/30 transition-colors inline-block"
                              title={`Ver análise da etapa ${race.round_number} (${race.year})`}
                            >
                              {race.official_event_name}
                            </Link>
                          </td>
                          <td className="py-3 px-3 text-f1-subtle">
                            {race.session_name}
                          </td>
                          <td className="py-3 px-3">
                            {car1 ? (
                              <div className="flex items-center gap-2">
                                <DriverLink
                                  driverName={car1.driver_full_name}
                                  className="text-white font-bold hover:text-white hover:underline decoration-white/30 transition-colors"
                                  title={`Ver perfil de ${car1.driver_full_name}`}
                                >
                                  {car1.driver_full_name}
                                </DriverLink>
                                <span className="text-f1-subtle text-[11px]">
                                  P{car1.grid_position || "—"} ➔ <strong className="text-white">P{car1.finishing_position || car1.status || "DNF"}</strong>
                                </span>
                              </div>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {car2 ? (
                              <div className="flex items-center gap-2">
                                <DriverLink
                                  driverName={car2.driver_full_name}
                                  className="text-white font-bold hover:text-white hover:underline decoration-white/30 transition-colors"
                                  title={`Ver perfil de ${car2.driver_full_name}`}
                                >
                                  {car2.driver_full_name}
                                </DriverLink>
                                <span className="text-f1-subtle text-[11px]">
                                  P{car2.grid_position || "—"} ➔ <strong className="text-white">P{car2.finishing_position || car2.status || "DNF"}</strong>
                                </span>
                              </div>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {race.is_one_two ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[10px]">
                                🏆 1-2 DOBRADINHA
                              </span>
                            ) : race.wins_count > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 text-[10px]">
                                🥇 VITÓRIA
                              </span>
                            ) : race.podiums_count > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px]">
                                PÓDIO
                              </span>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-white">
                            {race.team_points} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <TablePagination
                  currentPage={racesPage}
                  totalPages={totalRacePages}
                  totalItems={filteredRaces.length}
                  pageSize={RACES_PER_PAGE}
                  onPageChange={setRacesPage}
                  itemName="corridas"
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
