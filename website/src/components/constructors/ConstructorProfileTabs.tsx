"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ConstructorCatalogItem,
  ConstructorSeasonSummaryItem,
  ConstructorDriverSummaryItem,
  ConstructorRaceLogItem,
  ConstructorSeasonDriverLineup
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
  ChevronLeft,
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
  subKeys = [],
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
  subKeys?: string[];
  currentSortKey: string | null;
  currentSortDir: "asc" | "desc";
  onSort: (key: string) => void;
  align?: "left" | "center" | "right";
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  const isExactActive = currentSortKey === columnKey;
  const isChildActive = Boolean(currentSortKey && subKeys.includes(currentSortKey));
  const isActive = isExactActive || isChildActive;
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
        {isExactActive ? (
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

function TableSubSortHeader({
  label,
  title,
  columnKey,
  currentSortKey,
  currentSortDir,
  onSort,
  isSprint = false,
  className = ""
}: {
  label: string;
  title: string;
  columnKey: string;
  currentSortKey: string | null;
  currentSortDir: "asc" | "desc";
  onSort: (key: string) => void;
  isSprint?: boolean;
  className?: string;
}) {
  const isActive = currentSortKey === columnKey;
  const baseColor = isSprint
    ? isActive
      ? "text-purple-200 bg-purple-500/15"
      : "text-purple-400 hover:text-purple-200"
    : isActive
      ? "text-white bg-white/10"
      : "text-white/70 hover:text-white";

  return (
    <th
      onClick={() => onSort(columnKey)}
      className={`pt-1 pb-1.5 px-1 text-center w-11 min-w-[40px] cursor-pointer select-none transition-colors group ${baseColor} ${className}`}
      title={`Clique para ordenar por ${title}`}
    >
      <div className="inline-flex items-center justify-center gap-0.5 w-full">
        <span>{label}</span>
        {isActive ? (
          currentSortDir === "asc" ? (
            <ArrowUp className="h-2.5 w-2.5 text-f1-red shrink-0" />
          ) : (
            <ArrowDown className="h-2.5 w-2.5 text-f1-red shrink-0" />
          )
        ) : (
          <ArrowUpDown className="h-2.5 w-2.5 opacity-25 group-hover:opacity-80 transition-opacity shrink-0" />
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
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3.5 py-2.5 sm:py-1 min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold transition-all text-xs sm:text-[11px] active:scale-95"
        >
          Anterior
        </button>
        <span className="px-2 font-mono text-xs sm:text-[11px] font-bold text-white/80 shrink-0">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3.5 py-2.5 sm:py-1 min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold transition-all text-xs sm:text-[11px] active:scale-95"
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
  // Aba padrão inicial nativa para todas as telas: "seasons"
  const [activeTab, setActiveTab] = useState<"seasons" | "drivers" | "races" | "overview">("seasons");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setActiveTab((prev) => (prev === "overview" ? "seasons" : prev));
      }
    };
    handleChange(mq);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);
  const [mobileSeasonSubView, setMobileSeasonSubView] = useState<"table" | "chart">("chart");
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
  const [expandedSeasonRowYear, setExpandedSeasonRowYear] = useState<number | null>(null);
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);
  const [expandedRaceKey, setExpandedRaceKey] = useState<string | null>(null);

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
        drivers_lineup: (Array.isArray(s.drivers_lineup)
          ? s.drivers_lineup
          : typeof s.drivers_lineup === "string"
            ? (() => {
              try {
                return JSON.parse(s.drivers_lineup);
              } catch {
                return [];
              }
            })()
            : []) as ConstructorSeasonDriverLineup[],
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

  // ---------------------------------------------------------------------------
  // NAVEGAÇÃO ENTRE PERÍODOS DE TEMPORADAS (Responsivo: 6 no mobile, 8 no tablet, 12 no desktop)
  // ---------------------------------------------------------------------------
  const [periodSize, setPeriodSize] = useState<number>(12);

  useEffect(() => {
    const updatePeriodSize = () => {
      if (window.innerWidth < 640) {
        setPeriodSize(6);
      } else if (window.innerWidth < 1024) {
        setPeriodSize(8);
      } else {
        setPeriodSize(12);
      }
    };
    updatePeriodSize();
    window.addEventListener("resize", updatePeriodSize);
    return () => window.removeEventListener("resize", updatePeriodSize);
  }, []);

  const PERIOD_SIZE = periodSize;
  const totalPeriods = Math.max(1, Math.ceil(seasonPositionData.length / PERIOD_SIZE));

  const getPeriodIndexForYear = (year: number, size = PERIOD_SIZE) => {
    const tot = Math.max(1, Math.ceil(seasonPositionData.length / size));
    const index = seasonPositionData.findIndex((s) => s.yearNum === year);
    if (index === -1) return tot - 1;
    if (index >= seasonPositionData.length - size) {
      return tot - 1;
    }
    return Math.floor(index / size);
  };

  const [chartPeriod, setChartPeriod] = useState<number>(() => {
    return getPeriodIndexForYear(selectedSeasonYear);
  });

  useEffect(() => {
    setChartPeriod(getPeriodIndexForYear(selectedSeasonYear, PERIOD_SIZE));
  }, [PERIOD_SIZE]);

  const visibleSeasonData = useMemo(() => {
    if (seasonPositionData.length <= PERIOD_SIZE) {
      return seasonPositionData;
    }
    const isLast = chartPeriod === totalPeriods - 1;
    const start = isLast
      ? Math.max(0, seasonPositionData.length - PERIOD_SIZE)
      : chartPeriod * PERIOD_SIZE;
    const end = isLast ? seasonPositionData.length : start + PERIOD_SIZE;
    return seasonPositionData.slice(start, end);
  }, [seasonPositionData, chartPeriod, totalPeriods, PERIOD_SIZE]);

  // Label no topo das colunas do gráfico
  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, index } = props;
    const item = visibleSeasonData[index];
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

    const labelText = isP1 ? "👑 #1" : `#${item.position}`;

    return (
      <text
        x={x + width / 2}
        y={y - 6}
        fill={textColor}
        textAnchor="middle"
        fontSize={10}
        fontWeight="800"
        fontFamily="monospace"
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
        let valA: any =
          seasonSortKey === "total_poles"
            ? (a.race_poles || 0) + (a.sprint_poles || 0)
            : (a as any)[seasonSortKey];
        let valB: any =
          seasonSortKey === "total_poles"
            ? (b.race_poles || 0) + (b.sprint_poles || 0)
            : (b as any)[seasonSortKey];
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

  // Handler unificado de seleção de temporada: sincroniza Gráfico, Mini Raio-X e Paginação da Tabela
  const handleSelectSeasonYear = (yearVal: number | string) => {
    const y = Number(yearVal);
    if (!y || isNaN(y)) return;

    setSelectedSeasonYear(y);
    setChartPeriod(getPeriodIndexForYear(y));

    // Navega automaticamente a tabela de temporadas para a página onde a temporada está
    const seasonIndex = sortedSeasons.findIndex((s) => Number(s.year) === y);
    if (seasonIndex !== -1) {
      const targetPage = Math.floor(seasonIndex / SEASONS_PER_PAGE) + 1;
      setSeasonsPage(targetPage);
    }
  };

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
        let valA: any =
          driverSortKey === "total_poles"
            ? (a.race_poles || 0) + (a.sprint_poles || 0)
            : (a as any)[driverSortKey];
        let valB: any =
          driverSortKey === "total_poles"
            ? (b.race_poles || 0) + (b.sprint_poles || 0)
            : (b as any)[driverSortKey];
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
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* ========================================================================= */}
      {/* COLUNA ESQUERDA (33% no Desktop xl+, Aba "Raio-X" Exclusiva em < xl)      */}
      {/* ========================================================================= */}
      <aside className={`order-2 xl:order-1 xl:col-span-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 min-w-0 ${activeTab === "overview" ? "grid" : "hidden xl:grid"}`}>
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

        {/* CARD 2: RAIO-X DE EFICIÊNCIA & DOMÍNIO */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-f1-red" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Raio-X de Eficiência
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-f1-subtle bg-white/5 px-2 py-0.5 rounded">
              Histórico
            </span>
          </div>

          <div className="space-y-3 text-xs">
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
                  style={{ width: `${Math.min(100, Math.max(0, Number(winRate)))}%` }}
                />
              </div>
            </div>

            {/* Confiabilidade */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-f1-subtle text-[11px]">Confiabilidade (~Término)</span>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="font-black text-emerald-400 text-sm">{finishRate}%</span>
                  <span className="text-[10px] text-f1-subtle">
                    ({profile.total_dnfs} DNFs)
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Number(finishRate) || 0))}%` }}
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
                  {poleToWinRate ? `${poleToWinRate}%` : "—"}
                </span>
                <span className="text-[10px] text-f1-subtle font-mono block">
                  {profile.total_poles_to_win} de {profile.race_poles} poles
                </span>
              </div>

              {/* Dobradinhas 1-2 */}
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                <span className="block text-[10px] text-f1-subtle uppercase font-bold tracking-wider">
                  Dobradinhas 1-2
                </span>
                <span className="font-mono text-sm font-black text-amber-300 block mt-0.5">
                  {profile.total_one_two} vezes
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  {profile.total_gps > 0 ? ((profile.total_one_two / profile.total_gps) * 100).toFixed(1) : 0}% dos GPs
                </span>
              </div>

              {/* Pódios Duplos */}
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                <span className="block text-[10px] text-f1-subtle uppercase font-bold tracking-wider">
                  Pódios Duplos
                </span>
                <span className="font-mono text-sm font-black text-emerald-300 block mt-0.5">
                  {profile.total_double_podium} GPs
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  {profile.total_gps > 0 ? ((profile.total_double_podium / profile.total_gps) * 100).toFixed(1) : 0}% dos GPs
                </span>
              </div>

              {/* Pontos Duplos */}
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                <span className="block text-[10px] text-f1-subtle uppercase font-bold tracking-wider">
                  Pontos Duplos
                </span>
                <span className="font-mono text-sm font-black text-sky-300 block mt-0.5">
                  {profile.total_double_points} GPs
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  {profile.total_gps > 0 ? ((profile.total_double_points / profile.total_gps) * 100).toFixed(1) : 0}% dos GPs
                </span>
              </div>
            </div>

            {/* Média Histórica */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-f1-subtle">
              <span className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-zinc-400" />
                Média Histórica:
              </span>
              <span className="font-mono font-bold text-white">
                {ptsPerGp} pts / GP
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: HALL DA FAMA (PILOTOS NOTÁVEIS) */}
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
      </aside>

      {/* ========================================================================= */}
      {/* COLUNA DIREITA (67% no Desktop xl+, Largura Total em < xl): PAINEL PRINCIPAL */}
      {/* ========================================================================= */}
      <main className="order-1 xl:order-2 xl:col-span-8 space-y-4 min-w-0">
        {/* SELETOR DE ABAS COMPACTO (Estilo Segmented Control Cockpit) */}
        <div className="flex items-center justify-between bg-[#0E0E14] border border-white/10 rounded-2xl p-1 sm:p-1.5 shadow-md overflow-x-auto no-scrollbar">
          <div className="grid grid-cols-4 sm:flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto">
            {/* 1ª Aba Mobile/Tablet (< xl): Raio-X & Recordes da Sidebar */}
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`xl:hidden inline-flex items-center justify-center gap-1 px-2.5 py-2 min-h-[44px] rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${activeTab === "overview"
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                  : "text-f1-subtle hover:text-white hover:bg-white/5"
                }`}
            >
              <span>Raio-X</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("seasons")}
              className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 min-h-[44px] rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${activeTab === "seasons"
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                  : "text-f1-subtle hover:text-white hover:bg-white/5"
                }`}
            >
              <Trophy className="h-3.5 w-3.5 shrink-0 hidden sm:inline" />
              <span>Temporadas</span>
              <span
                className={`hidden sm:inline text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === "seasons"
                    ? "bg-black/30 text-white"
                    : "bg-white/10 text-zinc-400"
                  }`}
              >
                {seasons.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("drivers")}
              className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 min-h-[44px] rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${activeTab === "drivers"
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                  : "text-f1-subtle hover:text-white hover:bg-white/5"
                }`}
            >
              <Users className="h-3.5 w-3.5 shrink-0 hidden sm:inline" />
              <span className="sm:hidden">Pilotos</span>
              <span className="hidden sm:inline">Pilotos da História</span>
              <span
                className={`hidden sm:inline text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === "drivers" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                  }`}
              >
                {drivers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("races")}
              className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 min-h-[44px] rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${activeTab === "races"
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                  : "text-f1-subtle hover:text-white hover:bg-white/5"
                }`}
            >
              <Timer className="h-3.5 w-3.5 shrink-0 hidden sm:inline" />
              <span className="sm:hidden">Corridas</span>
              <span className="hidden sm:inline">Corrida a Corrida</span>
              <span
                className={`hidden sm:inline text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === "races" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
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
            {/* Sub-seletor Mobile (< md): Alterna entre Gráfico/Raio-X do Ano (1ª aba) e Tabela sem empilhar */}
            <div className="grid grid-cols-2 md:hidden rounded-xl border border-white/10 bg-[#12121A] p-1 shadow-lg">
              <button
                type="button"
                onClick={() => setMobileSeasonSubView("chart")}
                className={`py-2 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${mobileSeasonSubView === "chart"
                    ? "bg-white/15 text-white shadow"
                    : "text-f1-subtle hover:text-white"
                  }`}
              >
                Gráfico & Raio-X ({selectedSeasonYear})
              </button>
              <button
                type="button"
                onClick={() => setMobileSeasonSubView("table")}
                className={`py-2 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${mobileSeasonSubView === "table"
                    ? "bg-white/15 text-white shadow"
                    : "text-f1-subtle hover:text-white"
                  }`}
              >
                Tabela ({seasons.length})
              </button>
            </div>

            {/* Bloco Unificado: Gráfico de Posições + Mini Raio-X da Temporada Selecionada */}
            <div className={`rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg space-y-4 ${mobileSeasonSubView === "chart" ? "block" : "hidden md:block"}`}>
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
                    onChange={(e) => {
                      handleSelectSeasonYear(e.target.value);
                    }}
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
                        onClick={() => {
                          handleSelectSeasonYear(s.yearNum);
                        }}
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

              {/* Barra de Navegação entre Períodos / Eras */}
              {totalPeriods > 1 && (
                <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono">
                  {/* Botão Período Anterior */}
                  <button
                    type="button"
                    onClick={() => {
                      const newPeriod = Math.max(0, chartPeriod - 1);
                      setChartPeriod(newPeriod);
                      const isLast = newPeriod === totalPeriods - 1;
                      const start = isLast
                        ? Math.max(0, seasonPositionData.length - PERIOD_SIZE)
                        : newPeriod * PERIOD_SIZE;
                      const end = isLast ? seasonPositionData.length : start + PERIOD_SIZE;
                      const slice = seasonPositionData.slice(start, end);
                      if (slice.length > 0) {
                        handleSelectSeasonYear(slice[slice.length - 1].yearNum);
                      }
                    }}
                    disabled={chartPeriod === 0}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${chartPeriod === 0
                        ? "opacity-30 cursor-not-allowed text-zinc-600"
                        : "text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 border border-white/5 hover:border-white/15"
                      }`}
                    title="Ver período anterior (temporadas mais antigas)"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

                  {/* Indicador do Período Atual */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-f1-subtle uppercase tracking-wider hidden md:inline">
                      Período:
                    </span>
                    <span className="text-xs font-bold text-white bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md shadow-sm">
                      {visibleSeasonData[0]?.year} — {visibleSeasonData[visibleSeasonData.length - 1]?.year}
                    </span>
                    <span className="text-[10px] text-f1-subtle font-mono">
                      ({chartPeriod + 1} de {totalPeriods})
                    </span>
                  </div>

                  {/* Botão Próximo Período */}
                  <button
                    type="button"
                    onClick={() => {
                      const newPeriod = Math.min(totalPeriods - 1, chartPeriod + 1);
                      setChartPeriod(newPeriod);
                      const isLast = newPeriod === totalPeriods - 1;
                      const start = isLast
                        ? Math.max(0, seasonPositionData.length - PERIOD_SIZE)
                        : newPeriod * PERIOD_SIZE;
                      const end = isLast ? seasonPositionData.length : start + PERIOD_SIZE;
                      const slice = seasonPositionData.slice(start, end);
                      if (slice.length > 0) {
                        handleSelectSeasonYear(slice[slice.length - 1].yearNum);
                      }
                    }}
                    disabled={chartPeriod === totalPeriods - 1}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${chartPeriod === totalPeriods - 1
                        ? "opacity-30 cursor-not-allowed text-zinc-600"
                        : "text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 border border-white/5 hover:border-white/15"
                      }`}
                    title="Ver próximo período (temporadas mais recentes)"
                  >
                    <span className="hidden sm:inline">Próximo</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Gráfico de Colunas de Trajetória (Altura compacta h-48 igual a Pilotos) */}
              <div className="h-44 sm:h-48 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={visibleSeasonData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 15 }}
                    barCategoryGap="12%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis
                      dataKey="year"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: '#ffffff15' }}
                      interval={0}
                      tickFormatter={(yearStr) => `'${yearStr.slice(-2)}`}
                    />
                    <YAxis hide={true} />
                    <Tooltip
                      content={<CustomSeasonTooltip />}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                    />
                    <Bar
                      dataKey="heightScore"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                      label={renderCustomBarLabel}
                      onClick={(data: any) => {
                        const y = data?.yearNum ?? data?.payload?.yearNum ?? data?.activePayload?.[0]?.payload?.yearNum;
                        if (y) {
                          handleSelectSeasonYear(y);
                        }
                      }}
                    >
                      {visibleSeasonData.map((entry, index) => {
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
                            key={`cell-${entry.yearNum}-${index}`}
                            fill={barFill}
                            stroke={barStroke}
                            strokeWidth={isSelected ? 2.5 : 1}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                            onClick={() => handleSelectSeasonYear(entry.yearNum)}
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
                        {currentSeason.drivers_lineup.map((d: ConstructorSeasonDriverLineup) => (
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
            <div className={`rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-lg ${mobileSeasonSubView === "table" ? "block" : "hidden md:block"}`}>
              <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-f1-subtle" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Tabela Detalhada ({seasons.length} anos)
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
                      <span>Restaurar</span>
                    </button>
                  )}
                  <span className="text-[11px] text-f1-subtle font-mono hidden sm:inline">
                    Página {seasonsPage} de {totalSeasonPages}
                  </span>
                </div>
              </div>

              {/* Dica visual de expansão no mobile (< md) */}
              <div className="md:hidden flex items-center justify-between gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/10 text-[11px] text-f1-subtle">
                <span className="flex items-center gap-1.5">
                  <ChevronDown className="h-3.5 w-3.5 text-f1-red shrink-0" />
                  <span>Toque em qualquer linha para expandir estatísticas e pilotos da temporada</span>
                </span>
              </div>

              {/* Tabela de Temporadas */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#12121A] text-f1-subtle uppercase text-[10px] sm:text-[11px]">
                      <TableSortHeader
                        rowSpan={2}
                        label="Ano"
                        columnKey="year"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                      />
                      <th rowSpan={2} className="py-3 px-3 hidden md:table-cell">Dupla Principal</th>
                      <TableSortHeader
                        rowSpan={2}
                        label="Pos."
                        columnKey="championship_position"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        align="center"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="GPs"
                        columnKey="total_gps"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        align="center"
                        className="hidden md:table-cell"
                      />
                      <TableSortHeader
                        colSpan={2}
                        label="Vit."
                        columnKey="total_wins"
                        subKeys={["race_wins", "sprint_wins"]}
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        align="center"
                        className="border-l border-white/10"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="1-2"
                        columnKey="total_one_two"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        align="center"
                        className="hidden md:table-cell"
                      />
                      <TableSortHeader
                        colSpan={2}
                        label="Pódios"
                        columnKey="total_podiums"
                        subKeys={["race_podiums", "sprint_podiums"]}
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        align="center"
                        className="border-l border-white/10 hidden md:table-cell"
                      />
                      <TableSortHeader
                        colSpan={2}
                        label="Poles"
                        columnKey="total_poles"
                        subKeys={["race_poles", "sprint_poles"]}
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        align="center"
                        className="border-l border-white/10 hidden md:table-cell"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="Pts"
                        columnKey="total_points"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        align="right"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="DNFs"
                        columnKey="total_dnfs"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        align="center"
                        className="hidden md:table-cell"
                      />
                    </tr>
                    <tr className="hidden md:table-row border-b border-white/10 bg-black/30 text-[9px] font-bold tracking-wider uppercase">
                      <TableSubSortHeader
                        label="GP"
                        title="Vitórias GP"
                        columnKey="race_wins"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        className="border-l border-white/10"
                      />
                      <TableSubSortHeader
                        label="Spr"
                        title="Vitórias Sprint"
                        columnKey="sprint_wins"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        isSprint
                      />
                      <TableSubSortHeader
                        label="GP"
                        title="Pódios GP"
                        columnKey="race_podiums"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        className="border-l border-white/10"
                      />
                      <TableSubSortHeader
                        label="Spr"
                        title="Pódios Sprint"
                        columnKey="sprint_podiums"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        isSprint
                      />
                      <TableSubSortHeader
                        label="GP"
                        title="Poles GP"
                        columnKey="race_poles"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        className="border-l border-white/10"
                      />
                      <TableSubSortHeader
                        label="Spr"
                        title="Poles Sprint"
                        columnKey="sprint_poles"
                        currentSortKey={seasonSortKey}
                        currentSortDir={seasonSortDir}
                        onSort={handleSeasonSort}
                        isSprint
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedSeasons.map((s) => {
                      const isInProgress = !s.is_season_completed;
                      const isChampion = s.championship_position === 1 && s.is_season_completed;
                      const isSelected = s.year === selectedSeasonYear;
                      const isExpanded = expandedSeasonRowYear === s.year;

                      return (
                        <React.Fragment key={s.year}>
                          <tr
                            onClick={() => {
                              handleSelectSeasonYear(s.year);
                              setExpandedSeasonRowYear(isExpanded ? null : s.year);
                            }}
                            className={`group cursor-pointer transition-colors ${isSelected
                              ? "bg-white/[0.08] border-l-4 border-l-f1-red"
                              : isExpanded
                                ? "bg-white/[0.06] md:bg-transparent"
                                : isInProgress
                                  ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]"
                                  : "hover:bg-white/5"
                              }`}
                          >
                            {/* Temporada */}
                            <td className="py-2.5 px-2.5 sm:px-3 font-black text-white font-mono text-xs">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold">{s.year}</span>
                                  {isChampion && <span title="Campeã Mundial">👑</span>}
                                  {isInProgress && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" title="Em andamento" />
                                  )}
                                </div>
                                <span
                                  className={`md:hidden inline-flex h-5 w-5 items-center justify-center rounded-md border shrink-0 transition-all ${
                                    isExpanded
                                      ? "border-f1-red/50 bg-f1-red/20 text-f1-red shadow-[0_0_8px_rgba(225,6,0,0.25)]"
                                      : "border-white/15 bg-white/[0.06] text-white/70 group-hover:border-white/30 group-hover:text-white"
                                  }`}
                                  aria-hidden="true"
                                >
                                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                </span>
                              </div>
                              {s.drivers_lineup && s.drivers_lineup.length > 0 && (
                                <div className="flex md:hidden items-center gap-1 mt-0.5">
                                  {s.drivers_lineup.slice(0, 2).map((d: ConstructorSeasonDriverLineup) => (
                                    <span key={d.driver_id} className="text-[9px] text-f1-subtle font-mono">
                                      {d.driver_abbreviation || d.driver_full_name.slice(0, 3).toUpperCase()}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Dupla Principal */}
                            <td className="py-2.5 px-3 hidden md:table-cell">
                              <div className="flex items-center gap-1">
                                {s.drivers_lineup?.slice(0, 3).map((d: ConstructorSeasonDriverLineup) => (
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
                            <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                              {isChampion ? (
                                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 font-black text-[10px]">
                                  #1 <span className="hidden sm:inline">Campeã</span>
                                </span>
                              ) : isInProgress ? (
                                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                                  P{s.championship_position} <span className="hidden sm:inline">Atual</span>
                                </span>
                              ) : (
                                <span className="font-bold text-white text-xs">
                                  P{s.championship_position}
                                </span>
                              )}
                            </td>

                            {/* GPs */}
                            <td className="py-2.5 px-3 text-center text-zinc-300 font-mono text-xs hidden md:table-cell">
                              {s.total_gps}
                            </td>

                            {/* Vitórias */}
                            <td colSpan={2} className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 md:hidden">
                              {s.race_wins > 0 ? (
                                <span className="text-amber-400">{s.race_wins}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 hidden md:table-cell">
                              {s.race_wins > 0 ? (
                                <span className="text-amber-400">{s.race_wins}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-1.5 text-center font-mono font-bold hidden md:table-cell">
                              {s.sprint_wins > 0 ? (
                                <span className="text-purple-300">{s.sprint_wins}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>

                            {/* Dobradinhas 1-2 */}
                            <td className="py-2.5 px-3 text-center font-mono text-xs border-l border-white/5 hidden md:table-cell">
                              <span className={(s.total_one_two || 0) > 0 ? "font-bold text-amber-300" : "text-white/20"}>
                                {s.total_one_two || 0}
                              </span>
                            </td>

                            {/* Pódios */}
                            <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 hidden md:table-cell">
                              {s.race_podiums > 0 ? (
                                <span className="text-blue-300">{s.race_podiums}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-1.5 text-center font-mono font-bold hidden md:table-cell">
                              {s.sprint_podiums > 0 ? (
                                <span className="text-purple-300">{s.sprint_podiums}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>

                            {/* Poles */}
                            <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 hidden md:table-cell">
                              {s.race_poles > 0 ? (
                                <span className="text-purple-300">{s.race_poles}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-1.5 text-center font-mono font-bold hidden md:table-cell">
                              {s.sprint_poles > 0 ? (
                                <span className="text-purple-300">{s.sprint_poles}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>

                            {/* Pontos Totais */}
                            <td className="py-2.5 px-2.5 sm:px-3 text-right font-black text-white font-mono text-xs border-l border-white/5 whitespace-nowrap">
                              {Math.round(s.total_points).toLocaleString("pt-BR")}
                            </td>

                            {/* DNFs */}
                            <td className="py-2.5 px-3 text-center font-mono text-xs border-l border-white/5 hidden md:table-cell">
                              <span className={s.total_dnfs > 3 ? "text-rose-400 font-bold" : "text-zinc-400"}>
                                {s.total_dnfs}
                              </span>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="md:hidden bg-[#141420] border-b border-white/10 animate-fadeIn font-sans">
                              <td colSpan={13} className="p-3">
                                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5 text-xs">
                                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                                    <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                      <span className="block text-[9px] text-f1-subtle uppercase font-sans">GPs / 1-2</span>
                                      <span className="text-xs font-black text-white">
                                        {s.total_gps} / <span className="text-amber-300">{s.total_one_two || 0}</span>
                                      </span>
                                    </div>
                                    <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                      <span className="block text-[9px] text-f1-subtle uppercase font-sans">Pódios GP/Spr</span>
                                      <span className="text-xs font-black text-white">
                                        {s.race_podiums} / <span className="text-purple-300">{s.sprint_podiums}</span>
                                      </span>
                                    </div>
                                    <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                      <span className="block text-[9px] text-f1-subtle uppercase font-sans">Poles / DNFs</span>
                                      <span className="text-xs font-black text-purple-300">
                                        {s.race_poles} <span className="text-white/40">/</span> <span className="text-rose-400">{s.total_dnfs}</span>
                                      </span>
                                    </div>
                                  </div>

                                  {s.drivers_lineup && s.drivers_lineup.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      <span className="text-[10px] font-bold uppercase text-f1-subtle mr-1">Pilotos:</span>
                                      {s.drivers_lineup.map((d: ConstructorSeasonDriverLineup) => (
                                        <Link
                                          key={d.driver_id}
                                          href={getDriverProfileUrl(d.driver_id, d.driver_full_name)}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-[11px] font-bold text-white transition-colors"
                                        >
                                          <span>{d.driver_full_name}</span>
                                          <ExternalLink className="h-2.5 w-2.5 text-f1-subtle" />
                                        </Link>
                                      ))}
                                    </div>
                                  )}

                                  <Link
                                    href={`/season?year=${s.year}`}
                                    className="flex items-center justify-center gap-1.5 w-full py-2.5 min-h-[44px] rounded-lg bg-f1-red/15 hover:bg-f1-red/25 text-white font-bold text-xs transition-colors border border-f1-red/30 active:scale-95"
                                  >
                                    <span>Abrir Temporada {s.year}</span>
                                    <ChevronRight className="h-3.5 w-3.5 text-f1-red" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
                  className="w-full bg-[#0A0A10] border border-white/10 rounded-xl pl-9 pr-4 py-2 min-h-[44px] text-base sm:text-xs text-white placeholder-f1-subtle focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-f1-subtle">
                <span>{filteredDrivers.length} de {drivers.length} pilotos</span>
              </div>
            </div>

            {/* Tabela de Pilotos da História */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-xl">
              <div className="md:hidden flex items-center justify-between gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/10 text-[11px] text-f1-subtle">
                <span className="flex items-center gap-1.5">
                  <ChevronDown className="h-3.5 w-3.5 text-f1-red shrink-0" />
                  <span>Toque em qualquer linha para expandir estatísticas e perfil do piloto</span>
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#12121A] text-f1-subtle uppercase text-[10px] sm:text-[11px]">
                      <TableSortHeader
                        rowSpan={2}
                        label="Piloto"
                        columnKey="driver_full_name"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="Anos na Equipe"
                        columnKey="seasons_count"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        className="hidden md:table-cell"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="GPs"
                        columnKey="gps_raced"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="center"
                      />
                      <TableSortHeader
                        colSpan={2}
                        label="Vit."
                        columnKey="total_wins"
                        subKeys={["race_wins", "sprint_wins"]}
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="center"
                        className="border-l border-white/10"
                      />
                      <TableSortHeader
                        colSpan={2}
                        label="Pódios"
                        columnKey="total_podiums"
                        subKeys={["race_podiums", "sprint_podiums"]}
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="center"
                        className="border-l border-white/10 hidden md:table-cell"
                      />
                      <TableSortHeader
                        colSpan={2}
                        label="Poles"
                        columnKey="total_poles"
                        subKeys={["race_poles", "sprint_poles"]}
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="center"
                        className="border-l border-white/10 hidden md:table-cell"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="Títulos c/ Equipe"
                        columnKey="driver_titles_with_team"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="center"
                        className="hidden md:table-cell"
                      />
                      <TableSortHeader
                        rowSpan={2}
                        label="Pts"
                        columnKey="total_points"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        align="right"
                      />
                    </tr>
                    <tr className="hidden md:table-row border-b border-white/10 bg-black/30 text-[9px] font-bold tracking-wider uppercase">
                      <TableSubSortHeader
                        label="GP"
                        title="Vitórias GP"
                        columnKey="race_wins"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        className="border-l border-white/10"
                      />
                      <TableSubSortHeader
                        label="Spr"
                        title="Vitórias Sprint"
                        columnKey="sprint_wins"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        isSprint
                      />
                      <TableSubSortHeader
                        label="GP"
                        title="Pódios GP"
                        columnKey="race_podiums"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        className="border-l border-white/10"
                      />
                      <TableSubSortHeader
                        label="Spr"
                        title="Pódios Sprint"
                        columnKey="sprint_podiums"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        isSprint
                      />
                      <TableSubSortHeader
                        label="GP"
                        title="Poles GP"
                        columnKey="race_poles"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        className="border-l border-white/10"
                      />
                      <TableSubSortHeader
                        label="Spr"
                        title="Poles Sprint"
                        columnKey="sprint_poles"
                        currentSortKey={driverSortKey}
                        currentSortDir={driverSortDir}
                        onSort={handleDriverSort}
                        isSprint
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedDrivers.map((driver) => {
                      const profileUrl = getDriverProfileUrl(driver.driver_id, driver.driver_full_name);
                      const isChampionWithTeam = driver.driver_titles_with_team > 0;
                      const isExpanded = expandedDriverId === driver.driver_id;

                      return (
                        <React.Fragment key={driver.driver_id}>
                          <tr
                            onClick={() => setExpandedDriverId(isExpanded ? null : driver.driver_id)}
                            className={`group cursor-pointer md:cursor-default transition-colors ${
                              isExpanded ? "bg-white/[0.06] md:bg-transparent" : "hover:bg-white/[0.03]"
                            }`}
                          >
                            <td className="py-2.5 sm:py-3 px-2.5 sm:px-3 max-w-[175px] sm:max-w-none">
                              <Link
                                href={profileUrl}
                                className="flex items-center gap-2 sm:gap-2.5 group/link min-w-0 pointer-events-none md:pointer-events-auto"
                              >
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-mono font-black text-xs text-white">
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
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                                    <span className="font-bold text-white group-hover/link:text-white group-hover/link:underline decoration-white/30 transition-colors block truncate">
                                      {driver.driver_full_name}
                                    </span>
                                    <span
                                      className={`md:hidden inline-flex h-5 w-5 items-center justify-center rounded-md border shrink-0 transition-all ${
                                        isExpanded
                                          ? "border-f1-red/50 bg-f1-red/20 text-f1-red shadow-[0_0_8px_rgba(225,6,0,0.25)]"
                                          : "border-white/15 bg-white/[0.06] text-white/70 group-hover:border-white/30 group-hover:text-white"
                                      }`}
                                      aria-hidden="true"
                                    >
                                      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-f1-subtle truncate">
                                    {isChampionWithTeam && (
                                      <span className="md:hidden text-amber-400 font-bold">
                                        👑{driver.driver_titles_with_team}x
                                      </span>
                                    )}
                                    <span className="md:hidden truncate">{driver.seasons_list}</span>
                                    <span className="hidden md:inline font-mono bg-white/5 px-1 rounded">
                                      {driver.driver_abbreviation}
                                    </span>
                                    <span className="hidden md:inline">{driver.driver_nationality}</span>
                                  </div>
                                </div>
                              </Link>
                            </td>

                            <td className="py-3 px-3 text-f1-subtle max-w-[200px] truncate hidden md:table-cell" title={driver.seasons_list}>
                              <span className="font-semibold text-white/80">{driver.seasons_list}</span>
                              <span className="block text-[10px] text-white/40">
                                {driver.seasons_count} {driver.seasons_count === 1 ? "temporada" : "temporadas"}
                              </span>
                            </td>

                            <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-bold text-white">
                              {driver.gps_raced}
                            </td>

                            <td colSpan={2} className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 md:hidden">
                              {driver.race_wins > 0 ? (
                                <span className="text-amber-400">{driver.race_wins}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 hidden md:table-cell">
                              {driver.race_wins > 0 ? (
                                <span className="text-amber-400">{driver.race_wins}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-1.5 text-center font-mono font-bold hidden md:table-cell">
                              {driver.sprint_wins > 0 ? (
                                <span className="text-purple-300">{driver.sprint_wins}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>

                            <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 hidden md:table-cell">
                              {driver.race_podiums > 0 ? (
                                <span className="text-blue-300">{driver.race_podiums}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-1.5 text-center font-mono font-bold hidden md:table-cell">
                              {driver.sprint_podiums > 0 ? (
                                <span className="text-purple-300">{driver.sprint_podiums}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>

                            <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 hidden md:table-cell">
                              {driver.race_poles > 0 ? (
                                <span className="text-purple-300">{driver.race_poles}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-1.5 text-center font-mono font-bold hidden md:table-cell">
                              {driver.sprint_poles > 0 ? (
                                <span className="text-purple-300">{driver.sprint_poles}</span>
                              ) : (
                                <span className="text-white/20">0</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center border-l border-white/5 hidden md:table-cell">
                              {isChampionWithTeam ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-xs">
                                  👑 {driver.driver_titles_with_team}x
                                </span>
                              ) : (
                                <span className="text-white/20">—</span>
                              )}
                            </td>

                            <td className="py-2.5 sm:py-3 px-2.5 sm:px-3 text-right font-black text-white border-l border-white/5 whitespace-nowrap">
                              {driver.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="md:hidden bg-[#141420] border-b border-white/10 animate-fadeIn font-sans">
                              <td colSpan={11} className="p-3">
                                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5 text-xs">
                                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                                    <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                      <span className="block text-[9px] text-f1-subtle uppercase font-sans">Vitórias GP/Spr</span>
                                      <span className="text-xs font-black text-white">
                                        {driver.race_wins} / <span className="text-purple-300">{driver.sprint_wins}</span>
                                      </span>
                                    </div>
                                    <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                      <span className="block text-[9px] text-f1-subtle uppercase font-sans">Pódios GP/Spr</span>
                                      <span className="text-xs font-black text-white">
                                        {driver.race_podiums} / <span className="text-purple-300">{driver.sprint_podiums}</span>
                                      </span>
                                    </div>
                                    <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                      <span className="block text-[9px] text-f1-subtle uppercase font-sans">Poles GP/Spr</span>
                                      <span className="text-xs font-black text-white">
                                        {driver.race_poles} / <span className="text-purple-300">{driver.sprint_poles}</span>
                                      </span>
                                    </div>
                                  </div>

                                  <Link
                                    href={profileUrl}
                                    className="flex items-center justify-center gap-1.5 w-full py-2.5 min-h-[44px] rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors border border-white/10 active:scale-95"
                                  >
                                    <span>Ver Perfil Completo do Piloto</span>
                                    <ExternalLink className="h-3.5 w-3.5 text-f1-subtle" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
        )}

        {/* ========================================================================= */}
        {/* ABA 3: REGISTRO CORRIDA A CORRIDA                                         */}
        {/* ========================================================================= */}
        {activeTab === "races" && (
          <div className="space-y-4 min-w-0 w-full max-w-full">
            {/* Toolbar com Seletor de Temporada e Contadores Imunes a Compressão */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-white/10 bg-[#12121A] shadow-md w-full min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 shrink-0">
                  <Flag className="h-4 w-4 text-f1-subtle shrink-0" />
                  <span className="text-xs font-bold uppercase text-white font-mono shrink-0">
                    Temporada:
                  </span>
                </div>
                <select
                  value={selectedSeasonForRaces}
                  onChange={(e) => {
                    setSelectedSeasonForRaces(e.target.value);
                    setRacesPage(1);
                  }}
                  className="w-full sm:w-auto flex-1 sm:flex-initial min-w-0 max-w-[280px] min-h-[42px] sm:min-h-0 bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 sm:py-1.5 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer font-mono truncate"
                >
                  <option value="all">Todas as Temporadas ({raceLog.length} corridas)</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      Temporada {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 text-xs font-mono text-f1-subtle shrink-0 whitespace-nowrap ml-auto">
                <span>
                  Exibindo <strong className="text-white">{filteredRaces.length}</strong> {filteredRaces.length === 1 ? "corrida" : "corridas"}
                </span>
                {selectedSeasonForRaces !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeasonForRaces("all");
                      setRacesPage(1);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-f1-red hover:underline font-bold active:scale-95 ml-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Todas
                  </button>
                )}
              </div>
            </div>

            {/* Tabela de Corridas */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-xl w-full max-w-full">
              <div className="md:hidden flex items-center justify-between gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/10 text-[11px] text-f1-subtle">
                <span className="flex items-center gap-1.5">
                  <ChevronDown className="h-3.5 w-3.5 text-f1-red shrink-0" />
                  <span>Toque em qualquer linha para expandir os 2 carros e abrir o GP</span>
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#12121A] text-f1-subtle uppercase text-[10px] sm:text-[11px]">
                      <th className="py-2.5 sm:py-3 px-2.5 sm:px-3">Etapa</th>
                      <th className="py-2.5 sm:py-3 px-2 sm:px-3">Grande Prêmio</th>
                      <th className="py-3 px-3 hidden md:table-cell">Sessão</th>
                      <th className="py-2.5 sm:py-3 px-2 sm:px-3">
                        <span className="md:hidden">Carros (Chegada)</span>
                        <span className="hidden md:inline">Carro #1 (Grid ➔ Final)</span>
                      </th>
                      <th className="py-3 px-3 hidden md:table-cell">Carro #2 (Grid ➔ Final)</th>
                      <th className="py-3 px-3 text-center hidden md:table-cell">Destaque</th>
                      <th className="py-2.5 sm:py-3 px-2.5 sm:px-3 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedRaces.map((race, idx) => {
                      const car1 = race.drivers_results && race.drivers_results[0];
                      const car2 = race.drivers_results && race.drivers_results[1];
                      const raceKey = `${race.year}-${race.round_number}-${race.session_name}-${idx}`;
                      const isExpanded = expandedRaceKey === raceKey;

                      return (
                        <React.Fragment key={raceKey}>
                          <tr
                            onClick={() => setExpandedRaceKey(isExpanded ? null : raceKey)}
                            className={`group cursor-pointer md:cursor-default transition-colors ${
                              isExpanded ? "bg-white/[0.06] md:bg-transparent" : "hover:bg-white/[0.03]"
                            }`}
                          >
                            <td className="py-2.5 sm:py-3 px-2.5 sm:px-3 font-bold text-white whitespace-nowrap">
                              <span>{race.year}</span>
                              <span className="text-f1-subtle block sm:inline sm:ml-1 text-[10px] sm:text-xs">R{race.round_number}</span>
                            </td>
                            <td className="py-2.5 sm:py-3 px-2 sm:px-3 max-w-[155px] sm:max-w-none">
                              <div className="flex items-center justify-between gap-1.5 min-w-0">
                                <Link
                                  href={`/season/round/${race.round_number}?year=${race.year}`}
                                  className="text-white font-semibold hover:text-white hover:underline decoration-white/30 transition-colors block truncate pointer-events-none md:pointer-events-auto"
                                  title={`Ver análise da etapa ${race.round_number} (${race.year})`}
                                >
                                  {race.official_event_name}
                                </Link>
                                <span
                                  className={`md:hidden inline-flex h-5 w-5 items-center justify-center rounded-md border shrink-0 transition-all ${
                                    isExpanded
                                      ? "border-f1-red/50 bg-f1-red/20 text-f1-red shadow-[0_0_8px_rgba(225,6,0,0.25)]"
                                      : "border-white/15 bg-white/[0.06] text-white/70 group-hover:border-white/30 group-hover:text-white"
                                  }`}
                                  aria-hidden="true"
                                >
                                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                </span>
                              </div>
                              <span className="md:hidden text-[10px] text-f1-subtle block truncate">{race.session_name}</span>
                            </td>
                            <td className="py-3 px-3 text-f1-subtle hidden md:table-cell">
                              {race.session_name}
                            </td>
                            <td className="py-2.5 sm:py-3 px-2 sm:px-3">
                              {/* Desktop: Apenas Carro #1 */}
                              <div className="hidden md:block">
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
                              </div>
                              {/* Mobile: Ambos os carros compactos */}
                              <div className="md:hidden space-y-0.5 text-[11px]">
                                {car1 && (
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="text-white/90 font-bold truncate max-w-[75px]">
                                      {car1.driver_full_name ? car1.driver_full_name.split(" ").pop() : "Piloto"}
                                    </span>
                                    <strong className="text-white">P{car1.finishing_position || "DNF"}</strong>
                                  </div>
                                )}
                                {car2 && (
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="text-white/90 font-bold truncate max-w-[75px]">
                                      {car2.driver_full_name ? car2.driver_full_name.split(" ").pop() : "Piloto"}
                                    </span>
                                    <strong className="text-white">P{car2.finishing_position || "DNF"}</strong>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 hidden md:table-cell">
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
                            <td className="py-3 px-3 text-center hidden md:table-cell">
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
                            <td className="py-2.5 sm:py-3 px-2.5 sm:px-3 text-right font-black text-white whitespace-nowrap">
                              {race.team_points}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="md:hidden bg-[#141420] border-b border-white/10 animate-fadeIn font-sans">
                              <td colSpan={7} className="p-3">
                                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5 text-xs">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                                    {car1 && (
                                      <div className="rounded-lg bg-white/5 p-2.5 border border-white/5 flex items-center justify-between gap-2">
                                        <DriverLink
                                          driverName={car1.driver_full_name}
                                          className="font-sans font-bold text-white text-xs truncate hover:underline"
                                        >
                                          {car1.driver_full_name}
                                        </DriverLink>
                                        <span className="text-[11px] text-f1-subtle shrink-0">
                                          P{car1.grid_position || "—"} ➔ <strong className="text-white">P{car1.finishing_position || car1.status || "DNF"}</strong>
                                        </span>
                                      </div>
                                    )}
                                    {car2 && (
                                      <div className="rounded-lg bg-white/5 p-2.5 border border-white/5 flex items-center justify-between gap-2">
                                        <DriverLink
                                          driverName={car2.driver_full_name}
                                          className="font-sans font-bold text-white text-xs truncate hover:underline"
                                        >
                                          {car2.driver_full_name}
                                        </DriverLink>
                                        <span className="text-[11px] text-f1-subtle shrink-0">
                                          P{car2.grid_position || "—"} ➔ <strong className="text-white">P{car2.finishing_position || car2.status || "DNF"}</strong>
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <Link
                                    href={`/season/round/${race.round_number}?year=${race.year}`}
                                    className="flex items-center justify-center gap-1.5 w-full py-2.5 min-h-[44px] rounded-lg bg-f1-red/15 hover:bg-f1-red/25 text-white font-bold text-xs transition-colors border border-f1-red/30 active:scale-95"
                                  >
                                    <span>Abrir Análise do GP ({race.year})</span>
                                    <ChevronRight className="h-3.5 w-3.5 text-f1-red" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
        )}
      </main>
    </div>
  );
}
