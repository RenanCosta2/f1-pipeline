"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  CircuitOverviewItem,
  SeasonRaceSummary,
  DriverCircuitPerformanceItem,
  CircuitTeamPerformanceItem
} from "@/types/f1";
import DriverLink, { getDriverProfileUrl } from "@/lib/driverUtils";
import TeamLink from "@/lib/teamUtils";
import {
  useTieCarousel,
  TieCarouselEdgeArrows,
  TieCarouselTrack,
  TieCarouselDots,
} from "@/components/ui/TieCarousel";
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
  ChevronLeft,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  Gauge,
  MapPin
} from "lucide-react";

interface Props {
  overview: CircuitOverviewItem;
  seasons: SeasonRaceSummary[];
  drivers: DriverCircuitPerformanceItem[];
  teams?: CircuitTeamPerformanceItem[];
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
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 min-h-[44px] inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold transition-all text-xs active:scale-95"
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
          className="px-3 py-1.5 min-h-[44px] inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold transition-all text-xs active:scale-95"
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

export default function CircuitProfileTabs({ overview, seasons, drivers, teams = [] }: Props) {
  // Aba inicial: Raio-X no mobile ("overview") e Edições da Temporada no desktop (onde a Sidebar Cockpit já está fixa à esquerda)
  const [activeTab, setActiveTab] = useState<"seasons" | "drivers" | "teams" | "overview">("seasons");

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

  // Paginação
  const [seasonsPage, setSeasonsPage] = useState<number>(1);
  const [driversPage, setDriversPage] = useState<number>(1);
  const [teamsPage, setTeamsPage] = useState<number>(1);

  // Edição selecionada no gráfico e mini Raio-X (garantindo conversão estrita para número)
  const [selectedEditionYear, setSelectedEditionYear] = useState<number>(() => {
    return seasons.length > 0 ? Number(seasons[0].year) : 2026;
  });

  const editionsChartData = useMemo(() => {
    const sorted = seasons.slice().sort((a, b) => Number(a.year) - Number(b.year));
    return sorted.map((s) => {
      const winner = s.race_winner_driver || "A definir";
      const winnerCode = s.race_winner_code || (s.race_winner_driver ? s.race_winner_driver.split(" ").pop()?.slice(0, 3).toUpperCase() : "—");
      const teamColor = s.race_winner_team_color || "#334155";
      const dnfs = Number(s.total_dnfs) || 0;
      const yNum = Number(s.year);

      return {
        year: yNum.toString(),
        yearNum: yNum,
        round: Number(s.round_number),
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
      editionsChartData.find((e) => Number(e.yearNum) === Number(selectedEditionYear)) ||
      editionsChartData[editionsChartData.length - 1] ||
      null
    );
  }, [editionsChartData, selectedEditionYear]);

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
  const totalPeriods = Math.max(1, Math.ceil(editionsChartData.length / PERIOD_SIZE));

  const getPeriodIndexForYear = (year: number, size = PERIOD_SIZE) => {
    const tot = Math.max(1, Math.ceil(editionsChartData.length / size));
    const index = editionsChartData.findIndex((e) => Number(e.yearNum) === Number(year));
    if (index === -1) return tot - 1;
    if (index >= editionsChartData.length - size) {
      return tot - 1;
    }
    return Math.floor(index / size);
  };

  // Handler unificado de seleção de edição de GP: sincroniza Gráfico, Mini Raio-X e Paginação da Tabela
  const handleSelectEditionYear = (yearVal: number | string, forcePeriod?: number) => {
    const y = Number(yearVal);
    if (!y || isNaN(y)) return;

    setSelectedEditionYear(y);

    if (forcePeriod !== undefined) {
      setChartPeriod(forcePeriod);
    } else {
      setChartPeriod((currentPeriod) => {
        const isLast = currentPeriod === totalPeriods - 1;
        const start = isLast
          ? Math.max(0, editionsChartData.length - PERIOD_SIZE)
          : currentPeriod * PERIOD_SIZE;
        const end = isLast ? editionsChartData.length : start + PERIOD_SIZE;
        const currentSlice = editionsChartData.slice(start, end);
        const alreadyVisible = currentSlice.some((e) => Number(e.yearNum) === y);
        if (alreadyVisible) {
          return currentPeriod;
        }
        return getPeriodIndexForYear(y);
      });
    }

    // Navega automaticamente a tabela de edições para a página onde a temporada está
    const seasonIndex = seasons.findIndex((s) => Number(s.year) === y);
    if (seasonIndex !== -1) {
      const targetPage = Math.floor(seasonIndex / SEASONS_PER_PAGE) + 1;
      setSeasonsPage(targetPage);
    }

    // Se estiver no mobile na aba Raio-X exclusiva, alterna para as Edições para visualização imediata
    if (activeTab === "overview") {
      setActiveTab("seasons");
    }
  };

    const [chartPeriod, setChartPeriod] = useState<number>(() => {
      return getPeriodIndexForYear(selectedEditionYear);
    });

    useEffect(() => {
      setChartPeriod(getPeriodIndexForYear(selectedEditionYear, PERIOD_SIZE));
    }, [PERIOD_SIZE]);

    const visibleEditionsData = useMemo(() => {
      if (editionsChartData.length <= PERIOD_SIZE) {
        return editionsChartData;
      }
      const isLast = chartPeriod === totalPeriods - 1;
      const start = isLast
        ? Math.max(0, editionsChartData.length - PERIOD_SIZE)
        : chartPeriod * PERIOD_SIZE;
      const end = isLast ? editionsChartData.length : start + PERIOD_SIZE;
      return editionsChartData.slice(start, end);
    }, [editionsChartData, chartPeriod, totalPeriods, PERIOD_SIZE]);

    // Label no topo das colunas do gráfico (Código do Vencedor)
    const renderCustomCircuitBarLabel = (props: any) => {
      const { x, y, width, index } = props;
      const item = visibleEditionsData[index];
      if (!item) return <g />;

      return (
        <text
          x={x + width / 2}
          y={y - 6}
          fill="#FFFFFF"
          textAnchor="middle"
          fontSize={10}
          fontWeight="800"
          fontFamily="monospace"
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
    const [expandedEditionKey, setExpandedEditionKey] = useState<string | null>(null);
    const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);
    const [expandedTeamName, setExpandedTeamName] = useState<string | null>(null);

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
        let valA =
          driverSortKey === "total_poles"
            ? (a.race_poles || 0) + (a.sprint_poles || 0)
            : a[driverSortKey];
        let valB =
          driverSortKey === "total_poles"
            ? (b.race_poles || 0) + (b.sprint_poles || 0)
            : b[driverSortKey];

        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;

        if (typeof valA === "string") {
          return driverSortDir === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (valA !== valB) {
          return driverSortDir === "asc" ? valA - valB : valB - valA;
        }
        return (b.total_points || 0) - (a.total_points || 0);
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
    const [teamSearch, setTeamSearch] = useState("");
    const [teamSortKey, setTeamSortKey] = useState<string>("total_wins");
    const [teamSortDir, setTeamSortDir] = useState<"asc" | "desc">("desc");

    const handleSortTeam = (key: string) => {
      setTeamsPage(1);
      if (teamSortKey === key) {
        setTeamSortDir(teamSortDir === "asc" ? "desc" : "asc");
      } else {
        setTeamSortKey(key);
        setTeamSortDir("desc");
      }
    };

    const baseTeams = useMemo<CircuitTeamPerformanceItem[]>(() => {
      if (teams && teams.length > 0) return teams;

      const map = new Map<string, CircuitTeamPerformanceItem>();
      seasons.forEach((s) => {
        const registerTeam = (name: string, color?: string | null) => {
          if (!map.has(name)) {
            map.set(name, {
              circuit_id: overview.circuit_id,
              team_name: name,
              team_color: color || "#E10600",
              total_gps: 0,
              first_year: s.year,
              last_year: s.year,
              total_wins: 0,
              race_wins: 0,
              sprint_wins: 0,
              total_podiums: 0,
              race_podiums: 0,
              sprint_podiums: 0,
              race_poles: 0,
              sprint_poles: 0,
              total_points: 0
            });
          }
          const curr = map.get(name)!;
          if (s.year < curr.first_year) curr.first_year = s.year;
          if (s.year > curr.last_year) curr.last_year = s.year;
          return curr;
        };

        if (s.race_winner_team) {
          const curr = registerTeam(s.race_winner_team, s.race_winner_team_color);
          curr.race_wins += 1;
          curr.total_wins += 1;
          curr.race_podiums += 1;
          curr.total_podiums += 1;
        }
        if (s.sprint_winner_team) {
          const curr = registerTeam(s.sprint_winner_team, s.sprint_winner_team_color);
          curr.sprint_wins += 1;
          curr.total_wins += 1;
          curr.sprint_podiums += 1;
          curr.total_podiums += 1;
        }
        if (s.pole_team) {
          const curr = registerTeam(s.pole_team);
          curr.race_poles += 1;
        }
      });

      return Array.from(map.values());
    }, [teams, seasons, overview.circuit_id]);

    const teamStats = useMemo(() => {
      let result: CircuitTeamPerformanceItem[] = [...baseTeams];

      if (teamSearch.trim()) {
        const q = teamSearch.toLowerCase().trim();
        result = result.filter((t) => t.team_name.toLowerCase().includes(q));
      }

      result.sort((a: any, b: any) => {
        let valA =
          teamSortKey === "total_poles"
            ? (a.race_poles || 0) + (a.sprint_poles || 0)
            : a[teamSortKey];
        let valB =
          teamSortKey === "total_poles"
            ? (b.race_poles || 0) + (b.sprint_poles || 0)
            : b[teamSortKey];

        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;

        if (typeof valA === "string") {
          return teamSortDir === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (valA !== valB) {
          return teamSortDir === "asc" ? valA - valB : valB - valA;
        }
        if ((b.total_wins || 0) !== (a.total_wins || 0)) {
          return (b.total_wins || 0) - (a.total_wins || 0);
        }
        return (b.total_points || 0) - (a.total_points || 0);
      });

      return result;
    }, [baseTeams, teamSearch, teamSortKey, teamSortDir]);

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

    const hallOfFameTies = useMemo(() => {
      const maxWins = Math.max(0, ...drivers.map((d) => Number(d.race_wins ?? d.total_wins) || 0));
      const winsList =
        overview.most_wins_drivers && overview.most_wins_drivers.length > 0
          ? overview.most_wins_drivers
          : maxWins > 0
            ? drivers
              .filter((d) => (Number(d.race_wins ?? d.total_wins) || 0) === maxWins)
              .map((d) => ({
                driver_id: d.driver_id,
                driver_full_name: d.driver_full_name,
                driver_code: d.driver_abbreviation,
                driver_headshot_url: d.driver_headshot_url,
                count: maxWins
              }))
            : overview.most_wins_driver
              ? [{
                driver_id: overview.most_wins_driver_id,
                driver_full_name: overview.most_wins_driver,
                driver_code: overview.most_wins_driver_code,
                driver_headshot_url: overview.most_wins_driver_headshot_url,
                count: overview.most_wins_count || 0
              }]
              : [];

      const maxPodiums = Math.max(0, ...drivers.map((d) => Number(d.race_podiums ?? d.total_podiums) || 0));
      const podiumsList =
        overview.most_podiums_drivers && overview.most_podiums_drivers.length > 0
          ? overview.most_podiums_drivers
          : maxPodiums > 0
            ? drivers
              .filter((d) => (Number(d.race_podiums ?? d.total_podiums) || 0) === maxPodiums)
              .map((d) => ({
                driver_id: d.driver_id,
                driver_full_name: d.driver_full_name,
                driver_code: d.driver_abbreviation,
                driver_headshot_url: d.driver_headshot_url,
                count: maxPodiums
              }))
            : overview.most_podiums_driver
              ? [{
                driver_id: overview.most_podiums_driver_id,
                driver_full_name: overview.most_podiums_driver,
                driver_code: overview.most_podiums_driver_code,
                driver_headshot_url: overview.most_podiums_driver_headshot_url,
                count: overview.most_podiums_count || 0
              }]
              : [];

      const maxPoles = Math.max(0, ...drivers.map((d) => Number(d.race_poles) || 0));
      const polesList =
        overview.most_poles_drivers && overview.most_poles_drivers.length > 0
          ? overview.most_poles_drivers
          : maxPoles > 0
            ? drivers
              .filter((d) => (Number(d.race_poles) || 0) === maxPoles)
              .map((d) => ({
                driver_id: d.driver_id,
                driver_full_name: d.driver_full_name,
                driver_code: d.driver_abbreviation,
                driver_headshot_url: d.driver_headshot_url,
                count: maxPoles
              }))
            : overview.most_poles_driver
              ? [{
                driver_id: overview.most_poles_driver_id,
                driver_full_name: overview.most_poles_driver,
                driver_code: overview.most_poles_driver_code,
                driver_headshot_url: overview.most_poles_driver_headshot_url,
                count: overview.most_poles_count || 0
              }]
              : [];

      const teamsList =
        overview.most_wins_teams && overview.most_wins_teams.length > 0
          ? overview.most_wins_teams
          : overview.most_wins_team
            ? [{
              team_name: overview.most_wins_team,
              team_color: overview.most_wins_team_color,
              count: overview.most_wins_team_count || 0
            }]
            : [];

      return { winsList, podiumsList, polesList, teamsList };
    }, [drivers, overview]);

    const hofWinsCarousel = useTieCarousel(hallOfFameTies.winsList.length);
    const hofPodiumsCarousel = useTieCarousel(hallOfFameTies.podiumsList.length);
    const hofPolesCarousel = useTieCarousel(hallOfFameTies.polesList.length);
    const hofTeamsCarousel = useTieCarousel(hallOfFameTies.teamsList.length);

    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA (33% no Desktop xl+, Aba "Raio-X" Exclusiva em < xl)      */}
        {/* ========================================================================= */}
        <aside className={`order-2 xl:order-1 xl:col-span-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 min-w-0 ${activeTab === "overview" ? "grid" : "hidden xl:grid"}`}>
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
              {hallOfFameTies.winsList.length > 0 && (
                <div
                  onMouseEnter={hofWinsCarousel.pause}
                  onMouseLeave={hofWinsCarousel.resume}
                  className={`relative overflow-hidden py-2.5 rounded-xl bg-white/[0.02] border border-white/5 ${hofWinsCarousel.isTied ? "px-5" : "px-2.5"
                    }`}
                >
                  <TieCarouselEdgeArrows carousel={hofWinsCarousel} accent="amber" size="xs" />
                  <TieCarouselTrack
                    carousel={hofWinsCarousel}
                    items={hallOfFameTies.winsList}
                    keyExtractor={(d) => d.driver_id || d.driver_full_name}
                    renderItem={(cur) => (
                      <div className="flex items-center gap-2.5 min-w-0 w-full">
                        <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-mono font-black text-xs text-white">
                          {cur.driver_headshot_url ? (
                            <img
                              src={cur.driver_headshot_url}
                              alt={cur.driver_full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            cur.driver_code || "F1"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold text-amber-400">
                              Mais Vitorioso
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <TieCarouselDots carousel={hofWinsCarousel} accent="amber" />
                              <span className="font-mono font-black text-amber-400 text-xs">
                                {overview.most_wins_count}V
                              </span>
                            </div>
                          </div>
                          <DriverLink
                            driverId={cur.driver_id || undefined}
                            driverName={cur.driver_full_name}
                            className="font-bold text-white text-xs sm:text-sm truncate block hover:text-amber-300 transition-colors mt-0.5"
                            title={`Ver perfil de ${cur.driver_full_name}`}
                          >
                            {cur.driver_full_name}
                          </DriverLink>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Mais Pódios */}
              {hallOfFameTies.podiumsList.length > 0 && (
                <div
                  onMouseEnter={hofPodiumsCarousel.pause}
                  onMouseLeave={hofPodiumsCarousel.resume}
                  className={`relative overflow-hidden py-2.5 rounded-xl bg-white/[0.02] border border-white/5 ${hofPodiumsCarousel.isTied ? "px-5" : "px-2.5"
                    }`}
                >
                  <TieCarouselEdgeArrows carousel={hofPodiumsCarousel} accent="blue" size="xs" />
                  <TieCarouselTrack
                    carousel={hofPodiumsCarousel}
                    items={hallOfFameTies.podiumsList}
                    keyExtractor={(d) => d.driver_id || d.driver_full_name}
                    renderItem={(cur) => (
                      <div className="flex items-center gap-2.5 min-w-0 w-full">
                        <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-mono font-black text-xs text-white">
                          {cur.driver_headshot_url ? (
                            <img
                              src={cur.driver_headshot_url}
                              alt={cur.driver_full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            cur.driver_code || "F1"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold text-blue-400">
                              Mais Pódios
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <TieCarouselDots carousel={hofPodiumsCarousel} accent="blue" />
                              <span className="font-mono font-black text-blue-300 text-xs">
                                {overview.most_podiums_count}P
                              </span>
                            </div>
                          </div>
                          <DriverLink
                            driverId={cur.driver_id || undefined}
                            driverName={cur.driver_full_name}
                            className="font-bold text-white text-xs sm:text-sm truncate block hover:text-blue-300 transition-colors mt-0.5"
                            title={`Ver perfil de ${cur.driver_full_name}`}
                          >
                            {cur.driver_full_name}
                          </DriverLink>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Rei da Pole */}
              {hallOfFameTies.polesList.length > 0 && (
                <div
                  onMouseEnter={hofPolesCarousel.pause}
                  onMouseLeave={hofPolesCarousel.resume}
                  className={`relative overflow-hidden py-2.5 rounded-xl bg-white/[0.02] border border-white/5 ${hofPolesCarousel.isTied ? "px-5" : "px-2.5"
                    }`}
                >
                  <TieCarouselEdgeArrows carousel={hofPolesCarousel} accent="purple" size="xs" />
                  <TieCarouselTrack
                    carousel={hofPolesCarousel}
                    items={hallOfFameTies.polesList}
                    keyExtractor={(d) => d.driver_id || d.driver_full_name}
                    renderItem={(cur) => (
                      <div className="flex items-center gap-2.5 min-w-0 w-full">
                        <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-mono font-black text-xs text-white">
                          {cur.driver_headshot_url ? (
                            <img
                              src={cur.driver_headshot_url}
                              alt={cur.driver_full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            cur.driver_code || "F1"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold text-purple-400">
                              Rei da Pole
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <TieCarouselDots carousel={hofPolesCarousel} accent="purple" />
                              <span className="font-mono font-black text-purple-300 text-xs">
                                {overview.most_poles_count} Poles
                              </span>
                            </div>
                          </div>
                          <DriverLink
                            driverId={cur.driver_id || undefined}
                            driverName={cur.driver_full_name}
                            className="font-bold text-white text-xs sm:text-sm truncate block hover:text-purple-300 transition-colors mt-0.5"
                            title={`Ver perfil de ${cur.driver_full_name}`}
                          >
                            {cur.driver_full_name}
                          </DriverLink>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Equipe Dominante */}
              {hallOfFameTies.teamsList.length > 0 && (
                <div
                  onMouseEnter={hofTeamsCarousel.pause}
                  onMouseLeave={hofTeamsCarousel.resume}
                  className={`relative overflow-hidden py-2.5 rounded-xl bg-white/[0.02] border border-white/5 ${hofTeamsCarousel.isTied ? "px-5" : "px-2.5"
                    }`}
                >
                  <TieCarouselEdgeArrows carousel={hofTeamsCarousel} accent="emerald" size="xs" />
                  <TieCarouselTrack
                    carousel={hofTeamsCarousel}
                    items={hallOfFameTies.teamsList}
                    keyExtractor={(t) => t.team_name}
                    renderItem={(cur) => (
                      <div className="flex items-center gap-2.5 min-w-0 w-full">
                        <div
                          className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cur.team_color || "#E10600"}22` }}
                        >
                          <Shield
                            className="h-4 w-4"
                            style={{ color: cur.team_color || "#E10600" }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold text-emerald-400">
                              Equipe Top
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <TieCarouselDots carousel={hofTeamsCarousel} accent="emerald" />
                              <span className="font-mono font-black text-white text-xs">
                                {overview.most_wins_team_count}V
                              </span>
                            </div>
                          </div>
                          <TeamLink
                            teamName={cur.team_name}
                            className="font-bold text-white text-xs sm:text-sm truncate block hover:underline hover:text-white transition-colors mt-0.5"
                            title={`Ver perfil de ${cur.team_name}`}
                          >
                            {cur.team_name}
                          </TeamLink>
                        </div>
                      </div>
                    )}
                  />
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
                  <div className="flex flex-wrap items-center gap-1 pt-0.5 max-h-24 overflow-y-auto scrollbar-thin">
                    {(overview.years_held && overview.years_held.length > 0
                      ? overview.years_held
                      : overview.seasons_list!.split(",").map((s) => Number(s.trim()))
                    ).map((y) => {
                      const yNum = Number(y);
                      const isSelected = yNum === Number(selectedEditionYear);
                      return (
                        <button
                          key={yNum}
                          type="button"
                          onClick={() => handleSelectEditionYear(yNum)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${isSelected
                              ? "bg-f1-red text-white shadow-sm shadow-f1-red/30 scale-105"
                              : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                            }`}
                          title={`Clique para selecionar e abrir o GP de ${yNum}`}
                        >
                          {yNum}
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
                className={`xl:hidden inline-flex items-center justify-center gap-1 px-2 py-2 min-h-[44px] rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${activeTab === "overview"
                    ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                    : "text-f1-subtle hover:text-white hover:bg-white/5"
                  }`}
              >
                <span>Raio-X</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("seasons")}
                className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 min-h-[44px] rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${activeTab === "seasons"
                    ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                    : "text-f1-subtle hover:text-white hover:bg-white/5"
                  }`}
              >
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 hidden sm:inline" />
                <span className="sm:hidden">Edições</span>
                <span className="hidden sm:inline">Edições da Temporada</span>
                <span
                  className={`hidden sm:inline text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === "seasons" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                    }`}
                >
                  {seasons.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("drivers")}
                className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 min-h-[44px] rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${activeTab === "drivers"
                    ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                    : "text-f1-subtle hover:text-white hover:bg-white/5"
                  }`}
              >
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 hidden sm:inline" />
                <span className="sm:hidden">Pilotos</span>
                <span className="hidden sm:inline">Histórico de Pilotos</span>
                <span
                  className={`hidden sm:inline text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === "drivers" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                    }`}
                >
                  {drivers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("teams")}
                className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 min-h-[44px] rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${activeTab === "teams"
                    ? "bg-f1-red text-white shadow-md shadow-f1-red/25"
                    : "text-f1-subtle hover:text-white hover:bg-white/5"
                  }`}
              >
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 hidden sm:inline" />
                <span className="sm:hidden">Equipes</span>
                <span className="hidden sm:inline">Histórico de Equipes</span>
                <span
                  className={`hidden sm:inline text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === "teams" ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
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
              {/* Sub-seletor Mobile (< md): Alterna entre Gráfico/Raio-X da Edição (1ª aba) e Tabela sem empilhar */}
              <div className="grid grid-cols-2 md:hidden rounded-xl border border-white/10 bg-[#12121A] p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => setMobileSeasonSubView("chart")}
                  className={`py-2 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${mobileSeasonSubView === "chart"
                      ? "bg-white/15 text-white shadow"
                      : "text-f1-subtle hover:text-white"
                    }`}
                >
                  Gráfico & Raio-X ({selectedEditionYear})
                </button>
                <button
                  type="button"
                  onClick={() => setMobileSeasonSubView("table")}
                  className={`py-2 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${mobileSeasonSubView === "table"
                      ? "bg-white/15 text-white shadow"
                      : "text-f1-subtle hover:text-white"
                    }`}
                >
                  Edições ({seasons.length})
                </button>
              </div>

              {/* Bloco Unificado: Gráfico de Vencedores & Atrito + Mini Raio-X da Edição */}
              <div className={`rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg space-y-4 ${mobileSeasonSubView === "chart" ? "block" : "hidden md:block"}`}>
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
                      onChange={(e) => {
                        handleSelectEditionYear(e.target.value);
                      }}
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
                      const isSelected = Number(s.yearNum) === Number(selectedEditionYear);
                      return (
                        <button
                          key={s.yearNum}
                          type="button"
                          onClick={() => {
                            handleSelectEditionYear(s.yearNum);
                          }}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all shrink-0 ${isSelected
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

                {/* Barra de Navegação entre Períodos / Eras */}
                {totalPeriods > 1 && (
                  <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono">
                    {/* Botão Período Anterior */}
                    <button
                      type="button"
                      onClick={() => {
                        const newPeriod = Math.max(0, chartPeriod - 1);
                        const isLast = newPeriod === totalPeriods - 1;
                        const start = isLast
                          ? Math.max(0, editionsChartData.length - PERIOD_SIZE)
                          : newPeriod * PERIOD_SIZE;
                        const end = isLast ? editionsChartData.length : start + PERIOD_SIZE;
                        const slice = editionsChartData.slice(start, end);
                        if (slice.length > 0) {
                          const targetYear = slice.some((e) => e.yearNum === selectedEditionYear)
                            ? selectedEditionYear
                            : slice[slice.length - 1].yearNum;
                          handleSelectEditionYear(targetYear, newPeriod);
                        } else {
                          setChartPeriod(newPeriod);
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
                        {visibleEditionsData[0]?.year} — {visibleEditionsData[visibleEditionsData.length - 1]?.year}
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
                        const isLast = newPeriod === totalPeriods - 1;
                        const start = isLast
                          ? Math.max(0, editionsChartData.length - PERIOD_SIZE)
                          : newPeriod * PERIOD_SIZE;
                        const end = isLast ? editionsChartData.length : start + PERIOD_SIZE;
                        const slice = editionsChartData.slice(start, end);
                        if (slice.length > 0) {
                          const targetYear = slice.some((e) => e.yearNum === selectedEditionYear)
                            ? selectedEditionYear
                            : slice[0].yearNum;
                          handleSelectEditionYear(targetYear, newPeriod);
                        } else {
                          setChartPeriod(newPeriod);
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

                {/* Gráfico de Colunas de Histórico & Atrito (h-44 sm:h-48) */}
                <div className="h-44 sm:h-48 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={visibleEditionsData}
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
                        maxBarSize={30}
                        label={renderCustomCircuitBarLabel}
                        onClick={(data: any) => {
                          const y = data?.yearNum ?? data?.payload?.yearNum ?? data?.activePayload?.[0]?.payload?.yearNum;
                          if (y) {
                            handleSelectEditionYear(y);
                          }
                        }}
                      >
                        {visibleEditionsData.map((entry, index) => {
                          const isSelected = Number(entry.yearNum) === Number(selectedEditionYear);
                          return (
                            <Cell
                              key={`cell-${entry.yearNum}-${index}`}
                              fill={entry.winnerColor || "#334155"}
                              stroke={isSelected ? "#FFFFFF" : `${entry.winnerColor}aa`}
                              strokeWidth={isSelected ? 2.5 : 1}
                              className="cursor-pointer transition-opacity hover:opacity-80"
                              onClick={() => handleSelectEditionYear(entry.yearNum)}
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
              <div className={`rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-lg ${mobileSeasonSubView === "table" ? "block" : "hidden md:block"}`}>
                <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10 bg-white/[0.01]">
                  <div className="flex items-center gap-2">
                    <Table2 className="h-4 w-4 text-f1-subtle" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Tabela Detalhada ({seasons.length} edições)
                    </span>
                  </div>
                  <span className="text-[11px] text-f1-subtle font-mono hidden sm:inline">
                    Página {seasonsPage} de {totalSeasonPages}
                  </span>
                </div>

                {/* Dica visual de expansão no mobile (< md) */}
                <div className="md:hidden flex items-center justify-between gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/10 text-[11px] text-f1-subtle">
                  <span className="flex items-center gap-1.5">
                    <ChevronDown className="h-3.5 w-3.5 text-f1-red shrink-0" />
                    <span>Toque em qualquer linha para expandir detalhes e perfil</span>
                  </span>
                </div>

                {/* Tabela de Edições */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#12121A] text-f1-subtle uppercase text-[10px] sm:text-[11px]">
                        <th className="py-2.5 px-2.5 sm:px-3">Ano</th>
                        <th className="py-2.5 px-2.5 sm:px-3">Vencedor</th>
                        <th className="py-2.5 px-3 hidden md:table-cell">Equipe</th>
                        <th className="py-2.5 px-2.5 sm:px-3">Pole Position</th>
                        <th className="py-2.5 px-3 hidden md:table-cell">Volta Mais Rápida</th>
                        <th className="py-2.5 px-3 text-center hidden md:table-cell">DNFs</th>
                        <th className="py-2.5 px-2.5 sm:px-3 text-right hidden md:table-cell">GP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedSeasons.map((race) => {
                        const isSelected = Number(race.year) === Number(selectedEditionYear);
                        const editionKey = `${race.year}-${race.round_number}`;
                        const isExpanded = expandedEditionKey === editionKey;
                        return (
                          <React.Fragment key={editionKey}>
                            <tr
                              onClick={() => {
                                handleSelectEditionYear(race.year);
                                setExpandedEditionKey(isExpanded ? null : editionKey);
                              }}
                              className={`group cursor-pointer transition-colors ${isSelected
                                  ? "bg-white/[0.08] border-l-4 border-l-f1-red"
                                  : isExpanded
                                    ? "bg-white/[0.06] md:bg-transparent"
                                    : "hover:bg-white/5"
                                }`}
                            >
                              {/* Temporada e Evento */}
                              <td className="py-2.5 px-2.5 sm:px-3 whitespace-nowrap font-mono">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <span className="rounded bg-f1-red/10 border border-f1-red/30 px-1.5 py-0.5 text-xs font-black text-f1-red">
                                    {race.year}
                                  </span>
                                  <span className="font-bold text-white text-[11px] sm:text-xs font-sans">
                                    R{race.round_number}
                                  </span>
                                </div>
                              </td>

                              {/* Vencedor do GP */}
                              <td className="py-2.5 px-2.5 sm:px-3 max-w-[155px] sm:max-w-none">
                                {race.race_winner_driver ? (
                                  <div className="flex items-center gap-2 font-sans min-w-0">
                                    {race.race_winner_headshot_url && (
                                      <img
                                        src={race.race_winner_headshot_url}
                                        alt={race.race_winner_driver}
                                        className="h-6 w-6 rounded-full object-cover bg-white/5 border border-white/10 shrink-0 hidden sm:block"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = "none";
                                        }}
                                      />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                                        {race.race_winner_driver_id ? (
                                          <Link
                                            href={getDriverProfileUrl(race.race_winner_driver_id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="font-bold text-white hover:text-white hover:underline decoration-white/30 transition-colors text-xs block truncate pointer-events-none md:pointer-events-auto"
                                          >
                                            {race.race_winner_driver}
                                          </Link>
                                        ) : (
                                          <span className="font-bold text-white text-xs block truncate">
                                            {race.race_winner_driver}
                                          </span>
                                        )}
                                        <span
                                          className={`md:hidden inline-flex h-5 w-5 items-center justify-center rounded-md border shrink-0 transition-all ${isExpanded
                                              ? "border-f1-red/50 bg-f1-red/20 text-f1-red shadow-[0_0_8px_rgba(225,6,0,0.25)]"
                                              : "border-white/15 bg-white/[0.06] text-white/70 group-hover:border-white/30 group-hover:text-white"
                                            }`}
                                          aria-hidden="true"
                                        >
                                          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                        </span>
                                      </div>
                                      {race.race_winner_team && (
                                        <div className="flex md:hidden items-center gap-1 mt-0.5">
                                          <span
                                            className="h-1.5 w-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: race.race_winner_team_color || "#E10600" }}
                                          />
                                          <span className="text-[10px] text-f1-subtle truncate">{race.race_winner_team}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-white/20">—</span>
                                )}
                              </td>

                              {/* Equipe Vencedora */}
                              <td className="py-2.5 px-3 whitespace-nowrap font-sans hidden md:table-cell">
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
                              <td className="py-2.5 px-2.5 sm:px-3 font-sans max-w-[125px] sm:max-w-none">
                                {race.pole_driver ? (
                                  <div className="min-w-0">
                                    <span className="font-bold text-white text-xs block truncate">
                                      {race.pole_driver}
                                    </span>
                                    <span className="text-[10px] text-f1-subtle block truncate">
                                      {race.pole_team || "—"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-white/20 font-mono">—</span>
                                )}
                              </td>

                              {/* Volta Mais Rápida */}
                              <td className="py-2.5 px-3 whitespace-nowrap hidden md:table-cell">
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
                              <td className="py-2.5 px-3 whitespace-nowrap text-center hidden md:table-cell">
                                <span
                                  className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-mono font-bold ${Number(race.total_dnfs) > 3
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : "bg-white/5 text-zinc-400"
                                    }`}
                                >
                                  {race.total_dnfs}
                                </span>
                              </td>

                              {/* Ação */}
                              <td className="py-2.5 px-2 sm:px-3 whitespace-nowrap text-right hidden md:table-cell">
                                <Link
                                  href={`/season/round/${race.round_number}?year=${race.year}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-0.5 sm:gap-1 rounded-lg border border-white/10 bg-white/5 px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                  <span className="hidden sm:inline">Ver GP</span>
                                  <ChevronRight className="h-3 w-3 text-f1-subtle" />
                                </Link>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="md:hidden bg-[#141420] border-b border-white/10 animate-fadeIn font-sans">
                                <td colSpan={7} className="p-3">
                                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5 text-xs">
                                    <div className="grid grid-cols-2 gap-2 text-center font-mono">
                                      <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                        <span className="block text-[9px] text-f1-subtle uppercase font-sans">Volta Mais Rápida</span>
                                        <span className="text-xs font-black text-purple-300 block truncate">
                                          {race.fastest_lap_driver || "—"}
                                        </span>
                                        <span className="text-[10px] text-white/60">
                                          {race.fastest_lap_time_formatted || "—"}
                                        </span>
                                      </div>
                                      <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                        <span className="block text-[9px] text-f1-subtle uppercase font-sans">Abandonos (DNFs)</span>
                                        <span className="text-xs font-black text-white block mt-1">
                                          {race.total_dnfs ?? 0} pilotos
                                        </span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {race.race_winner_driver_id && (
                                        <Link
                                          href={getDriverProfileUrl(race.race_winner_driver_id)}
                                          className="flex items-center justify-center gap-1.5 w-full py-2.5 min-h-[44px] rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors border border-white/10 active:scale-95"
                                        >
                                          <span>Perfil de {race.race_winner_driver}</span>
                                          <ExternalLink className="h-3.5 w-3.5 text-f1-subtle" />
                                        </Link>
                                      )}
                                      <Link
                                        href={`/season/round/${race.round_number}?year=${race.year}`}
                                        className="flex items-center justify-center gap-1.5 w-full py-2.5 min-h-[44px] rounded-lg bg-f1-red/15 hover:bg-f1-red/25 text-white font-bold text-xs transition-colors border border-f1-red/30 active:scale-95"
                                      >
                                        <span>Abrir Análise do GP ({race.year})</span>
                                        <ChevronRight className="h-3.5 w-3.5 text-f1-red" />
                                      </Link>
                                    </div>
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
                    className="w-full bg-[#0A0A10] border border-white/10 rounded-xl pl-9 pr-4 py-2 min-h-[44px] text-base sm:text-xs text-white placeholder-f1-subtle focus:outline-none focus:border-white/30"
                  />
                </div>

                <span className="text-xs font-mono text-f1-subtle">
                  {filteredAndSortedDrivers.length} de {drivers.length} pilotos
                </span>
              </div>

              {/* Tabela de Pilotos */}
              <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-xl">
                <div className="md:hidden flex items-center justify-between gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/10 text-[11px] text-f1-subtle">
                  <span className="flex items-center gap-1.5">
                    <ChevronDown className="h-3.5 w-3.5 text-f1-red shrink-0" />
                    <span>Toque em qualquer linha para expandir detalhes e perfil</span>
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
                          onSort={handleSortDriver}
                        />
                        <TableSortHeader
                          rowSpan={2}
                          label="GPs"
                          columnKey="total_gps"
                          currentSortKey={driverSortKey}
                          currentSortDir={driverSortDir}
                          onSort={handleSortDriver}
                          align="center"
                        />
                        <TableSortHeader
                          colSpan={2}
                          label="Vit."
                          columnKey="total_wins"
                          subKeys={["race_wins", "sprint_wins"]}
                          currentSortKey={driverSortKey}
                          currentSortDir={driverSortDir}
                          onSort={handleSortDriver}
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
                          onSort={handleSortDriver}
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
                          onSort={handleSortDriver}
                          align="center"
                          className="border-l border-white/10 hidden md:table-cell"
                        />
                        <TableSortHeader
                          rowSpan={2}
                          label="Pts"
                          columnKey="total_points"
                          currentSortKey={driverSortKey}
                          currentSortDir={driverSortDir}
                          onSort={handleSortDriver}
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
                          onSort={handleSortDriver}
                          className="border-l border-white/10"
                        />
                        <TableSubSortHeader
                          label="Spr"
                          title="Vitórias Sprint"
                          columnKey="sprint_wins"
                          currentSortKey={driverSortKey}
                          currentSortDir={driverSortDir}
                          onSort={handleSortDriver}
                          isSprint
                        />
                        <TableSubSortHeader
                          label="GP"
                          title="Pódios GP"
                          columnKey="race_podiums"
                          currentSortKey={driverSortKey}
                          currentSortDir={driverSortDir}
                          onSort={handleSortDriver}
                          className="border-l border-white/10"
                        />
                        <TableSubSortHeader
                          label="Spr"
                          title="Pódios Sprint"
                          columnKey="sprint_podiums"
                          currentSortKey={driverSortKey}
                          currentSortDir={driverSortDir}
                          onSort={handleSortDriver}
                          isSprint
                        />
                        <TableSubSortHeader
                          label="GP"
                          title="Poles GP"
                          columnKey="race_poles"
                          currentSortKey={driverSortKey}
                          currentSortDir={driverSortDir}
                          onSort={handleSortDriver}
                          className="border-l border-white/10"
                        />
                        <TableSubSortHeader
                          label="Spr"
                          title="Poles Sprint"
                          columnKey="sprint_poles"
                          currentSortKey={driverSortKey}
                          currentSortDir={driverSortDir}
                          onSort={handleSortDriver}
                          isSprint
                        />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedDrivers.map((driver) => {
                        const profileUrl = getDriverProfileUrl(driver.driver_id, driver.driver_full_name);
                        const isExpanded = expandedDriverId === driver.driver_id;

                        return (
                          <React.Fragment key={driver.driver_id}>
                            <tr
                              onClick={() => setExpandedDriverId(isExpanded ? null : driver.driver_id)}
                              className={`group cursor-pointer md:cursor-default transition-colors ${isExpanded ? "bg-white/[0.06] md:bg-transparent" : "hover:bg-white/[0.03]"
                                }`}
                            >
                              <td className="py-2.5 px-2.5 sm:px-3 max-w-[175px] sm:max-w-none">
                                <Link
                                  href={profileUrl}
                                  className="flex items-center gap-2 group/link font-sans min-w-0 pointer-events-none md:pointer-events-auto"
                                >
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
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                                      <span className="font-bold text-white group-hover/link:text-white group-hover/link:underline decoration-white/30 transition-colors block text-xs truncate">
                                        {driver.driver_full_name}
                                      </span>
                                      <span
                                        className={`md:hidden inline-flex h-5 w-5 items-center justify-center rounded-md border shrink-0 transition-all ${isExpanded
                                            ? "border-f1-red/50 bg-f1-red/20 text-f1-red shadow-[0_0_8px_rgba(225,6,0,0.25)]"
                                            : "border-white/15 bg-white/[0.06] text-white/70 group-hover:border-white/30 group-hover:text-white"
                                          }`}
                                        aria-hidden="true"
                                      >
                                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-f1-subtle font-mono block truncate">
                                      {driver.first_year}–{driver.last_year} ({driver.driver_nationality})
                                    </span>
                                  </div>
                                </Link>
                              </td>

                              <td className="py-2.5 px-2 text-center font-bold text-white">
                                {driver.total_gps}
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

                              <td className="py-2.5 px-2.5 sm:px-3 text-right font-black text-white whitespace-nowrap">
                                {driver.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="md:hidden bg-[#141420] border-b border-white/10 animate-fadeIn font-sans">
                                <td colSpan={9} className="p-3">
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
            <div className="space-y-4">
              {/* Barra de Busca de Equipe */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-[#12121A]">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-f1-subtle" />
                  <input
                    type="text"
                    value={teamSearch}
                    onChange={(e) => {
                      setTeamSearch(e.target.value);
                      setTeamsPage(1);
                    }}
                    placeholder="Buscar equipe por nome..."
                    className="w-full bg-[#0A0A10] border border-white/10 rounded-xl pl-9 pr-4 py-2 min-h-[44px] text-base sm:text-xs text-white placeholder-f1-subtle focus:outline-none focus:border-white/30"
                  />
                </div>

                <span className="text-xs font-mono text-f1-subtle">
                  {teamStats.length} de {baseTeams.length} equipes
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-xl">
                <div className="md:hidden flex items-center justify-between gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/10 text-[11px] text-f1-subtle">
                  <span className="flex items-center gap-1.5">
                    <ChevronDown className="h-3.5 w-3.5 text-f1-red shrink-0" />
                    <span>Toque em qualquer linha para expandir detalhes e perfil</span>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#12121A] text-f1-subtle uppercase text-[10px] sm:text-[11px]">
                        <TableSortHeader
                          rowSpan={2}
                          label="Equipe"
                          columnKey="team_name"
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                        />
                        <TableSortHeader
                          rowSpan={2}
                          label="GPs"
                          columnKey="total_gps"
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                          align="center"
                        />
                        <TableSortHeader
                          colSpan={2}
                          label="Vit."
                          columnKey="total_wins"
                          subKeys={["race_wins", "sprint_wins"]}
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                          align="center"
                          className="border-l border-white/10"
                        />
                        <TableSortHeader
                          colSpan={2}
                          label="Pódios"
                          columnKey="total_podiums"
                          subKeys={["race_podiums", "sprint_podiums"]}
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                          align="center"
                          className="border-l border-white/10 hidden md:table-cell"
                        />
                        <TableSortHeader
                          colSpan={2}
                          label="Poles"
                          columnKey="total_poles"
                          subKeys={["race_poles", "sprint_poles"]}
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                          align="center"
                          className="border-l border-white/10 hidden md:table-cell"
                        />
                        <TableSortHeader
                          rowSpan={2}
                          label="Pts"
                          columnKey="total_points"
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                          align="right"
                        />
                      </tr>
                      <tr className="hidden md:table-row border-b border-white/10 bg-black/30 text-[9px] font-bold tracking-wider uppercase">
                        <TableSubSortHeader
                          label="GP"
                          title="Vitórias GP"
                          columnKey="race_wins"
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                          className="border-l border-white/10"
                        />
                        <TableSubSortHeader
                          label="Spr"
                          title="Vitórias Sprint"
                          columnKey="sprint_wins"
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                          isSprint
                        />
                        <TableSubSortHeader
                          label="GP"
                          title="Pódios GP"
                          columnKey="race_podiums"
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                          className="border-l border-white/10"
                        />
                        <TableSubSortHeader
                          label="Spr"
                          title="Pódios Sprint"
                          columnKey="sprint_podiums"
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                          isSprint
                        />
                        <TableSubSortHeader
                          label="GP"
                          title="Poles GP"
                          columnKey="race_poles"
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                          className="border-l border-white/10"
                        />
                        <TableSubSortHeader
                          label="Spr"
                          title="Poles Sprint"
                          columnKey="sprint_poles"
                          currentSortKey={teamSortKey}
                          currentSortDir={teamSortDir}
                          onSort={handleSortTeam}
                          isSprint
                        />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedTeams.map((team) => {
                        const isExpanded = expandedTeamName === team.team_name;
                        return (
                          <React.Fragment key={team.team_name}>
                            <tr
                              onClick={() => setExpandedTeamName(isExpanded ? null : team.team_name)}
                              className={`group cursor-pointer md:cursor-default transition-colors ${isExpanded ? "bg-white/[0.06] md:bg-transparent" : "hover:bg-white/[0.03]"
                                }`}
                            >
                              <td className="py-2.5 px-2.5 sm:px-3 font-sans max-w-[175px] sm:max-w-none">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: team.team_color }}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                                      <TeamLink
                                        teamName={team.team_name}
                                        className="font-bold text-white text-xs hover:underline decoration-white/30 underline-offset-2 hover:text-white transition-colors block truncate pointer-events-none md:pointer-events-auto"
                                        title={`Ver perfil de ${team.team_name}`}
                                      >
                                        {team.team_name}
                                      </TeamLink>
                                      <span
                                        className={`md:hidden inline-flex h-5 w-5 items-center justify-center rounded-md border shrink-0 transition-all ${isExpanded
                                            ? "border-f1-red/50 bg-f1-red/20 text-f1-red shadow-[0_0_8px_rgba(225,6,0,0.25)]"
                                            : "border-white/15 bg-white/[0.06] text-white/70 group-hover:border-white/30 group-hover:text-white"
                                          }`}
                                        aria-hidden="true"
                                      >
                                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-f1-subtle font-mono block truncate">
                                      {team.first_year}–{team.last_year}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-2.5 px-2 text-center font-bold text-white">
                                {team.total_gps}
                              </td>

                              <td colSpan={2} className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 md:hidden">
                                {team.race_wins > 0 ? (
                                  <span className="text-amber-400">{team.race_wins}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 hidden md:table-cell">
                                {team.race_wins > 0 ? (
                                  <span className="text-amber-400">{team.race_wins}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono font-bold hidden md:table-cell">
                                {team.sprint_wins > 0 ? (
                                  <span className="text-purple-300">{team.sprint_wins}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>

                              <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 hidden md:table-cell">
                                {team.race_podiums > 0 ? (
                                  <span className="text-blue-300">{team.race_podiums}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono font-bold hidden md:table-cell">
                                {team.sprint_podiums > 0 ? (
                                  <span className="text-purple-300">{team.sprint_podiums}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>

                              <td className="py-2.5 px-1.5 text-center font-mono font-bold border-l border-white/5 hidden md:table-cell">
                                {team.race_poles > 0 ? (
                                  <span className="text-purple-300">{team.race_poles}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1.5 text-center font-mono font-bold hidden md:table-cell">
                                {team.sprint_poles > 0 ? (
                                  <span className="text-purple-300">{team.sprint_poles}</span>
                                ) : (
                                  <span className="text-white/20">0</span>
                                )}
                              </td>

                              <td className="py-2.5 px-2.5 sm:px-3 text-right font-black text-white whitespace-nowrap">
                                {team.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="md:hidden bg-[#141420] border-b border-white/10 animate-fadeIn font-sans">
                                <td colSpan={9} className="p-3">
                                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5 text-xs">
                                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                                      <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                        <span className="block text-[9px] text-f1-subtle uppercase font-sans">Vitórias GP/Spr</span>
                                        <span className="text-xs font-black text-white">
                                          {team.race_wins} / <span className="text-purple-300">{team.sprint_wins}</span>
                                        </span>
                                      </div>
                                      <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                        <span className="block text-[9px] text-f1-subtle uppercase font-sans">Pódios GP/Spr</span>
                                        <span className="text-xs font-black text-white">
                                          {team.race_podiums} / <span className="text-purple-300">{team.sprint_podiums}</span>
                                        </span>
                                      </div>
                                      <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                        <span className="block text-[9px] text-f1-subtle uppercase font-sans">Poles GP/Spr</span>
                                        <span className="text-xs font-black text-white">
                                          {team.race_poles} / <span className="text-purple-300">{team.sprint_poles}</span>
                                        </span>
                                      </div>
                                    </div>

                                    <TeamLink
                                      teamName={team.team_name}
                                      className="flex items-center justify-center gap-1.5 w-full py-2.5 min-h-[44px] rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors border border-white/10 active:scale-95"
                                    >
                                      <span>Ver Perfil Completo da Equipe</span>
                                      <ExternalLink className="h-3.5 w-3.5 text-f1-subtle" />
                                    </TeamLink>
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
                  currentPage={teamsPage}
                  totalPages={totalTeamPages}
                  totalItems={teamStats.length}
                  pageSize={TEAMS_PER_PAGE}
                  onPageChange={setTeamsPage}
                  itemName="equipes"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }
