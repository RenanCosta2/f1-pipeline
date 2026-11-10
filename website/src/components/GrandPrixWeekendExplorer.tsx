"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SessionSummary,
  TyreStrategy,
  RacePace,
  LapByLap,
  MaxSpeed,
  IdealLap
} from "@/types/f1";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Gauge,
  Timer,
  Activity,
  Zap,
  Disc,
  LayoutDashboard,
  Flame,
  Flag,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  ArrowUpRight,
  ArrowUpDown,
  ChevronDown,
  ExternalLink,
  Loader2,
  Info
} from "lucide-react";
import TyreStrategyChart from "@/components/TyreStrategyChart";
import RacePaceChart from "@/components/RacePaceChart";
import LapChart from "@/components/LapChart";
import IdealLapCard from "@/components/IdealLapCard";
import DriverLink from "@/lib/driverUtils";
import TeamLink from "@/lib/teamUtils";
import CircuitLink from "@/lib/circuitUtils";
import {
  useTieCarousel,
  TieCarouselEdgeArrows,
  TieCarouselTrack,
  TieCarouselDots,
} from "@/components/ui/TieCarousel";

const MONTHS_LONG_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

function formatFullDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = match[1];
      const monthIdx = parseInt(match[2], 10) - 1;
      const month = MONTHS_LONG_PT[monthIdx] || match[2];
      const day = match[3];
      return `${day} de ${month} de ${year}`;
    }
    const d = new Date(dateStr);
    return `${String(d.getUTCDate()).padStart(2, "0")} de ${MONTHS_LONG_PT[d.getUTCMonth()] || ""} de ${d.getUTCFullYear()}`;
  } catch {
    return String(dateStr);
  }
}

interface GrandPrixWeekendExplorerProps {
  year: number;
  round: number;
  officialEventName: string;
  country: string;
  location: string;
  eventDate: string;
  circuitId?: string;
  circuitName?: string;
  availableSessions: string[];
  activeSession: string;
  sessionResults: SessionSummary[];
  tyreStrategies: TyreStrategy[];
  racePace: RacePace[];
  lapData?: LapByLap[];
  maxSpeed?: MaxSpeed[];
  idealLaps?: IdealLap[];
  raceStatus?: 'Completed' | 'In Progress' | 'Scheduled';
}

const getSessionDisplayName = (sessName?: string | null): string => {
  if (!sessName) return "Sessão";
  const s = sessName.toLowerCase();
  if (s === "practice 1" || s.includes("practice 1")) return "Treino Livre 1";
  if (s === "practice 2" || s.includes("practice 2")) return "Treino Livre 2";
  if (s === "practice 3" || s.includes("practice 3")) return "Treino Livre 3";
  if (s.includes("sprint shootout") || s.includes("sprint qualifying")) return "Qualificação Sprint";
  if (s === "sprint") return "Sprint";
  if (s === "qualifying" || s.includes("qualifying")) return "Qualificação";
  if (s === "race" || s.includes("race")) return "Corrida Principal";
  return sessName;
};

export default function GrandPrixWeekendExplorer({
  year,
  round,
  officialEventName,
  country,
  location,
  eventDate,
  circuitId,
  circuitName,
  availableSessions,
  activeSession,
  sessionResults,
  tyreStrategies,
  racePace,
  lapData = [],
  maxSpeed = [],
  idealLaps = [],
  raceStatus
}: GrandPrixWeekendExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingSession, setPendingSession] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"dashboard" | "ideal" | "table">("table");

  useEffect(() => {
    if (pendingSession && activeSession.toLowerCase() === pendingSession.toLowerCase()) {
      setPendingSession(null);
    }
  }, [activeSession, pendingSession]);

  const changeSession = (newSession: string) => {
    if (newSession.toLowerCase() === activeSession.toLowerCase() || isPending) return;
    setPendingSession(newSession);
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("session", newSession);
      router.push(`/season/round/${round}?${params.toString()}`);
    });
  };

  const isRaceSession = activeSession === "Race" || activeSession === "Sprint";
  const isQualiSession =
    activeSession.toLowerCase().includes("qualifying") ||
    activeSession.toLowerCase().includes("shootout");
  const isPracticeSession = !isRaceSession && !isQualiSession;
  const hasIdealData = Boolean(idealLaps && idealLaps.length > 0);

  const effectiveViewMode = useMemo(() => {
    if (isRaceSession) {
      return viewMode === "dashboard" ? "dashboard" : "table";
    }
    if (isQualiSession) {
      if (viewMode === "ideal" && hasIdealData) return "ideal";
      return "table";
    }
    // Practice or other sessions
    if (viewMode === "ideal" && hasIdealData) return "ideal";
    return "table";
  }, [isRaceSession, isQualiSession, viewMode, hasIdealData]);

  const winner = sessionResults.find(r => r.finishing_position === 1);
  const p2Driver = useMemo(() => {
    return sessionResults.find((r) => Number(r.finishing_position) === 2) || null;
  }, [sessionResults]);

  // Margem da Pole / Disputa P1 vs P2 na Qualificação e Treinos
  const poleMargin = useMemo(() => {
    if (!p2Driver) return null;
    if (p2Driver.gap_to_leader && p2Driver.gap_to_leader !== "—" && p2Driver.gap_to_leader !== "-") {
      return p2Driver.gap_to_leader.startsWith("+") ? p2Driver.gap_to_leader : `+${p2Driver.gap_to_leader}`;
    }
    const parseSec = (t?: string | null) => {
      if (!t) return null;
      const parts = t.split(":");
      if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      }
      return parseFloat(t);
    };
    const t1 = parseSec(winner?.best_lap);
    const t2 = parseSec(p2Driver?.best_lap);
    if (t1 != null && t2 != null && !isNaN(t1) && !isNaN(t2) && t2 >= t1) {
      const diff = t2 - t1;
      return `+${diff.toFixed(3)}s`;
    }
    return null;
  }, [p2Driver, winner]);

  const isFrontRowLockout = Boolean(
    winner &&
    p2Driver &&
    winner.team_name &&
    p2Driver.team_name &&
    winner.team_name.trim().toLowerCase() === p2Driver.team_name.trim().toLowerCase()
  );

  // Segmentos de Qualificação (Q1, Q2, Q3 / SQ1, SQ2, SQ3)
  const isSprintQuali = activeSession.toLowerCase().includes("sprint");
  const qPrefix = isSprintQuali ? "SQ" : "Q";

  const hasQ1 = useMemo(
    () => sessionResults.some((r) => Boolean(r.q1 && r.q1 !== "—" && r.q1 !== "-")),
    [sessionResults]
  );
  const hasQ2 = useMemo(
    () => sessionResults.some((r) => Boolean(r.q2 && r.q2 !== "—" && r.q2 !== "-")),
    [sessionResults]
  );
  const hasQ3 = useMemo(
    () => sessionResults.some((r) => Boolean(r.q3 && r.q3 !== "—" && r.q3 !== "-")),
    [sessionResults]
  );
  const hasQualiSegments = isQualiSession && (hasQ1 || hasQ2 || hasQ3);

  // Volta mais rápida da sessão (Fastest Lap / Purple Lap) considerando todos os Qs
  const { fastestLap, fastestLapSegment, fastestLapDrivers } = useMemo(() => {
    const toSeconds = (s?: string | null) => {
      if (!s || s.trim() === "" || s === "—" || s === "-") return Infinity;
      const parts = s.split(":");
      return parts.length === 2 ? parseFloat(parts[0]) * 60 + parseFloat(parts[1]) : parseFloat(s) || Infinity;
    };

    let minSec = Infinity;
    let bestTime: string | null = null;
    let bestSegment: string | null = null;

    if (hasQualiSegments) {
      sessionResults.forEach((r) => {
        const check = (t: string | null | undefined, seg: string) => {
          const s = toSeconds(t);
          if (s < minSec) {
            minSec = s;
            bestTime = t!;
            bestSegment = seg;
          }
        };
        if (hasQ1 && r.q1) check(r.q1, `${qPrefix}1`);
        if (hasQ2 && r.q2) check(r.q2, `${qPrefix}2`);
        if (hasQ3 && r.q3) check(r.q3, `${qPrefix}3`);
      });
    }

    if (!bestTime || minSec === Infinity) {
      sessionResults.forEach((r) => {
        const s = toSeconds(r.best_lap);
        if (s < minSec && r.best_lap && r.best_lap !== "—" && r.best_lap !== "-") {
          minSec = s;
          bestTime = r.best_lap;
          bestSegment = null;
        }
      });
    }

    if (!bestTime || minSec === Infinity) {
      return { fastestLap: null, fastestLapSegment: null, fastestLapDrivers: [] as SessionSummary[] };
    }

    const matchedDrivers: SessionSummary[] = [];
    sessionResults.forEach((r) => {
      if (hasQualiSegments) {
        if (
          (bestSegment === `${qPrefix}1` && r.q1 === bestTime) ||
          (bestSegment === `${qPrefix}2` && r.q2 === bestTime) ||
          (bestSegment === `${qPrefix}3` && r.q3 === bestTime) ||
          r.best_lap === bestTime
        ) {
          if (!matchedDrivers.some((m) => m.driver_id === r.driver_id)) {
            matchedDrivers.push(r);
          }
        }
      } else if (r.best_lap === bestTime) {
        matchedDrivers.push(r);
      }
    });

    return {
      fastestLap: bestTime,
      fastestLapSegment: bestSegment,
      fastestLapDrivers: matchedDrivers.length > 0 ? matchedDrivers : (winner ? [winner] : []),
    };
  }, [sessionResults, hasQualiSegments, hasQ1, hasQ2, hasQ3, qPrefix, winner]);

  const fastestLapDriver = fastestLapDrivers[0] || null;
  const flCarousel = useTieCarousel(fastestLapDrivers.length);

  // Piloto(s) com maior Speed Trap
  const topSpeedRecords = useMemo(() => {
    if (!maxSpeed || maxSpeed.length === 0) return [];
    const sorted = [...maxSpeed].sort(
      (a, b) => (b.max_speed_trap || 0) - (a.max_speed_trap || 0)
    );
    const maxTrap = sorted[0]?.max_speed_trap;
    if (!maxTrap) return sorted[0] ? [sorted[0]] : [];
    return sorted.filter((s) => s.max_speed_trap === maxTrap);
  }, [maxSpeed]);
  const topSpeedRecord = topSpeedRecords[0] || null;
  const speedCarousel = useTieCarousel(topSpeedRecords.length);

  // Maior(es) escalador(es) de posições (Grid -> Chegada)
  const biggestClimbers = useMemo(() => {
    const eligible = sessionResults.filter(
      (r) => r.delta_position !== null && r.delta_position !== undefined && Number(r.delta_position) > 0
    );
    if (eligible.length === 0) return [];
    const sorted = [...eligible].sort((a, b) => {
      const diff = Number(b.delta_position || 0) - Number(a.delta_position || 0);
      if (diff !== 0) return diff;
      return Number(a.finishing_position || 99) - Number(b.finishing_position || 99);
    });
    const maxDelta = Number(sorted[0].delta_position || 0);
    return sorted.filter((r) => Number(r.delta_position || 0) === maxDelta);
  }, [sessionResults]);
  const biggestClimber = biggestClimbers[0] || null;
  const climberCarousel = useTieCarousel(biggestClimbers.length);

  // Setores absolutos e volta ideal teórica (S1 + S2 + S3)
  const bestSectors = useMemo(() => {
    if (!idealLaps || idealLaps.length === 0) return null;
    let bestS1 = { time: "9:99:999", driver: "", team: "", color: "" };
    let bestS2 = { time: "9:99:999", driver: "", team: "", color: "" };
    let bestS3 = { time: "9:99:999", driver: "", team: "", color: "" };

    idealLaps.forEach((d) => {
      if (d.sector_1 && d.sector_1 < bestS1.time) {
        bestS1 = { time: d.sector_1, driver: d.driver_full_name, team: d.team_name, color: d.team_color || "" };
      }
      if (d.sector_2 && d.sector_2 < bestS2.time) {
        bestS2 = { time: d.sector_2, driver: d.driver_full_name, team: d.team_name, color: d.team_color || "" };
      }
      if (d.sector_3 && d.sector_3 < bestS3.time) {
        bestS3 = { time: d.sector_3, driver: d.driver_full_name, team: d.team_name, color: d.team_color || "" };
      }
    });

    const parseTime = (s: string) => {
      if (!s || s === "9:99:999") return 0;
      const parts = s.trim().replace(",", ".").split(":");
      if (parts.length === 3) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + parseInt(parts[2], 10) / 1000;
      }
      if (parts.length === 2) {
        return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
      }
      return parseFloat(s) || 0;
    };

    const formatSeconds = (sec: number) => {
      if (!sec || isNaN(sec) || sec <= 0) return "—";
      const m = Math.floor(sec / 60);
      const rem = sec - m * 60;
      const s = Math.floor(rem);
      const ms = Math.round((rem - s) * 1000);
      return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
    };

    const s1Sec = parseTime(bestS1.time);
    const s2Sec = parseTime(bestS2.time);
    const s3Sec = parseTime(bestS3.time);
    const totalSec = s1Sec + s2Sec + s3Sec;
    const theoreticalLap = totalSec > 0 ? formatSeconds(totalSec) : null;

    return {
      bestS1,
      bestS2,
      bestS3,
      theoreticalLap
    };
  }, [idealLaps]);

  const totalLaps = useMemo(() => {
    return winner?.laps_completed
      ? Number(winner.laps_completed)
      : Math.max(...sessionResults.map((r) => Number(r.laps_completed) || 0), 1);
  }, [winner, sessionResults]);

  // Média de paradas de box dos pilotos classificados
  const avgPitStops = useMemo(() => {
    const validStops = sessionResults
      .filter((r) => r.stops != null && r.stops >= 0)
      .map((r) => r.stops!);
    if (validStops.length === 0) return 0;
    const sum = validStops.reduce((a, b) => a + b, 0);
    return (sum / validStops.length).toFixed(1);
  }, [sessionResults]);

  const finishedCount = sessionResults.filter(
    (r) => !r.status || r.status.toLowerCase().includes("finish") || r.status.startsWith("+")
  ).length;

  const hasLapData = lapData && lapData.length > 0;
  const hasMaxSpeed = maxSpeed && maxSpeed.length > 0;
  const hasRacePace = racePace && racePace.length > 0;
  const hasTyres = tyreStrategies && tyreStrategies.length > 0;
  const [mobileChartTab, setMobileChartTab] = useState<"laps" | "pace" | "tyres">("laps");
  const [expandedDriverRow, setExpandedDriverRow] = useState<string | number | null>(null);

  type SortField = "pos" | "driver" | "q1" | "q2" | "q3" | "time" | "gap" | "points";
  type SortDirection = "asc" | "desc";

  const [sortField, setSortField] = useState<SortField>("pos");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Segmento ativo no Mobile ("final" | "q1" | "q2" | "q3")
  const [mobileQualiSegment, setMobileQualiSegment] = useState<"final" | "q1" | "q2" | "q3">("final");

  // Melhores voltas em cada segmento para destaque púrpura (purple sector/lap)
  const bestQ1Time = useMemo(() => {
    if (!hasQ1) return null;
    const toSec = (s?: string | null) => {
      if (!s || s === "—" || s === "-") return Infinity;
      const parts = s.split(":");
      return parts.length === 2 ? parseFloat(parts[0]) * 60 + parseFloat(parts[1]) : parseFloat(s) || Infinity;
    };
    let min = Infinity;
    let best: string | null = null;
    sessionResults.forEach((r) => {
      const s = toSec(r.q1);
      if (s < min && r.q1) {
        min = s;
        best = r.q1;
      }
    });
    return best;
  }, [sessionResults, hasQ1]);

  const bestQ2Time = useMemo(() => {
    if (!hasQ2) return null;
    const toSec = (s?: string | null) => {
      if (!s || s === "—" || s === "-") return Infinity;
      const parts = s.split(":");
      return parts.length === 2 ? parseFloat(parts[0]) * 60 + parseFloat(parts[1]) : parseFloat(s) || Infinity;
    };
    let min = Infinity;
    let best: string | null = null;
    sessionResults.forEach((r) => {
      const s = toSec(r.q2);
      if (s < min && r.q2) {
        min = s;
        best = r.q2;
      }
    });
    return best;
  }, [sessionResults, hasQ2]);

  const bestQ3Time = useMemo(() => {
    if (!hasQ3) return null;
    const toSec = (s?: string | null) => {
      if (!s || s === "—" || s === "-") return Infinity;
      const parts = s.split(":");
      return parts.length === 2 ? parseFloat(parts[0]) * 60 + parseFloat(parts[1]) : parseFloat(s) || Infinity;
    };
    let min = Infinity;
    let best: string | null = null;
    sessionResults.forEach((r) => {
      const s = toSec(r.q3);
      if (s < min && r.q3) {
        min = s;
        best = r.q3;
      }
    });
    return best;
  }, [sessionResults, hasQ3]);

  const availableMobileSegments = useMemo(() => {
    const list: Array<"final" | "q1" | "q2" | "q3"> = [];
    if (hasQ1) list.push("q1");
    if (hasQ2) list.push("q2");
    if (hasQ3) list.push("q3");
    list.push("final");
    return list;
  }, [hasQ1, hasQ2, hasQ3]);

  // Handler de ordenação interativa (Desktop)
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Ao alternar sessões, resetar ordenação e segmento
  useEffect(() => {
    setMobileQualiSegment("final");
    setSortField("pos");
    setSortDirection("asc");
  }, [activeSession]);

  // Função para alternar segmento mobile E já ordenar automaticamente por aquele Q
  const selectMobileSegment = (seg: "final" | "q1" | "q2" | "q3") => {
    setMobileQualiSegment(seg);
    if (seg === "final") {
      setSortField("pos");
    } else {
      setSortField(seg);
    }
    setSortDirection("asc");
  };

  const cycleMobileSegment = () => {
    if (availableMobileSegments.length === 0) return;
    const idx = availableMobileSegments.indexOf(mobileQualiSegment);
    const nextIdx = (idx + 1) % availableMobileSegments.length;
    selectMobileSegment(availableMobileSegments[nextIdx]);
  };

  const toSecHelper = (s?: string | null) => {
    if (!s || s.trim() === "" || s === "—" || s === "-") return Infinity;
    const parts = s.split(":");
    return parts.length === 2 ? parseFloat(parts[0]) * 60 + parseFloat(parts[1]) : parseFloat(s) || Infinity;
  };

  const getSegmentGap = (driverTime?: string | null, leaderTime?: string | null) => {
    if (!driverTime || driverTime === "—" || driverTime === "-") return "—";
    if (!leaderTime || leaderTime === "—" || leaderTime === "-") return "—";
    const secD = toSecHelper(driverTime);
    const secL = toSecHelper(leaderTime);
    if (secD === Infinity || secL === Infinity) return "—";
    const diff = secD - secL;
    if (Math.abs(diff) < 0.0005) return "Líder";
    return `+${diff.toFixed(3)}s`;
  };

  const sortedSessionResults = useMemo(() => {
    const list = [...sessionResults];

    list.sort((a, b) => {
      if (sortField === "q1" || sortField === "q2" || sortField === "q3") {
        const timeA = a[sortField];
        const timeB = b[sortField];
        const secA = toSecHelper(timeA);
        const secB = toSecHelper(timeB);

        const hasTimeA = secA < Infinity;
        const hasTimeB = secB < Infinity;

        if (hasTimeA && hasTimeB) {
          return sortDirection === "asc" ? secA - secB : secB - secA;
        }
        if (hasTimeA && !hasTimeB) return -1;
        if (!hasTimeA && hasTimeB) return 1;

        return (a.finishing_position ?? 99) - (b.finishing_position ?? 99);
      }

      if (sortField === "time") {
        const secA = toSecHelper(a.best_lap);
        const secB = toSecHelper(b.best_lap);
        const hasTimeA = secA < Infinity;
        const hasTimeB = secB < Infinity;
        if (hasTimeA && hasTimeB) {
          return sortDirection === "asc" ? secA - secB : secB - secA;
        }
        if (hasTimeA && !hasTimeB) return -1;
        if (!hasTimeA && hasTimeB) return 1;
        return (a.finishing_position ?? 99) - (b.finishing_position ?? 99);
      }

      if (sortField === "gap") {
        const secA = toSecHelper(a.gap_to_leader);
        const secB = toSecHelper(b.gap_to_leader);
        if (secA !== secB) {
          return sortDirection === "asc" ? secA - secB : secB - secA;
        }
        return (a.finishing_position ?? 99) - (b.finishing_position ?? 99);
      }

      if (sortField === "driver") {
        const comp = a.driver_full_name.localeCompare(b.driver_full_name);
        return sortDirection === "asc" ? comp : -comp;
      }

      if (sortField === "points") {
        const ptsA = a.points ?? 0;
        const ptsB = b.points ?? 0;
        if (ptsA !== ptsB) {
          return sortDirection === "asc" ? ptsA - ptsB : ptsB - ptsA;
        }
        return (a.finishing_position ?? 99) - (b.finishing_position ?? 99);
      }

      // Default: "pos" (posição final / grid)
      const posA = a.finishing_position ?? 99;
      const posB = b.finishing_position ?? 99;
      return sortDirection === "asc" ? posA - posB : posB - posA;
    });

    return list;
  }, [sessionResults, sortField, sortDirection]);

  return (
    <div className="space-y-6">
      {/* Botão Voltar com alvo tátil mínimo de 44px */}
      <div>
        <Link
          href={`/season?year=${year}&tab=races`}
          className="inline-flex items-center gap-2 min-h-[44px] py-2 text-xs font-bold uppercase tracking-wider text-f1-subtle hover:text-white transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Lista de Grandes Prêmios ({year})
        </Link>
      </div>

      {/* Hero Header do Grande Prêmio */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#12121A] to-[#0A0A0F] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-f1-red px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-wider text-white">
                Round {String(round).padStart(2, "0")}
              </span>
              {raceStatus === "In Progress" ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GP em Andamento
                </span>
              ) : (
                <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-gray-300">
                  {raceStatus === "Completed" ? "GP Finalizado" : `F1 ${year}`}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              {officialEventName || `${country} Grand Prix`}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-f1-subtle pt-1">
              <CircuitLink
                circuitId={circuitId}
                circuitName={circuitName || location}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90 hover:text-white transition-all group"
                title={`Ver perfil e traçado do circuito ${circuitName || location}`}
              >
                <MapPin className="h-3.5 w-3.5 text-f1-red shrink-0" />
                <span>{location ? `${location}, ${country}` : country}</span>
                <ArrowUpRight className="h-3 w-3 text-f1-subtle group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </CircuitLink>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                {formatFullDate(eventDate)}
              </span>
            </div>
          </div>

          {/* Destaque do Vencedor / Líder */}
          {winner && (
            <div
              className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-black/40 p-3.5 sm:p-4 backdrop-blur-sm w-full md:w-auto self-stretch md:self-auto min-w-0 md:min-w-[260px] hover:border-white/25 transition-all"
            >
              <DriverLink
                driverId={winner.driver_id}
                driverName={winner.driver_full_name}
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
                style={{ borderColor: winner.team_color || "#E10600" }}
                title={`Ver perfil de ${winner.driver_full_name}`}
              >
                {winner.driver_headshot_url ? (
                  <img
                    src={winner.driver_headshot_url}
                    alt={winner.driver_full_name}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <span className="font-mono text-xs font-black text-white">
                    {winner.driver_full_name.slice(0, 3).toUpperCase()}
                  </span>
                )}
              </DriverLink>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-f1-subtle">
                    {activeSession === "Race" ? "Vencedor da Prova" : activeSession === "Sprint" ? "Vencedor da Sprint" : "Líder da Sessão"}
                  </span>
                  <DriverLink
                    driverId={winner.driver_id}
                    driverName={winner.driver_full_name}
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white/60 hover:text-white transition-colors group"
                    title={`Ver perfil completo de ${winner.driver_full_name}`}
                  >
                    <span>Perfil</span>
                    <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </DriverLink>
                </div>
                <DriverLink
                  driverId={winner.driver_id}
                  driverName={winner.driver_full_name}
                  className="block truncate text-sm font-black text-white hover:text-f1-red transition-colors"
                  title={`Ver perfil de ${winner.driver_full_name}`}
                >
                  {winner.driver_full_name}
                </DriverLink>
                <TeamLink
                  teamId={winner.team_id}
                  teamName={winner.team_name}
                  className="block truncate text-xs font-medium hover:underline decoration-white/30 transition-colors"
                  style={{ color: winner.team_color || "#E10600" }}
                  title={`Ver perfil de ${winner.team_name}`}
                >
                  {winner.team_name}
                </TeamLink>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seletor de Sessões do Fim de Semana (TL1, TL2, TL3, Quali, Sprint, Corrida) */}
      {/* No mobile: grid flexível que distribui todas as sessões do final de semana em 1 ou 2 linhas sem cortar; sm+: flex com rótulo */}
      <div className="border-b border-white/10 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-f1-subtle shrink-0 hidden sm:inline mr-1">
            Sessão:
          </span>
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:flex sm:flex-wrap items-center gap-1.5 w-full">
            {availableSessions.map((session) => {
              const isSelected = session === activeSession;
              const isTargetPending = isPending && pendingSession === session;
              return (
                <button
                  key={session}
                  onClick={() => changeSession(session)}
                  disabled={isPending}
                  className={`rounded-lg px-2 sm:px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 ${isTargetPending
                    ? "bg-f1-red/90 text-white shadow-lg shadow-f1-red/40 ring-2 ring-f1-red animate-pulse"
                    : isSelected && !isPending
                      ? "bg-f1-red text-white shadow-md shadow-f1-red/30"
                      : "border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white disabled:opacity-60"
                    }`}
                >
                  {isTargetPending && (
                    <Loader2 className="h-3 w-3 animate-spin text-white shrink-0" />
                  )}
                  {/* Abreviações no Mobile (< sm) para caber perfeitamente na tela */}
                  <span className="sm:hidden">
                    {session === "Practice 1" && "TL1"}
                    {session === "Practice 2" && "TL2"}
                    {session === "Practice 3" && "TL3"}
                    {session === "Sprint Shootout" && "Q. Sprint"}
                    {session === "Sprint Qualifying" && "Q. Sprint"}
                    {session === "Sprint" && "Sprint"}
                    {session === "Qualifying" && "Quali"}
                    {session === "Race" && "Corrida"}
                    {!["Practice 1", "Practice 2", "Practice 3", "Sprint Shootout", "Sprint Qualifying", "Qualifying", "Sprint", "Race"].includes(session) && session}
                  </span>

                  {/* Nome Completo no Desktop (sm+) */}
                  <span className="hidden sm:inline">
                    {session === "Practice 1" && "Treino Livre 1"}
                    {session === "Practice 2" && "Treino Livre 2"}
                    {session === "Practice 3" && "Treino Livre 3"}
                    {session === "Sprint Shootout" && "Qualificação Sprint"}
                    {session === "Sprint Qualifying" && "Qualificação Sprint"}
                    {session === "Sprint" && "Sprint"}
                    {session === "Qualifying" && "Qualificação"}
                    {session === "Race" && "Corrida"}
                    {!["Practice 1", "Practice 2", "Practice 3", "Sprint Shootout", "Sprint Qualifying", "Qualifying", "Sprint", "Race"].includes(session) && session}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTEÚDO DA SESSÃO OU TELA DE CARREGAMENTO (ESTADO PENDENTE)              */}
      {/* ========================================================================= */}
      {isPending ? (
        <div className="space-y-6 animate-fadeIn py-2">
          {/* Status Banner de Carregamento da Sessão */}
          <div className="rounded-2xl border border-white/10 bg-[#12121A]/95 p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-xl min-h-[160px]">
            <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-f1-red/15 border border-f1-red/30 shadow-lg shadow-f1-red/20">
              <Loader2 className="h-6 w-6 animate-spin text-f1-red" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Carregando {getSessionDisplayName(pendingSession)}...
              </h3>
              <p className="text-xs text-f1-subtle max-w-md">
                Sincronizando classificação oficial, voltas rápidas, ritmo de prova e dados de telemetria.
              </p>
            </div>
          </div>

          {/* Skeleton Bento Grid Superior (4 Cards KPI) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-[#12121A] p-4 space-y-3">
                <div className="h-3 w-20 rounded bg-white/10" />
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white/10 shrink-0" />
                  <div className="space-y-1 flex-1">
                    <div className="h-4 w-24 rounded bg-white/15" />
                    <div className="h-2.5 w-16 rounded bg-white/5" />
                  </div>
                </div>
                <div className="h-3 w-14 rounded bg-white/5" />
              </div>
            ))}
          </div>

          {/* Skeleton Tabela / Gráficos de Telemetria */}
          <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5 sm:p-6 space-y-4 animate-pulse">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="space-y-1.5">
                <div className="h-4 w-36 rounded bg-white/15" />
                <div className="h-3 w-56 rounded bg-white/5" />
              </div>
              <div className="h-8 w-28 rounded-xl bg-white/10" />
            </div>

            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between px-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-6 rounded bg-white/10" />
                    <div className="h-7 w-7 rounded-full bg-white/10" />
                    <div className="h-3.5 w-28 rounded bg-white/15" />
                  </div>
                  <div className="h-3.5 w-20 rounded bg-white/10 hidden sm:block" />
                  <div className="h-3.5 w-16 rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* LINHA 1: 4 CARDS KPI DE ALTO IMPACTO (BENTO GRID SUPERIOR)                 */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {/* Card 1: Vencedor / Pole Position / Líder */}
            <div className="rounded-xl border border-white/10 bg-[#111118] p-2.5 sm:p-4 flex items-center justify-between">
              <div className="min-w-0 pr-1 sm:pr-2">
                <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400 block truncate">
                  {isRaceSession ? "Vencedor (P1)" : isQualiSession ? "Pole (P1)" : "Líder (P1)"}
                </span>
                {winner ? (
                  <DriverLink driverId={winner.driver_id} driverName={winner.driver_full_name} className="group/wlink block">
                    <h4 className="text-xs sm:text-sm font-black text-white truncate mt-0.5 group-hover/wlink:text-f1-red transition-colors">
                      <span className="sm:hidden">{winner.driver_full_name.split(" ").slice(-1)[0]}</span>
                      <span className="hidden sm:inline">{winner.driver_full_name}</span>
                    </h4>
                  </DriverLink>
                ) : (
                  <h4 className="text-xs sm:text-sm font-black text-white truncate mt-0.5">—</h4>
                )}
                <p className="text-[10px] sm:text-[11px] text-f1-subtle truncate" style={{ color: winner?.team_color || undefined }}>
                  {winner?.team_name || "—"}
                </p>
                {isRaceSession && winner?.points ? (
                  <span className="inline-block mt-1 sm:mt-2 font-mono text-[10px] sm:text-[11px] font-bold text-emerald-400">
                    +{winner.points} pts
                  </span>
                ) : winner?.best_lap ? (
                  <span className="inline-block mt-1 sm:mt-2 font-mono text-[10px] sm:text-[11px] font-bold text-purple-300">
                    {winner.best_lap}
                  </span>
                ) : null}
              </div>

              {winner ? (
                <DriverLink
                  driverId={winner.driver_id}
                  driverName={winner.driver_full_name}
                  className="relative flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
                  style={{ borderColor: winner.team_color || "#E10600" }}
                  title={`Ver perfil de ${winner.driver_full_name}`}
                >
                  {winner.driver_headshot_url ? (
                    <img
                      src={winner.driver_headshot_url}
                      alt={winner.driver_full_name}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <span className="font-mono text-[10px] sm:text-xs font-bold text-white">
                      {winner.driver_full_name.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                </DriverLink>
              ) : (
                <div
                  className="relative flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5"
                  style={{ borderColor: "#E10600" }}
                >
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-white">P1</span>
                </div>
              )}
            </div>

            {/* Card 2: Volta Mais Rápida (Purple Lap) */}
            <div
              className="relative rounded-xl border border-purple-500/30 bg-[#13111E] p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden"
              onMouseEnter={flCarousel.pause}
              onMouseLeave={flCarousel.resume}
            >
              <TieCarouselEdgeArrows carousel={flCarousel} accent="purple" size="xs" position="metric" />
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1 sm:gap-1.5 truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                  <span className="sm:hidden">Volta Rápida</span>
                  <span className="hidden sm:inline">Volta Mais Rápida</span>
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] font-bold text-purple-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 shrink-0">
                  {fastestLapSegment ? `FL • ${fastestLapSegment}` : "FL"}
                </span>
              </div>

              <div className={`flex items-baseline justify-between gap-2 mt-0.5 sm:mt-1 ${flCarousel.isTied ? "px-2.5" : ""}`}>
                <div className="flex items-baseline gap-1.5 truncate">
                  <span className="font-mono text-xs sm:text-base font-black text-white tracking-tight">
                    {fastestLap || "—"}
                  </span>
                  {fastestLapSegment && (
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-purple-400">
                      ({fastestLapSegment})
                    </span>
                  )}
                </div>
                <TieCarouselDots carousel={flCarousel} accent="purple" />
              </div>

              {fastestLapDrivers.length > 0 ? (
                <TieCarouselTrack
                  carousel={flCarousel}
                  items={fastestLapDrivers}
                  renderItem={(d) => (
                    <div className="flex items-center justify-between gap-2 mt-0.5 sm:mt-1">
                      <div className="min-w-0 pr-1 sm:pr-2">
                        <DriverLink driverId={d.driver_id} driverName={d.driver_full_name} className="block">
                          <p className="text-[11px] sm:text-xs text-white hover:text-purple-300 transition-colors truncate mt-0.5 font-bold">
                            {d.driver_full_name}
                          </p>
                        </DriverLink>
                        {d.team_name ? (
                          <TeamLink
                            teamName={d.team_name}
                            className="text-[9px] sm:text-[10px] text-purple-300/80 font-mono hover:text-white hover:underline transition-colors block truncate"
                            title={`Ver perfil de ${d.team_name}`}
                          >
                            {d.team_name}
                          </TeamLink>
                        ) : null}
                      </div>

                      <DriverLink
                        driverId={d.driver_id}
                        driverName={d.driver_full_name}
                        className="relative flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
                        style={{ borderColor: d.team_color || "#A855F7" }}
                        title={`Ver perfil de ${d.driver_full_name}`}
                      >
                        {d.driver_headshot_url ? (
                          <img
                            src={d.driver_headshot_url}
                            alt={d.driver_full_name}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <span className="font-mono text-[9px] sm:text-[10px] font-bold text-purple-300">
                            {d.driver_full_name.slice(0, 3).toUpperCase()}
                          </span>
                        )}
                      </DriverLink>
                    </div>
                  )}
                />
              ) : (
                <p className="text-[10px] sm:text-[11px] text-f1-subtle truncate mt-0.5">—</p>
              )}
            </div>

            {/* Card 3: Speed Trap (Corrida) ou Volta Ideal Teórica (Quali/Treino) ou Pilotos no Grid */}
            {isRaceSession ? (
              <div
                className="relative rounded-xl border border-amber-500/30 bg-[#14120C] p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden"
                onMouseEnter={speedCarousel.pause}
                onMouseLeave={speedCarousel.resume}
              >
                <TieCarouselEdgeArrows carousel={speedCarousel} accent="amber" size="xs" position="metric" />
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 sm:gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="sm:hidden">Speed Trap</span>
                    <span className="hidden sm:inline">Speed Trap Máximo</span>
                  </span>
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
                    TRAP
                  </span>
                </div>

                <div className={`flex items-baseline justify-between gap-2 mt-0.5 sm:mt-1 ${speedCarousel.isTied ? "px-2.5" : ""}`}>
                  <div className="font-mono text-xs sm:text-base font-black text-white tracking-tight truncate">
                    {topSpeedRecord?.max_speed_trap ? `${Number(topSpeedRecord.max_speed_trap).toFixed(1)} km/h` : "—"}
                  </div>
                  <TieCarouselDots carousel={speedCarousel} accent="amber" />
                </div>

                {topSpeedRecords.length > 0 ? (
                  <TieCarouselTrack
                    carousel={speedCarousel}
                    items={topSpeedRecords}
                    renderItem={(rec) => (
                      <div className="flex items-center justify-between gap-2 mt-0.5 sm:mt-1">
                        <div className="min-w-0 pr-1 sm:pr-2">
                          <DriverLink driverId={rec.driver_id} driverName={rec.driver_full_name} className="block">
                            <p className="text-[11px] sm:text-xs text-white hover:text-amber-300 transition-colors truncate mt-0.5 font-bold">
                              {rec.driver_full_name}
                            </p>
                          </DriverLink>
                          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 text-[9px] sm:text-[10px] text-amber-400/80 font-mono truncate">
                            {rec.team_name ? (
                              <TeamLink
                                teamName={rec.team_name}
                                className="hover:text-white hover:underline transition-colors truncate"
                                title={`Ver perfil de ${rec.team_name}`}
                              >
                                {rec.team_name}
                              </TeamLink>
                            ) : null}
                          </div>
                        </div>

                        <DriverLink
                          driverId={rec.driver_id}
                          driverName={rec.driver_full_name}
                          className="relative flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
                          style={{ borderColor: rec.team_color || "#F59E0B" }}
                          title={`Ver perfil de ${rec.driver_full_name}`}
                        >
                          {rec.driver_headshot_url ? (
                            <img
                              src={rec.driver_headshot_url}
                              alt={rec.driver_full_name}
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <span className="font-mono text-[9px] sm:text-[10px] font-bold text-amber-400">
                              {rec.driver_full_name.slice(0, 3).toUpperCase()}
                            </span>
                          )}
                        </DriverLink>
                      </div>
                    )}
                  />
                ) : (
                  <p className="text-[10px] sm:text-[11px] text-f1-subtle truncate mt-0.5">—</p>
                )}
              </div>
            ) : bestSectors?.theoreticalLap ? (
              <div className="rounded-xl border border-purple-500/30 bg-[#13111E] p-2.5 sm:p-4 flex items-center justify-between">
                <div className="min-w-0 pr-1 sm:pr-2">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1 sm:gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span className="sm:hidden">Volta Ideal</span>
                    <span className="hidden sm:inline">Volta Ideal Teórica</span>
                  </span>
                  <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1 tracking-tight truncate">
                    {bestSectors.theoreticalLap}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-purple-300/80 truncate mt-0.5 font-mono">
                    S1 + S2 + S3
                  </p>
                </div>

                <span className="font-mono text-[10px] sm:text-xs font-bold text-purple-400 uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-purple-500/10 border border-purple-500/20 shrink-0">
                  IDEAL
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#111118] p-2.5 sm:p-4 flex items-center justify-between">
                <div className="min-w-0 pr-1 sm:pr-2">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 block truncate">
                    Grid
                  </span>
                  <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1">
                    {sessionResults.length} pilotos
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-f1-subtle mt-0.5 truncate">
                    Classificados
                  </p>
                </div>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-white/5 border border-white/10 shrink-0">
                  GRID
                </span>
              </div>
            )}

            {/* Card 4: Maior Escalador (Corrida) ou Eficiência Teórica (Quali/Treino) ou Resumo */}
            {isRaceSession && biggestClimber ? (
              <div
                className={`relative rounded-xl border border-emerald-500/30 bg-[#101716] py-2.5 sm:py-4 flex flex-col justify-between overflow-hidden ${climberCarousel.isTied ? "px-4.5 sm:px-5" : "px-2.5 sm:px-4"
                  }`}
                onMouseEnter={climberCarousel.pause}
                onMouseLeave={climberCarousel.resume}
              >
                <TieCarouselEdgeArrows carousel={climberCarousel} accent="emerald" size="xs" />
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1 sm:gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="sm:hidden">Escalador</span>
                    <span className="hidden sm:inline">Maior Escalador</span>
                  </span>
                  <TieCarouselDots carousel={climberCarousel} accent="emerald" />
                </div>

                <TieCarouselTrack
                  carousel={climberCarousel}
                  items={biggestClimbers}
                  renderItem={(climber) => (
                    <div className="flex items-center justify-between gap-2 mt-0.5 sm:mt-1">
                      <div className="min-w-0 pr-1 sm:pr-2">
                        <div className="font-mono text-xs sm:text-base font-black text-white tracking-tight flex items-baseline gap-1 truncate">
                          <span className="text-emerald-400">+{climber.delta_position}</span>
                          <span className="text-[10px] sm:text-xs text-f1-subtle font-mono truncate">
                            (P{climber.grid_position}➔P{climber.finishing_position})
                          </span>
                        </div>
                        <DriverLink driverId={climber.driver_id} driverName={climber.driver_full_name} className="block">
                          <p className="text-[11px] sm:text-xs text-white hover:text-emerald-300 transition-colors truncate font-bold mt-0.5">
                            {climber.driver_full_name}
                          </p>
                        </DriverLink>
                        {climber.team_name ? (
                          <TeamLink
                            teamName={climber.team_name}
                            className="text-[9px] sm:text-[10px] font-mono block truncate hover:text-white hover:underline transition-colors"
                            style={{ color: climber.team_color || undefined }}
                            title={`Ver perfil de ${climber.team_name}`}
                          >
                            {climber.team_name}
                          </TeamLink>
                        ) : null}
                      </div>

                      <DriverLink
                        driverId={climber.driver_id}
                        driverName={climber.driver_full_name}
                        className="relative flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
                        style={{ borderColor: climber.team_color || "#10B981" }}
                        title={`Ver perfil de ${climber.driver_full_name}`}
                      >
                        {climber.driver_headshot_url ? (
                          <img
                            src={climber.driver_headshot_url}
                            alt={climber.driver_full_name}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <span className="font-mono text-[9px] sm:text-xs font-bold text-emerald-400">
                            +{climber.delta_position}
                          </span>
                        )}
                      </DriverLink>
                    </div>
                  )}
                />
              </div>
            ) : p2Driver ? (
              <div className="rounded-xl border border-sky-500/30 bg-[#0E1520] p-2.5 sm:p-4 flex items-center justify-between">
                <div className="min-w-0 pr-1 sm:pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1 sm:gap-1.5 truncate">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                      {isQualiSession ? "Margem da Pole" : "Margem P2"}
                    </span>
                    {isQualiSession && isFrontRowLockout && (
                      <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.2 rounded shrink-0">
                        Lockout
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1 tracking-tight flex items-baseline gap-1.5 truncate">
                    <span className="text-sky-400 font-mono">{poleMargin || p2Driver.gap_to_leader || "—"}</span>
                    <span className="text-[10px] sm:text-xs text-f1-subtle font-mono truncate">
                      {isQualiSession ? "(P2 • 1ª Fila)" : "(vs P1)"}
                    </span>
                  </div>
                  <DriverLink driverId={p2Driver.driver_id} driverName={p2Driver.driver_full_name} className="block">
                    <p className="text-[11px] sm:text-xs text-white hover:text-sky-300 transition-colors truncate mt-0.5 font-bold">
                      <span className="sm:hidden">{p2Driver.driver_full_name.split(" ").slice(-1)[0]}</span>
                      <span className="hidden sm:inline">{p2Driver.driver_full_name}</span>
                    </p>
                  </DriverLink>
                  <p className="text-[9px] sm:text-[10px] text-f1-subtle font-mono truncate" style={{ color: p2Driver.team_color || undefined }}>
                    {p2Driver.team_name}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold text-sky-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                    {isQualiSession ? "1ª FILA" : "P2 GAP"}
                  </span>
                  <DriverLink
                    driverId={p2Driver.driver_id}
                    driverName={p2Driver.driver_full_name}
                    className="relative flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
                    style={{ borderColor: p2Driver.team_color || "#0EA5E9" }}
                    title={`Ver perfil de ${p2Driver.driver_full_name}`}
                  >
                    {p2Driver.driver_headshot_url ? (
                      <img
                        src={p2Driver.driver_headshot_url}
                        alt={p2Driver.driver_full_name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <span className="font-mono text-[9px] sm:text-xs font-bold text-sky-400">P2</span>
                    )}
                  </DriverLink>
                </div>
              </div>
            ) : isPracticeSession ? (
              <div className="rounded-xl border border-white/10 bg-[#111118] p-2.5 sm:p-4 flex items-center justify-between">
                <div className="min-w-0 pr-1 sm:pr-2">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-sky-400 block truncate">
                    Pilotos no Treino
                  </span>
                  <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1">
                    {sessionResults.length} pilotos
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-f1-subtle mt-0.5 truncate">
                    Tempos cronometrados
                  </p>
                </div>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-sky-400 uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-white/5 border border-white/10 shrink-0">
                  FP
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#111118] p-2.5 sm:p-4 flex items-center justify-between">
                <div className="min-w-0 pr-1 sm:pr-2">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 block truncate">
                    Resumo da Prova
                  </span>
                  <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1">
                    {totalLaps} voltas
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-f1-subtle mt-0.5 font-mono">
                    <span>{finishedCount} finalizados</span>
                    {isRaceSession && <span>• {avgPitStops} pits médios</span>}
                  </div>
                </div>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-white/5 border border-white/10 shrink-0">
                  RACE
                </span>
              </div>
            )}
          </div>

          {/* Barra de Alternância de Abas: Dashboard Analítico vs Volta Ideal vs Tabela FIA */}
          <div className="flex items-center justify-between border-b border-white/10 gap-4 sm:gap-6 overflow-x-auto sm:overflow-x-visible no-scrollbar scrollbar-none">
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Classificação Oficial sempre disponível em 1º lugar à esquerda */}
              <button
                onClick={() => setViewMode("table")}
                className={`min-h-[44px] pb-2.5 pt-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 border-b-2 -mb-[1px] active:scale-95 ${effectiveViewMode === "table"
                  ? "border-f1-red text-white"
                  : "border-transparent text-f1-subtle hover:text-white"
                  }`}
              >
                <span>Classificação Oficial</span>
                <span className="font-mono text-[11px] text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  {sessionResults.length}
                </span>
              </button>

              {/* Se Corrida / Sprint: Dashboard Analítico posicionado à direita da Classificação */}
              {isRaceSession && (
                <button
                  onClick={() => setViewMode("dashboard")}
                  className={`min-h-[44px] pb-2.5 pt-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 border-b-2 -mb-[1px] active:scale-95 ${effectiveViewMode === "dashboard"
                    ? "border-f1-red text-white"
                    : "border-transparent text-f1-subtle hover:text-white"
                    }`}
                >
                  <span>Dashboard Analítico</span>
                </button>
              )}

              {/* Se Qualificação (ou sessão com volta ideal): Volta Ideal Teórica */}
              {(isQualiSession || (!isRaceSession && hasIdealData)) && (
                <button
                  onClick={() => setViewMode("ideal")}
                  className={`min-h-[44px] pb-2.5 pt-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 border-b-2 -mb-[1px] active:scale-95 ${effectiveViewMode === "ideal"
                    ? "border-f1-red text-white"
                    : "border-transparent text-f1-subtle hover:text-white"
                    }`}
                >
                  <span>Volta Ideal Teórica</span>
                  {idealLaps.length > 0 && (
                    <span className="font-mono text-[11px] text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      {idealLaps.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-f1-subtle shrink-0">
              <span>Modo:</span>
              <span className="text-white font-bold uppercase">
                {effectiveViewMode === "dashboard"
                  ? "Telemetria & Estratégia"
                  : effectiveViewMode === "ideal"
                    ? "Volta Ideal FIA"
                    : "Tabela Oficial FIA"}
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTEÚDO DA ABA 1: DASHBOARD ANALÍTICO (SOMENTE CORRIDA E SPRINT)         */}
          {/* ========================================================================= */}
          {effectiveViewMode === "dashboard" && isRaceSession && (
            <div className="space-y-5 sm:space-y-6 animate-fadeIn">
              {/* Banner informativo quando a sessão não possui telemetria detalhada */}
              {!hasLapData && !hasRacePace && !hasTyres && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs text-zinc-300">
                    <p className="font-bold text-white">
                      {year < 1996
                        ? `Temporada Histórica (${year}): Telemetria digital detalhada não existia nesta época`
                        : "Telemetria analítica detalhada não registrada para esta sessão"}
                    </p>
                    <p className="text-f1-subtle leading-relaxed">
                      {year < 1996
                        ? "Os dados de telemetria volta a volta, ritmo em ar limpo e stints de pneus foram introduzidos nas eras modernas da Fórmula 1. Consulte a aba Classificação Oficial para conferir as posições de chegada, voltas completadas, pontos e tempos oficiais da época."
                        : "Esta sessão não possui registros de telemetria volta a volta ou stints de pneus em nossos dados. Consulte a aba Classificação Oficial para os resultados oficiais completos."}
                    </p>
                  </div>
                </div>
              )}

              {/* Sub-abas Mobile (< lg): Alterna entre os 3 gráficos sem empilhar 3 painéis gigantes */}
              <div className="grid grid-cols-3 lg:hidden rounded-xl border border-white/10 bg-[#12121A] p-1 shadow-lg">
                <button
                  onClick={() => setMobileChartTab("laps")}
                  className={`py-2.5 px-2 min-h-[44px] rounded-lg text-[11px] font-black uppercase tracking-wider transition-all truncate active:scale-95 flex items-center justify-center ${mobileChartTab === "laps"
                    ? "bg-f1-red text-white shadow"
                    : "text-f1-subtle hover:text-white"
                    }`}
                >
                  Volta a Volta
                </button>
                <button
                  onClick={() => setMobileChartTab("pace")}
                  className={`py-2.5 px-2 min-h-[44px] rounded-lg text-[11px] font-black uppercase tracking-wider transition-all truncate active:scale-95 flex items-center justify-center ${mobileChartTab === "pace"
                    ? "bg-f1-red text-white shadow"
                    : "text-f1-subtle hover:text-white"
                    }`}
                >
                  Ritmo
                </button>
                <button
                  onClick={() => setMobileChartTab("tyres")}
                  className={`py-2.5 px-2 min-h-[44px] rounded-lg text-[11px] font-black uppercase tracking-wider transition-all truncate active:scale-95 flex items-center justify-center ${mobileChartTab === "tyres"
                    ? "bg-f1-red text-white shadow"
                    : "text-f1-subtle hover:text-white"
                    }`}
                >
                  Pneus
                </button>
              </div>

              {/* Gráfico de Evolução Volta a Volta em Largura Total */}
              <div className={`w-full ${mobileChartTab === "laps" ? "block" : "hidden lg:block"}`}>
                <LapChart
                  data={lapData}
                  sessionResults={sessionResults}
                  year={year}
                  raceStatus={raceStatus}
                />
              </div>

              {/* Tabelas de Ritmo e de Estratégia com Altura Igual e Scrollável */}
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch ${mobileChartTab === "laps" ? "hidden lg:grid" : "grid"}`}>
                <div className={`h-[500px] sm:h-[580px] ${mobileChartTab === "pace" ? "block" : "hidden lg:block"}`}>
                  {
                    hasRacePace ? (
                      <RacePaceChart data={racePace} sessionResults={sessionResults} className="h-full" />
                    ) : (
                      < div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-8 text-center text-sm text-f1-subtle h-full flex flex-col items-center justify-center shadow-xl" >
                        <Gauge className="h-8 w-8 text-f1-subtle/40 mb-2" />
                        <h4 className="text-sm font-bold text-white">Ritmo de corrida indisponível</h4>
                        <p className="text-xs text-f1-subtle mt-1 max-w-xs">
                          {year < 1996
                            ? "Cálculo de ritmo em ar limpo não disponível para temporadas históricas."
                            : "Dados de voltas limpas insuficientes para calcular o ritmo médio nesta sessão."}
                        </p>
                      </div>
                    )}
                </div>

                <div className={`h-[500px] sm:h-[580px] ${mobileChartTab === "tyres" ? "block" : "hidden lg:block"}`}>
                  {hasTyres ? (
                    <TyreStrategyChart
                      data={tyreStrategies}
                      totalLaps={totalLaps}
                      sessionResults={sessionResults}
                      className="h-full"
                    />
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-8 text-center text-sm text-f1-subtle h-full flex flex-col items-center justify-center shadow-xl">
                      <Disc className="h-8 w-8 text-f1-subtle/40 mb-2" />
                      <h4 className="text-sm font-bold text-white">Estratégia de pneus indisponível</h4>
                      <p className="text-xs text-f1-subtle mt-1 max-w-xs">
                        {year < 2018
                          ? "Telemetria de compostos e stints de pneus da F1 disponível a partir de 2018."
                          : "Dados de estratégia de pneus indisponíveis para esta sessão."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONTEÚDO DA ABA 2: VOLTA IDEAL TEÓRICA (QUALIFICAÇÃO / TREINOS)           */}
          {/* ========================================================================= */}
          {effectiveViewMode === "ideal" && (
            <div className="space-y-6 animate-fadeIn">
              <IdealLapCard data={idealLaps} />
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONTEÚDO DA ABA 3: TABELA DE CLASSIFICAÇÃO OFICIAL (TABELA COMPLETA FIA)   */}
          {/* ========================================================================= */}
          {effectiveViewMode === "table" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    Classificação Oficial da Sessão
                  </h2>
                  <p className="text-xs text-f1-subtle font-medium mt-0.5">
                    Resultados cronometrados oficiais, gaps, voltas concluídas e paradas registradas
                  </p>
                </div>
                {fastestLap && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 text-xs text-purple-300 font-bold self-start sm:self-auto">
                    <Timer className="h-4 w-4 text-purple-400" />
                    <span>Volta Mais Rápida: <strong className="font-mono text-white ml-1">{fastestLap}</strong></span>
                  </div>
                )}
              </div>

              {sessionResults.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-12 text-center">
                  <p className="text-sm text-f1-subtle font-medium">Nenhum resultado registrado para esta sessão no banco de dados.</p>
                </div>
              ) : (
                <div className="space-y-2">
                    <div className="md:hidden flex flex-col gap-2">
                      {/* Seletor de Segmentos no Mobile (Q1, Q2, Q3, Final) */}
                      {hasQualiSegments && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10">
                          <span className="text-[11px] font-mono text-f1-subtle font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                            <Timer className="h-3.5 w-3.5 text-f1-red" />
                            <span>Segmento:</span>
                          </span>
                          <div className="inline-flex items-center rounded-lg bg-black/60 p-0.5 border border-white/10">
                            {availableMobileSegments.map((seg) => {
                              const isSelected = mobileQualiSegment === seg;
                              const label = seg === "final" ? "Final" : `${qPrefix}${seg.slice(1)}`;
                              return (
                                <button
                                  key={seg}
                                  type="button"
                                  onClick={() => selectMobileSegment(seg)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                                    isSelected
                                      ? "bg-f1-red text-white shadow-sm"
                                      : "text-zinc-400 hover:text-white"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Dica de toque */}
                      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-[11px] text-f1-subtle">
                        <span className="flex items-center gap-1.5">
                          <ChevronDown className="h-3.5 w-3.5 text-f1-red shrink-0" />
                          <span>Toque em qualquer linha para ver detalhes e perfil</span>
                        </span>
                        {hasQualiSegments && (
                          <span className="font-mono text-[10px] text-f1-red font-bold">
                            {mobileQualiSegment === "final" ? "Tempo Final" : `${qPrefix}${mobileQualiSegment.slice(1)}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B10] shadow-2xl">
                      <div className="overflow-x-auto sm:overflow-x-visible">
                        <table className="w-full text-left border-collapse table-auto">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-f1-subtle">
                              <th
                                onClick={() => handleSort("pos")}
                                className="py-2.5 sm:py-3 pl-2 sm:pl-6 pr-1 sm:pr-3 w-8 sm:w-16 text-center cursor-pointer hover:text-white transition-colors select-none"
                                title="Ordenar por Posição Final"
                              >
                                <span className="inline-flex items-center gap-1 justify-center">
                                  <span>Pos</span>
                                  {sortField === "pos" ? (
                                    sortDirection === "asc" ? (
                                      <ArrowUp className="h-2.5 w-2.5 text-f1-red shrink-0" />
                                    ) : (
                                      <ArrowDown className="h-2.5 w-2.5 text-f1-red shrink-0" />
                                    )
                                  ) : null}
                                </span>
                              </th>

                              {isRaceSession && <th className="py-3.5 px-3 w-20 text-center hidden md:table-cell">Largada</th>}
                              {isRaceSession && <th className="py-2.5 sm:py-3 px-0.5 sm:px-3 w-8 sm:w-20 text-center">+/-</th>}

                              <th
                                onClick={() => handleSort("driver")}
                                className="py-2.5 sm:py-3 px-1.5 sm:px-4 min-w-[130px] sm:min-w-0 w-full cursor-pointer hover:text-white transition-colors select-none"
                                title="Ordenar por Nome do Piloto"
                              >
                                <span className="inline-flex items-center gap-1">
                                  <span>Piloto</span>
                                  {sortField === "driver" ? (
                                    sortDirection === "asc" ? (
                                      <ArrowUp className="h-2.5 w-2.5 text-f1-red shrink-0" />
                                    ) : (
                                      <ArrowDown className="h-2.5 w-2.5 text-f1-red shrink-0" />
                                    )
                                  ) : null}
                                </span>
                              </th>

                              <th className="py-3.5 px-4 hidden md:table-cell">Equipe</th>
                              <th className="py-3.5 px-3 text-center hidden lg:table-cell">Nº</th>

                              {/* Colunas de Tempo / Segmentos */}
                              {hasQualiSegments ? (
                                <>
                                  {/* Mobile: coluna única dinâmica */}
                                  <th
                                    onClick={cycleMobileSegment}
                                    className="py-2.5 sm:py-3 px-1.5 sm:px-4 text-right w-20 sm:w-28 md:hidden cursor-pointer select-none"
                                    title="Toque para alternar e ordenar por segmento (Q1, Q2, Q3, Final)"
                                  >
                                    <span className="inline-flex items-center gap-1 justify-end font-mono text-f1-red font-bold">
                                      <span>{mobileQualiSegment === "final" ? "Final" : `${qPrefix}${mobileQualiSegment.slice(1)}`}</span>
                                      <ArrowUpDown className="h-2.5 w-2.5 opacity-70" />
                                    </span>
                                  </th>

                                  {/* Desktop: colunas individuais Q1, Q2, Q3 com ordenação interativa */}
                                  {hasQ1 && (
                                    <th
                                      onClick={() => handleSort("q1")}
                                      className={`py-3.5 px-3 text-right hidden md:table-cell font-mono w-24 cursor-pointer transition-colors select-none ${
                                        sortField === "q1" ? "text-purple-300 font-black" : "hover:text-white"
                                      }`}
                                      title={`Ordenar pelos tempos do ${qPrefix}1 (mais rápidos primeiro)`}
                                    >
                                      <span className="inline-flex items-center gap-1 justify-end">
                                        <span>{qPrefix}1</span>
                                        {sortField === "q1" ? (
                                          sortDirection === "asc" ? (
                                            <ArrowUp className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                                          ) : (
                                            <ArrowDown className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                                          )
                                        ) : (
                                          <ArrowUpDown className="h-2.5 w-2.5 opacity-30 hover:opacity-100 shrink-0" />
                                        )}
                                      </span>
                                    </th>
                                  )}
                                  {hasQ2 && (
                                    <th
                                      onClick={() => handleSort("q2")}
                                      className={`py-3.5 px-3 text-right hidden md:table-cell font-mono w-24 cursor-pointer transition-colors select-none ${
                                        sortField === "q2" ? "text-purple-300 font-black" : "hover:text-white"
                                      }`}
                                      title={`Ordenar pelos tempos do ${qPrefix}2 (mais rápidos primeiro)`}
                                    >
                                      <span className="inline-flex items-center gap-1 justify-end">
                                        <span>{qPrefix}2</span>
                                        {sortField === "q2" ? (
                                          sortDirection === "asc" ? (
                                            <ArrowUp className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                                          ) : (
                                            <ArrowDown className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                                          )
                                        ) : (
                                          <ArrowUpDown className="h-2.5 w-2.5 opacity-30 hover:opacity-100 shrink-0" />
                                        )}
                                      </span>
                                    </th>
                                  )}
                                  {hasQ3 && (
                                    <th
                                      onClick={() => handleSort("q3")}
                                      className={`py-3.5 px-3 text-right hidden md:table-cell font-mono w-24 cursor-pointer transition-colors select-none ${
                                        sortField === "q3" ? "text-purple-300 font-black" : "hover:text-white"
                                      }`}
                                      title={`Ordenar pelos tempos do ${qPrefix}3 (mais rápidos primeiro)`}
                                    >
                                      <span className="inline-flex items-center gap-1 justify-end">
                                        <span>{qPrefix}3</span>
                                        {sortField === "q3" ? (
                                          sortDirection === "asc" ? (
                                            <ArrowUp className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                                          ) : (
                                            <ArrowDown className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                                          )
                                        ) : (
                                          <ArrowUpDown className="h-2.5 w-2.5 opacity-30 hover:opacity-100 shrink-0" />
                                        )}
                                      </span>
                                    </th>
                                  )}
                                </>
                              ) : (
                                <th
                                  onClick={() => handleSort("time")}
                                  className={`py-2.5 sm:py-3 px-1.5 sm:px-4 text-right cursor-pointer hover:text-white transition-colors select-none ${
                                    isRaceSession ? "hidden md:table-cell" : "w-20 sm:w-28"
                                  }`}
                                  title="Ordenar por Tempo"
                                >
                                  <span className="inline-flex items-center gap-1 justify-end">
                                    <span className="sm:hidden">Tempo</span>
                                    <span className="hidden sm:inline">Melhor Volta / Tempo</span>
                                    {sortField === "time" ? (
                                      sortDirection === "asc" ? (
                                        <ArrowUp className="h-2.5 w-2.5 text-f1-red shrink-0" />
                                      ) : (
                                        <ArrowDown className="h-2.5 w-2.5 text-f1-red shrink-0" />
                                      )
                                    ) : null}
                                  </span>
                                </th>
                              )}

                              <th
                                onClick={() => handleSort("gap")}
                                className="py-2.5 sm:py-3 px-1.5 sm:px-4 text-right w-14 sm:w-24 cursor-pointer hover:text-white transition-colors select-none"
                                title="Ordenar por Gap"
                              >
                                <span className="inline-flex items-center gap-1 justify-end">
                                  <span className="sm:hidden">Gap</span>
                                  <span className="hidden sm:inline">{hasQualiSegments ? "Gap Pole" : "Gap Líder"}</span>
                                  {sortField === "gap" ? (
                                    sortDirection === "asc" ? (
                                      <ArrowUp className="h-2.5 w-2.5 text-f1-red shrink-0" />
                                    ) : (
                                      <ArrowDown className="h-2.5 w-2.5 text-f1-red shrink-0" />
                                    )
                                  ) : null}
                                </span>
                              </th>

                              {!hasQualiSegments && <th className="py-3.5 px-4 text-right hidden lg:table-cell">Intervalo</th>}
                              <th className={`py-3.5 px-3 text-center ${hasQualiSegments ? "hidden xl:table-cell" : "hidden md:table-cell"}`}>Voltas</th>
                              {isRaceSession && <th className="py-3.5 px-3 text-center hidden md:table-cell">Paradas</th>}
                              {isRaceSession && (
                                <th
                                  onClick={() => handleSort("points")}
                                  className="py-2.5 sm:py-3 pr-2.5 sm:pr-6 pl-1 sm:pl-3 text-right w-11 sm:w-16 cursor-pointer hover:text-white transition-colors select-none"
                                  title="Ordenar por Pontos"
                                >
                                  <span className="inline-flex items-center gap-1 justify-end">
                                    <span>Pts</span>
                                    {sortField === "points" ? (
                                      sortDirection === "asc" ? (
                                        <ArrowUp className="h-2.5 w-2.5 text-f1-red shrink-0" />
                                      ) : (
                                        <ArrowDown className="h-2.5 w-2.5 text-f1-red shrink-0" />
                                      )
                                    ) : null}
                                  </span>
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-xs">
                            {sortedSessionResults.map((row, index) => {
                              const pos = row.finishing_position ?? index + 1;
                              const teamColor = row.team_color || "#E10600";
                              const isFastestLap = Boolean(row.best_lap && row.best_lap === fastestLap);
                              const rowId = row.driver_id || row.driver_full_name || index;
                              const isExpanded = expandedDriverRow === rowId;

                              // Verificação de ordenação por segmento Q
                              const isSegmentSorted = sortField === "q1" || sortField === "q2" || sortField === "q3";
                              const currentSegmentTime = isSegmentSorted ? row[sortField] : null;
                              const hasTimeInSortedSegment = Boolean(
                                currentSegmentTime &&
                                currentSegmentTime !== "—" &&
                                currentSegmentTime !== "-" &&
                                currentSegmentTime.trim() !== ""
                              );

                              const displayPos = isSegmentSorted
                                ? hasTimeInSortedSegment
                                  ? index + 1
                                  : "—"
                                : pos;

                              const segmentLeaderTime = isSegmentSorted ? sortedSessionResults[0]?.[sortField] : null;
                              const displayGap = isSegmentSorted
                                ? hasTimeInSortedSegment
                                  ? getSegmentGap(currentSegmentTime, segmentLeaderTime)
                                  : "—"
                                : row.gap_to_leader || (pos === 1 ? (hasQualiSegments ? "Pole" : "Líder") : "—");

                              return (
                                <React.Fragment key={`${row.session_sk}-${row.driver_id || index}`}>
                                  <tr
                                    onClick={() => setExpandedDriverRow(isExpanded ? null : rowId)}
                                    className={`group transition-colors cursor-pointer md:cursor-default ${isExpanded ? "bg-white/[0.06] md:bg-transparent" : "hover:bg-white/[0.03]"
                                      }`}
                                  >
                                    {/* Posição */}
                                    <td className="py-2 sm:py-3.5 pl-2 sm:pl-6 pr-1 sm:pr-3 text-center font-bold">
                                      <span
                                        className={`inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded font-mono text-[10px] sm:text-xs ${
                                          displayPos === 1
                                            ? "bg-amber-400 font-black text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                            : displayPos === 2
                                            ? "bg-slate-300 font-black text-black"
                                            : displayPos === 3
                                            ? "bg-amber-700 font-black text-white"
                                            : displayPos === "—"
                                            ? "bg-white/5 text-gray-500 font-medium"
                                            : "bg-white/5 text-gray-300"
                                        }`}
                                      >
                                        {displayPos}
                                      </span>
                                    </td>

                                    {/* Largada (Corrida) */}
                                    {isRaceSession && (
                                      <td className="py-3.5 px-3 text-center font-mono hidden md:table-cell">
                                        {row.grid_position != null ? (
                                          <span
                                            title={`Largou na posição ${row.grid_position}`}
                                            className="inline-flex items-center justify-center rounded bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-bold text-gray-300"
                                          >
                                            P{row.grid_position}
                                          </span>
                                        ) : (
                                          <span className="text-f1-subtle text-xs">—</span>
                                        )}
                                      </td>
                                    )}

                                    {/* Evolução / Ganho ou Perda de Posições (Corrida) */}
                                    {isRaceSession && (
                                      <td className="py-2 sm:py-3.5 px-0.5 sm:px-3 text-center">
                                        {row.delta_position != null ? (
                                          row.delta_position > 0 ? (
                                            <span
                                              title={`Largou em P${row.grid_position} e ganhou ${row.delta_position} posição(ões)`}
                                              className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 px-0.5 sm:px-1.5 py-0.5 font-mono text-[10px] sm:text-xs font-bold text-emerald-400"
                                            >
                                              <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[2.5]" />
                                              +{row.delta_position}
                                            </span>
                                          ) : row.delta_position < 0 ? (
                                            <span
                                              title={`Largou em P${row.grid_position} e perdeu ${Math.abs(row.delta_position)} posição(ões)`}
                                              className="inline-flex items-center gap-0.5 rounded bg-rose-500/10 border border-rose-500/25 px-0.5 sm:px-1.5 py-0.5 font-mono text-[10px] sm:text-xs font-bold text-rose-400"
                                            >
                                              <ArrowDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[2.5]" />
                                              {row.delta_position}
                                            </span>
                                          ) : (
                                            <span
                                              title={`Largou em P${row.grid_position} e manteve a posição`}
                                              className="inline-flex items-center gap-0.5 rounded bg-white/5 border border-white/10 px-0.5 sm:px-1.5 py-0.5 font-mono text-[10px] sm:text-xs font-bold text-white/40"
                                            >
                                              <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[2.5]" />
                                              0
                                            </span>
                                          )
                                        ) : (
                                          <span className="text-f1-subtle text-xs">—</span>
                                        )}
                                      </td>
                                    )}

                                    {/* Piloto */}
                                    <td className="py-2 sm:py-3.5 px-1.5 sm:px-4 min-w-[130px] sm:min-w-0 w-full">
                                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                                        <DriverLink
                                          driverId={row.driver_id}
                                          driverName={row.driver_full_name}
                                          className="relative flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 transition-transform hover:scale-105 pointer-events-none md:pointer-events-auto"
                                          style={{ borderColor: teamColor }}
                                          title={`Ver perfil de ${row.driver_full_name}`}
                                        >
                                          {row.driver_headshot_url ? (
                                            <img
                                              src={row.driver_headshot_url}
                                              alt={row.driver_full_name}
                                              className="h-full w-full object-cover object-top"
                                            />
                                          ) : (
                                            <span className="font-mono text-[8px] sm:text-[9px] font-black text-white">
                                              {row.driver_full_name.slice(0, 3).toUpperCase()}
                                            </span>
                                          )}
                                        </DriverLink>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1 min-w-0">
                                            <DriverLink
                                              driverId={row.driver_id}
                                              driverName={row.driver_full_name}
                                              className="font-bold text-white text-[11px] sm:text-xs hover:text-f1-red transition-colors truncate block flex-1 min-w-0 pointer-events-none md:pointer-events-auto"
                                              title={`Ver perfil de ${row.driver_full_name}`}
                                            >
                                              {row.driver_full_name}
                                            </DriverLink>
                                            {isSegmentSorted && row.finishing_position != null && (
                                              <span
                                                className="font-mono text-[9px] text-f1-subtle/80 bg-white/5 px-1 py-0.2 rounded shrink-0 hidden sm:inline"
                                                title={`Posição Oficial de Grid: P${row.finishing_position}`}
                                              >
                                                P{row.finishing_position}
                                              </span>
                                            )}
                                            <ChevronDown
                                              className={`h-3 w-3 text-white/40 transition-transform duration-200 shrink-0 md:hidden ml-1 ${
                                                isExpanded ? "rotate-180 text-f1-red" : ""
                                              }`}
                                            />
                                          </div>
                                          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-f1-subtle leading-tight mt-0.5 truncate">
                                            <span className="truncate">
                                              {row.team_name}
                                            </span>
                                            {isSegmentSorted && row.finishing_position != null && (
                                              <span className="sm:hidden font-mono text-[9px] text-amber-400/90 shrink-0">
                                                • P{row.finishing_position}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Equipe */}
                                    <td className="py-3.5 px-4 hidden md:table-cell">
                                      <TeamLink
                                        teamId={row.team_id}
                                        teamName={row.team_name}
                                        className="flex items-center gap-2 group/team"
                                        title={`Ver perfil da equipe ${row.team_name}`}
                                      >
                                        <span
                                          className="h-2.5 w-2.5 rounded-full shrink-0"
                                          style={{ backgroundColor: teamColor }}
                                        />
                                        <span className="font-medium text-gray-200 group-hover/team:text-white group-hover/team:underline decoration-white/30 transition-colors">
                                          {row.team_name}
                                        </span>
                                      </TeamLink>
                                    </td>

                                    {/* Número */}
                                    <td className="py-3.5 px-3 text-center font-mono font-bold text-f1-subtle hidden lg:table-cell">
                                      #{row.driver_number}
                                    </td>

                                    {/* Colunas de Tempo / Segmentos */}
                                    {hasQualiSegments ? (
                                      <>
                                        {/* Mobile: valor do segmento ativo */}
                                        <td className="py-2 sm:py-3.5 px-1.5 sm:px-4 text-right font-mono font-semibold whitespace-nowrap md:hidden">
                                          {(() => {
                                            const segTime =
                                              mobileQualiSegment === "q1"
                                                ? row.q1
                                                : mobileQualiSegment === "q2"
                                                ? row.q2
                                                : mobileQualiSegment === "q3"
                                                ? row.q3
                                                : row.best_lap;

                                            const isSegBest =
                                              (mobileQualiSegment === "q1" && segTime && segTime === bestQ1Time) ||
                                              (mobileQualiSegment === "q2" && segTime && segTime === bestQ2Time) ||
                                              (mobileQualiSegment === "q3" && segTime && segTime === bestQ3Time) ||
                                              (mobileQualiSegment === "final" && isFastestLap);

                                            if (!segTime || segTime === "—" || segTime === "-") {
                                              return <span className="text-f1-subtle/40 text-[10px] sm:text-xs font-mono">—</span>;
                                            }

                                            if (isSegBest) {
                                              return (
                                                <div className="inline-flex items-center gap-0.5 justify-end">
                                                  <span
                                                    title={`Melhor tempo de ${mobileQualiSegment === "final" ? "Sessão" : mobileQualiSegment.toUpperCase()}`}
                                                    className="inline-flex items-center gap-0.5 rounded bg-purple-500/20 border border-purple-500/40 px-1 py-0.5 text-purple-300 font-bold font-mono text-[10px] sm:text-xs shadow-[0_0_8px_rgba(168,85,247,0.25)]"
                                                  >
                                                    <Timer className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                                                    <span>{segTime}</span>
                                                  </span>
                                                </div>
                                              );
                                            }

                                            return <span className="text-white/80 font-mono text-[10px] sm:text-xs">{segTime}</span>;
                                          })()}
                                        </td>

                                        {/* Desktop: Q1 */}
                                        {hasQ1 && (
                                          <td className="py-3.5 px-3 text-right font-mono text-xs hidden md:table-cell whitespace-nowrap">
                                            {row.q1 ? (
                                              row.q1 === bestQ1Time ? (
                                                <span className="text-purple-300 font-bold" title={`Melhor tempo no ${qPrefix}1`}>
                                                  {row.q1}
                                                </span>
                                              ) : (
                                                <span className="text-white/80">{row.q1}</span>
                                              )
                                            ) : (
                                              <span className="text-f1-subtle/40">—</span>
                                            )}
                                          </td>
                                        )}

                                        {/* Desktop: Q2 */}
                                        {hasQ2 && (
                                          <td className="py-3.5 px-3 text-right font-mono text-xs hidden md:table-cell whitespace-nowrap">
                                            {row.q2 ? (
                                              row.q2 === bestQ2Time ? (
                                                <span className="text-purple-300 font-bold" title={`Melhor tempo no ${qPrefix}2`}>
                                                  {row.q2}
                                                </span>
                                              ) : (
                                                <span className="text-white/80">{row.q2}</span>
                                              )
                                            ) : (
                                              <span className="text-f1-subtle/40">—</span>
                                            )}
                                          </td>
                                        )}

                                        {/* Desktop: Q3 */}
                                        {hasQ3 && (
                                          <td className="py-3.5 px-3 text-right font-mono text-xs hidden md:table-cell whitespace-nowrap">
                                            {row.q3 ? (
                                              row.q3 === bestQ3Time ? (
                                                <span
                                                  title={`Melhor tempo no ${qPrefix}3 (Pole Position)`}
                                                  className="inline-flex items-center gap-1 rounded-md bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.5 text-purple-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                                >
                                                  <Timer className="h-3 w-3 text-purple-400 shrink-0" />
                                                  <span>{row.q3}</span>
                                                </span>
                                              ) : (
                                                <span className="text-white/90 font-medium">{row.q3}</span>
                                              )
                                            ) : (
                                              <span className="text-f1-subtle/40">—</span>
                                            )}
                                          </td>
                                        )}
                                      </>
                                    ) : (
                                      <td className={`py-2 sm:py-3.5 px-1.5 sm:px-4 text-right font-mono font-semibold whitespace-nowrap ${isRaceSession ? "hidden md:table-cell" : ""}`}>
                                        {isFastestLap ? (
                                          <div className="inline-flex items-center gap-1 justify-end">
                                            <span
                                              title="Volta Mais Rápida da Sessão (Fastest Lap)"
                                              className="inline-flex items-center gap-0.5 sm:gap-1 rounded-md bg-purple-500/20 border border-purple-500/40 px-1 sm:px-2 py-0.5 text-purple-300 font-bold font-mono text-[10px] sm:text-xs shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                                            >
                                              <Timer className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-purple-400 shrink-0" />
                                              <span>{row.best_lap}</span>
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-white/80 font-mono text-[10px] sm:text-xs">{row.best_lap || "—"}</span>
                                        )}
                                      </td>
                                    )}

                                    {/* Gap Líder */}
                                    <td className="py-2 sm:py-3.5 px-1.5 sm:px-4 text-right font-mono text-gray-300 whitespace-nowrap text-[10px] sm:text-xs">
                                      {displayGap}
                                    </td>

                                    {/* Intervalo */}
                                    {!hasQualiSegments && (
                                      <td className="py-3.5 px-4 text-right font-mono text-f1-subtle hidden lg:table-cell">
                                        {row.interval_to_car_ahead || "—"}
                                      </td>
                                    )}

                                    {/* Voltas */}
                                    <td className={`py-3.5 px-3 text-center font-mono font-semibold text-gray-200 ${hasQualiSegments ? "hidden xl:table-cell" : "hidden md:table-cell"}`}>
                                      {row.laps_completed ?? "—"}
                                    </td>

                                    {/* Paradas (Corrida) */}
                                    {isRaceSession && (
                                      <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-400 hidden md:table-cell">
                                        {row.stops ?? 0}
                                      </td>
                                    )}

                                    {/* Pontos (Corrida) */}
                                    {isRaceSession && (
                                      <td className="py-2 sm:py-3.5 pr-2.5 sm:pr-6 pl-1 sm:pl-3 text-right font-mono font-black text-white whitespace-nowrap text-[10px] sm:text-xs">
                                        {row.points ? (
                                          <span className="rounded bg-white/10 px-1 sm:px-2 py-0.5 text-emerald-400 font-mono font-black">
                                            +{row.points}
                                          </span>
                                        ) : (
                                          <span className="text-f1-subtle font-mono">0</span>
                                        )}
                                      </td>
                                    )}
                                  </tr>

                                  {/* Accordion Expandível Mobile (< md): Detalhes de Telemetria e Estratégia */}
                                  {isExpanded && (
                                    <tr className="md:hidden bg-[#141420] border-b border-white/10 animate-fadeIn">
                                      <td colSpan={isRaceSession ? 5 : 4} className="p-3">
                                        <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5 text-xs">
                                          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div
                                                className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5"
                                                style={{ borderColor: teamColor }}
                                              >
                                                {row.driver_headshot_url ? (
                                                  <img
                                                    src={row.driver_headshot_url}
                                                    alt={row.driver_full_name}
                                                    className="h-full w-full object-cover object-top"
                                                  />
                                                ) : (
                                                  <span className="font-mono text-[9px] font-black text-white">
                                                    {row.driver_full_name.slice(0, 3).toUpperCase()}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="min-w-0">
                                                <span className="font-bold text-white text-xs block truncate">{row.driver_full_name}</span>
                                                <TeamLink teamId={row.team_id} teamName={row.team_name} className="flex items-center gap-1.5 text-[10px] text-f1-subtle hover:text-white truncate">
                                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                                                  <span>{row.team_name || "—"}</span>
                                                </TeamLink>
                                              </div>
                                            </div>
                                            <span className="text-[11px] font-mono text-f1-subtle shrink-0">
                                              Carro: <strong className="text-white">#{row.driver_number || "—"}</strong>
                                            </span>
                                          </div>

                                          {hasQualiSegments ? (
                                            <div className="space-y-2">
                                              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                                                <div className={`rounded-lg p-2 border ${row.q1 && row.q1 === bestQ1Time ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/5 text-white"}`}>
                                                  <span className="block text-[9px] text-f1-subtle uppercase font-sans">{qPrefix}1</span>
                                                  <span className="text-xs font-black">{row.q1 || "—"}</span>
                                                </div>
                                                <div className={`rounded-lg p-2 border ${row.q2 && row.q2 === bestQ2Time ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/5 text-white"}`}>
                                                  <span className="block text-[9px] text-f1-subtle uppercase font-sans">{qPrefix}2</span>
                                                  <span className="text-xs font-black">{row.q2 || "—"}</span>
                                                </div>
                                                <div className={`rounded-lg p-2 border ${row.q3 && row.q3 === bestQ3Time ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/5 text-white"}`}>
                                                  <span className="block text-[9px] text-f1-subtle uppercase font-sans">{qPrefix}3</span>
                                                  <span className="text-xs font-black">{row.q3 || "—"}</span>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                                                <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                                  <span className="block text-[10px] text-f1-subtle uppercase">Tempo Final (Grid)</span>
                                                  <span className="text-xs font-black text-white">{row.best_lap || "—"}</span>
                                                </div>
                                                <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                                  <span className="block text-[10px] text-f1-subtle uppercase">Gap para a Pole</span>
                                                  <span className="text-xs font-black text-white">{row.gap_to_leader || (pos === 1 ? "Pole Position" : "—")}</span>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                                                <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                                  <span className="block text-[10px] text-f1-subtle uppercase">Melhor Volta / Tempo</span>
                                                  <span className="text-xs font-black text-white">
                                                    {row.best_lap || "—"}
                                                  </span>
                                                </div>
                                                <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                                  <span className="block text-[10px] text-f1-subtle uppercase">Intervalo Carro Frente</span>
                                                  <span className="text-xs font-black text-white">
                                                    {row.interval_to_car_ahead || "—"}
                                                  </span>
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                                                <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                                  <span className="block text-[10px] text-f1-subtle uppercase">Voltas Completadas</span>
                                                  <span className="text-xs font-black text-white">
                                                    {row.laps_completed ?? "—"}
                                                  </span>
                                                </div>
                                                {isRaceSession ? (
                                                  <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                                    <span className="block text-[10px] text-f1-subtle uppercase">Grid & Pit Stops</span>
                                                    <span className="text-xs font-black text-white">
                                                      Largou P{row.grid_position ?? "—"} • {row.stops ?? 0} pits
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                                                    <span className="block text-[10px] text-f1-subtle uppercase">Gap para o Líder</span>
                                                    <span className="text-xs font-black text-white">
                                                      {row.gap_to_leader || (pos === 1 ? "Líder" : "—")}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            </>
                                          )}

                                          <DriverLink
                                            driverId={row.driver_id}
                                            driverName={row.driver_full_name}
                                            className="flex items-center justify-center gap-1.5 w-full py-2.5 min-h-[44px] rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors border border-white/10 active:scale-95"
                                          >
                                            <span>Ver Perfil de {row.driver_full_name}</span>
                                            <ExternalLink className="h-3.5 w-3.5 text-f1-subtle" />
                                          </DriverLink>
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
                    </div>
                  </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
