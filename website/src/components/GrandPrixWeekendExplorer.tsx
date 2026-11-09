"use client";

import React, { useState, useMemo } from "react";
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
  ChevronDown,
  ExternalLink
} from "lucide-react";
import TyreStrategyChart from "@/components/TyreStrategyChart";
import RacePaceChart from "@/components/RacePaceChart";
import LapChart from "@/components/LapChart";
import IdealLapCard from "@/components/IdealLapCard";
import DriverLink from "@/lib/driverUtils";
import TeamLink from "@/lib/teamUtils";
import CircuitLink from "@/lib/circuitUtils";

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
  const [viewMode, setViewMode] = useState<"dashboard" | "ideal" | "table">("table");

  const changeSession = (newSession: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("session", newSession);
    router.push(`/season/round/${round}?${params.toString()}`);
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

  // Volta mais rápida da sessão (Fastest Lap / Purple Lap)
  const fastestLap = useMemo(() => {
    const valid = sessionResults.filter(
      (r) => r.best_lap && r.best_lap.trim() !== "" && r.best_lap !== "—" && r.best_lap !== "-"
    );
    if (valid.length === 0) return null;

    const toSeconds = (s: string) => {
      const parts = s.split(":");
      if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      }
      return parseFloat(s);
    };

    return [...valid].sort((a, b) => {
      const tA = toSeconds(a.best_lap!);
      const tB = toSeconds(b.best_lap!);
      if (isNaN(tA)) return 1;
      if (isNaN(tB)) return -1;
      return tA - tB;
    })[0]?.best_lap;
  }, [sessionResults]);

  const fastestLapDriver = useMemo(() => {
    if (!fastestLap) return null;
    return sessionResults.find((r) => r.best_lap === fastestLap);
  }, [sessionResults, fastestLap]);

  // Piloto com maior Speed Trap
  const topSpeedRecord = useMemo(() => {
    if (!maxSpeed || maxSpeed.length === 0) return null;
    const sorted = [...maxSpeed].sort(
      (a, b) => (b.max_speed_trap || 0) - (a.max_speed_trap || 0)
    );
    return sorted[0] || null;
  }, [maxSpeed]);

  // Maior escalador de posições (Grid -> Chegada)
  const biggestClimber = useMemo(() => {
    const eligible = sessionResults.filter(
      (r) => r.delta_position !== null && r.delta_position !== undefined && Number(r.delta_position) > 0
    );
    if (eligible.length === 0) return null;
    return [...eligible].sort((a, b) => {
      const diff = Number(b.delta_position || 0) - Number(a.delta_position || 0);
      if (diff !== 0) return diff;
      return Number(a.finishing_position || 99) - Number(b.finishing_position || 99);
    })[0];
  }, [sessionResults]);

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

  // Piloto com maior eficiência teórica (menor delta ideal)
  const mostEfficientDriver = useMemo(() => {
    if (!idealLaps || idealLaps.length === 0) return null;
    const sorted = [...idealLaps].sort((a, b) =>
      (a.delta_ideal_lap || "9:99:999").localeCompare(b.delta_ideal_lap || "9:99:999")
    );
    return sorted[0] || null;
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
              return (
                <button
                  key={session}
                  onClick={() => changeSession(session)}
                  className={`rounded-lg px-2 sm:px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center active:scale-95 ${
                    isSelected
                      ? "bg-f1-red text-white shadow-md shadow-f1-red/30"
                      : "border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white"
                  }`}
                >
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
        <div className="rounded-xl border border-purple-500/30 bg-[#13111E] p-2.5 sm:p-4 flex items-center justify-between">
          <div className="min-w-0 pr-1 sm:pr-2">
            <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
              <span className="sm:hidden">Volta Rápida</span>
              <span className="hidden sm:inline">Volta Mais Rápida</span>
            </span>
            <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1 tracking-tight truncate">
              {fastestLap || "—"}
            </div>
            {fastestLapDriver ? (
              <DriverLink driverId={fastestLapDriver.driver_id} driverName={fastestLapDriver.driver_full_name} className="block">
                <p className="text-[10px] sm:text-[11px] text-f1-subtle hover:text-purple-300 transition-colors truncate mt-0.5 font-bold sm:font-normal">
                  <span className="sm:hidden">{fastestLapDriver.driver_full_name.split(" ").slice(-1)[0]}</span>
                  <span className="hidden sm:inline">{fastestLapDriver.driver_full_name}</span>
                </p>
              </DriverLink>
            ) : (
              <p className="text-[10px] sm:text-[11px] text-f1-subtle truncate mt-0.5">—</p>
            )}
            {fastestLapDriver?.team_name ? (
              <TeamLink
                teamName={fastestLapDriver.team_name}
                className="text-[9px] sm:text-[10px] text-purple-300/80 font-mono hover:text-white hover:underline transition-colors block truncate"
                title={`Ver perfil de ${fastestLapDriver.team_name}`}
              >
                {fastestLapDriver.team_name}
              </TeamLink>
            ) : null}
          </div>

          <span className="font-mono text-[10px] sm:text-xs font-bold text-purple-400 uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-purple-500/10 border border-purple-500/20 shrink-0">
            FL
          </span>
        </div>

        {/* Card 3: Speed Trap (Corrida) ou Volta Ideal Teórica (Quali/Treino) ou Pilotos no Grid */}
        {isRaceSession ? (
          <div className="rounded-xl border border-amber-500/30 bg-[#14120C] p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0 pr-1 sm:pr-2">
              <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="sm:hidden">Speed Trap</span>
                <span className="hidden sm:inline">Speed Trap Máximo</span>
              </span>
              <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1 tracking-tight truncate">
                {topSpeedRecord?.max_speed_trap ? `${Number(topSpeedRecord.max_speed_trap).toFixed(1)} km/h` : "—"}
              </div>
              {topSpeedRecord ? (
                <DriverLink driverName={topSpeedRecord.driver_full_name} className="block">
                  <p className="text-[10px] sm:text-[11px] text-f1-subtle hover:text-amber-300 transition-colors truncate mt-0.5 font-bold sm:font-normal">
                    <span className="sm:hidden">{topSpeedRecord.driver_full_name.split(" ").slice(-1)[0]}</span>
                    <span className="hidden sm:inline">{topSpeedRecord.driver_full_name}</span>
                  </p>
                </DriverLink>
              ) : (
                <p className="text-[10px] sm:text-[11px] text-f1-subtle truncate mt-0.5">—</p>
              )}
              <div className="flex items-center gap-1 sm:gap-2 mt-0.5 text-[9px] sm:text-[10px] text-amber-400/80 font-mono truncate">
                {topSpeedRecord?.team_name ? (
                  <TeamLink
                    teamName={topSpeedRecord.team_name}
                    className="hover:text-white hover:underline transition-colors truncate"
                    title={`Ver perfil de ${topSpeedRecord.team_name}`}
                  >
                    {topSpeedRecord.team_name}
                  </TeamLink>
                ) : null}
              </div>
            </div>

            <span className="font-mono text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
              TRAP
            </span>
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
          <div className="rounded-xl border border-emerald-500/30 bg-[#101716] p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0 pr-1 sm:pr-2">
              <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="sm:hidden">Escalador</span>
                <span className="hidden sm:inline">Maior Escalador</span>
              </span>
              <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1 tracking-tight flex items-baseline gap-1 truncate">
                <span className="text-emerald-400">+{biggestClimber.delta_position}</span>
                <span className="text-[10px] sm:text-xs text-f1-subtle font-mono truncate">
                  (P{biggestClimber.grid_position}➔P{biggestClimber.finishing_position})
                </span>
              </div>
              <DriverLink driverId={biggestClimber.driver_id} driverName={biggestClimber.driver_full_name} className="block">
                <p className="text-[10px] sm:text-[11px] text-white/90 hover:text-emerald-300 transition-colors truncate font-bold sm:font-semibold mt-0.5">
                  <span className="sm:hidden">{biggestClimber.driver_full_name.split(" ").slice(-1)[0]}</span>
                  <span className="hidden sm:inline">{biggestClimber.driver_full_name}</span>
                </p>
              </DriverLink>
              {biggestClimber.team_name ? (
                <TeamLink
                  teamName={biggestClimber.team_name}
                  className="text-[9px] sm:text-[10px] font-mono block truncate hover:text-white hover:underline transition-colors"
                  style={{ color: biggestClimber.team_color || undefined }}
                  title={`Ver perfil de ${biggestClimber.team_name}`}
                >
                  {biggestClimber.team_name}
                </TeamLink>
              ) : null}
            </div>

            <DriverLink
              driverId={biggestClimber.driver_id}
              driverName={biggestClimber.driver_full_name}
              className="relative flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
              style={{ borderColor: biggestClimber.team_color || "#10B981" }}
              title={`Ver perfil de ${biggestClimber.driver_full_name}`}
            >
              {biggestClimber.driver_headshot_url ? (
                <img
                  src={biggestClimber.driver_headshot_url}
                  alt={biggestClimber.driver_full_name}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <span className="font-mono text-[9px] sm:text-xs font-bold text-emerald-400">
                  +{biggestClimber.delta_position}
                </span>
              )}
            </DriverLink>
          </div>
        ) : isQualiSession && mostEfficientDriver ? (
          <div className="rounded-xl border border-emerald-500/30 bg-[#101716] p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0 pr-1 sm:pr-2">
              <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="sm:hidden">Eficiência</span>
                <span className="hidden sm:inline">Maior Eficiência</span>
              </span>
              <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1 tracking-tight truncate">
                {mostEfficientDriver.delta_ideal_lap === "0:00:000" || mostEfficientDriver.delta_ideal_lap === "0:00.000"
                  ? "100% Perfeita"
                  : `+${mostEfficientDriver.delta_ideal_lap}`}
              </div>
              <DriverLink driverName={mostEfficientDriver.driver_full_name} className="block">
                <p className="text-[10px] sm:text-[11px] text-white/90 hover:text-emerald-300 transition-colors truncate font-bold sm:font-semibold mt-0.5">
                  <span className="sm:hidden">{mostEfficientDriver.driver_full_name.split(" ").slice(-1)[0]}</span>
                  <span className="hidden sm:inline">{mostEfficientDriver.driver_full_name}</span>
                </p>
              </DriverLink>
              <span
                className="text-[9px] sm:text-[10px] font-mono block truncate"
                style={{ color: mostEfficientDriver.team_color || undefined }}
              >
                {mostEfficientDriver.team_name}
              </span>
            </div>

            <DriverLink
              driverName={mostEfficientDriver.driver_full_name}
              className="relative flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
              style={{ borderColor: mostEfficientDriver.team_color || "#10B981" }}
              title={`Ver perfil de ${mostEfficientDriver.driver_full_name}`}
            >
              {mostEfficientDriver.driver_headshot_url ? (
                <img
                  src={mostEfficientDriver.driver_headshot_url}
                  alt={mostEfficientDriver.driver_full_name}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <span className="font-mono text-[9px] sm:text-xs font-bold text-emerald-400">EFF</span>
              )}
            </DriverLink>
          </div>
        ) : isPracticeSession && p2Driver ? (
          <div className="rounded-xl border border-sky-500/30 bg-[#111118] p-2.5 sm:p-4 flex items-center justify-between">
            <div className="min-w-0 pr-1 sm:pr-2">
              <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                Margem P2
              </span>
              <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1 tracking-tight flex items-baseline gap-1 truncate">
                <span className="text-sky-400">{p2Driver.gap_to_leader || "—"}</span>
              </div>
              <DriverLink driverId={p2Driver.driver_id} driverName={p2Driver.driver_full_name} className="block">
                <p className="text-[10px] sm:text-[11px] text-white/90 hover:text-sky-300 transition-colors truncate font-bold sm:font-semibold mt-0.5">
                  <span className="sm:hidden">{p2Driver.driver_full_name.split(" ").slice(-1)[0]}</span>
                  <span className="hidden sm:inline">{p2Driver.driver_full_name}</span>
                </p>
              </DriverLink>
            </div>

            <DriverLink
              driverId={p2Driver.driver_id}
              driverName={p2Driver.driver_full_name}
              className="relative flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
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
          {/* Sub-abas Mobile (< lg): Alterna entre os 3 gráficos sem empilhar 3 painéis gigantes */}
          <div className="grid grid-cols-3 lg:hidden rounded-xl border border-white/10 bg-[#12121A] p-1 shadow-lg">
            <button
              onClick={() => setMobileChartTab("laps")}
              className={`py-2.5 px-2 min-h-[44px] rounded-lg text-[11px] font-black uppercase tracking-wider transition-all truncate active:scale-95 flex items-center justify-center ${
                mobileChartTab === "laps"
                  ? "bg-f1-red text-white shadow"
                  : "text-f1-subtle hover:text-white"
              }`}
            >
              Volta a Volta
            </button>
            <button
              onClick={() => setMobileChartTab("pace")}
              className={`py-2.5 px-2 min-h-[44px] rounded-lg text-[11px] font-black uppercase tracking-wider transition-all truncate active:scale-95 flex items-center justify-center ${
                mobileChartTab === "pace"
                  ? "bg-f1-red text-white shadow"
                  : "text-f1-subtle hover:text-white"
              }`}
            >
              Ritmo
            </button>
            <button
              onClick={() => setMobileChartTab("tyres")}
              className={`py-2.5 px-2 min-h-[44px] rounded-lg text-[11px] font-black uppercase tracking-wider transition-all truncate active:scale-95 flex items-center justify-center ${
                mobileChartTab === "tyres"
                  ? "bg-f1-red text-white shadow"
                  : "text-f1-subtle hover:text-white"
              }`}
            >
              Pneus
            </button>
          </div>

          {/* Gráfico de Evolução Volta a Volta em Largura Total */}
          <div className={`w-full ${mobileChartTab === "laps" ? "block" : "hidden lg:block"}`}>
            {hasLapData ? (
              <LapChart data={lapData} sessionResults={sessionResults} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-8 text-center text-sm text-f1-subtle">
                Telemetria volta a volta em processamento para esta sessão.
              </div>
            )}
          </div>

          {/* Tabelas de Ritmo e de Estratégia com Altura Igual e Scrollável */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch ${mobileChartTab === "laps" ? "hidden lg:grid" : "grid"}`}>
            <div className={`h-[500px] sm:h-[580px] ${mobileChartTab === "pace" ? "block" : "hidden lg:block"}`}>
              {hasRacePace || sessionResults.length > 0 ? (
                <RacePaceChart data={racePace} sessionResults={sessionResults} className="h-full" />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-8 text-center text-sm text-f1-subtle h-full flex items-center justify-center">
                  Dados de ritmo de corrida indisponíveis para esta sessão.
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
                <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-8 text-center text-sm text-f1-subtle h-full flex items-center justify-center">
                  Dados de estratégia de pneus indisponíveis para esta sessão.
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
              <div className="md:hidden flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-[11px] text-f1-subtle">
                <span className="flex items-center gap-1.5">
                  <ChevronDown className="h-3.5 w-3.5 text-f1-red shrink-0" />
                  <span>Toque em qualquer linha para expandir detalhes e perfil</span>
                </span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B10] shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-f1-subtle">
                      <th className="py-3 pl-3 sm:pl-6 pr-1.5 sm:pr-3 w-10 sm:w-16 text-center">Pos</th>
                      {isRaceSession && <th className="py-3.5 px-3 w-20 text-center hidden md:table-cell">Largada</th>}
                      {isRaceSession && <th className="py-3 px-1.5 sm:px-3 w-10 sm:w-20 text-center">+/-</th>}
                      <th className="py-3 px-2 sm:px-4">Piloto</th>
                      <th className="py-3.5 px-4 hidden md:table-cell">Equipe</th>
                      <th className="py-3.5 px-3 text-center hidden lg:table-cell">Nº</th>
                      <th className={`py-3 px-2 sm:px-4 text-right ${isRaceSession ? "hidden md:table-cell" : ""}`}>
                        <span className="sm:hidden">Tempo</span>
                        <span className="hidden sm:inline">Melhor Volta / Tempo</span>
                      </th>
                      <th className="py-3 px-2 sm:px-4 text-right">
                        <span className="sm:hidden">Gap</span>
                        <span className="hidden sm:inline">Gap Líder</span>
                      </th>
                      <th className="py-3.5 px-4 text-right hidden lg:table-cell">Intervalo</th>
                      <th className="py-3.5 px-3 text-center hidden md:table-cell">Voltas</th>
                      {isRaceSession && <th className="py-3.5 px-3 text-center hidden md:table-cell">Paradas</th>}
                      {isRaceSession && <th className="py-3 pr-3 sm:pr-6 pl-2 sm:pl-3 text-right">Pts</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {sessionResults.map((row, index) => {
                      const pos = row.finishing_position ?? index + 1;
                      const teamColor = row.team_color || "#E10600";
                      const isFastestLap = Boolean(row.best_lap && row.best_lap === fastestLap);
                      const rowId = row.driver_id || row.driver_full_name || index;
                      const isExpanded = expandedDriverRow === rowId;

                      return (
                        <React.Fragment key={`${row.session_sk}-${row.driver_id || index}`}>
                          <tr
                            onClick={() => setExpandedDriverRow(isExpanded ? null : rowId)}
                            className={`group transition-colors cursor-pointer md:cursor-default ${
                              isExpanded ? "bg-white/[0.06] md:bg-transparent" : "hover:bg-white/[0.03]"
                            }`}
                          >
                          {/* Posição */}
                          <td className="py-2.5 sm:py-3.5 pl-3 sm:pl-6 pr-1.5 sm:pr-3 text-center font-bold">
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs ${pos === 1
                                  ? "bg-amber-400 font-black text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                  : pos === 2
                                    ? "bg-slate-300 font-black text-black"
                                    : pos === 3
                                      ? "bg-amber-700 font-black text-white"
                                      : "bg-white/5 text-gray-300"
                                }`}
                            >
                              {pos}
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
                            <td className="py-2.5 sm:py-3.5 px-1 sm:px-3 text-center">
                              {row.delta_position != null ? (
                                row.delta_position > 0 ? (
                                  <span
                                    title={`Largou em P${row.grid_position} e ganhou ${row.delta_position} posição(ões)`}
                                    className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-1 sm:px-1.5 py-0.5 font-mono text-[11px] sm:text-xs font-bold text-emerald-400 shadow-sm"
                                  >
                                    <ArrowUp className="h-3 w-3 stroke-[2.5]" />
                                    +{row.delta_position}
                                  </span>
                                ) : row.delta_position < 0 ? (
                                  <span
                                    title={`Largou em P${row.grid_position} e perdeu ${Math.abs(row.delta_position)} posição(ões)`}
                                    className="inline-flex items-center gap-0.5 rounded-md bg-rose-500/10 border border-rose-500/25 px-1 sm:px-1.5 py-0.5 font-mono text-[11px] sm:text-xs font-bold text-rose-400 shadow-sm"
                                  >
                                    <ArrowDown className="h-3 w-3 stroke-[2.5]" />
                                    {row.delta_position}
                                  </span>
                                ) : (
                                  <span
                                    title={`Largou em P${row.grid_position} e manteve a posição`}
                                    className="inline-flex items-center gap-0.5 rounded-md bg-white/5 border border-white/10 px-1 sm:px-1.5 py-0.5 font-mono text-[11px] sm:text-xs font-bold text-white/40"
                                  >
                                    <Minus className="h-3 w-3 stroke-[2.5]" />
                                    0
                                  </span>
                                )
                              ) : (
                                <span className="text-f1-subtle text-xs">—</span>
                              )}
                            </td>
                          )}

                          {/* Piloto */}
                          <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 max-w-[160px] sm:max-w-none">
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                              <DriverLink
                                driverId={row.driver_id}
                                driverName={row.driver_full_name}
                                className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 transition-transform hover:scale-105 pointer-events-none md:pointer-events-auto"
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
                                  <span className="font-mono text-[9px] font-black text-white">
                                    {row.driver_full_name.slice(0, 3).toUpperCase()}
                                  </span>
                                )}
                              </DriverLink>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1.5 min-w-0">
                                  <DriverLink
                                    driverId={row.driver_id}
                                    driverName={row.driver_full_name}
                                    className="font-bold text-white hover:text-f1-red transition-colors block truncate pointer-events-none md:pointer-events-auto"
                                    title={`Ver perfil de ${row.driver_full_name}`}
                                  >
                                    {row.driver_full_name}
                                  </DriverLink>
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
                                <span className="block md:hidden text-[10px] text-f1-subtle truncate">
                                  {row.team_name}
                                </span>
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

                          {/* Melhor Volta / Tempo */}
                          <td className={`py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-mono font-semibold whitespace-nowrap ${isRaceSession ? "hidden md:table-cell" : ""}`}>
                            {isFastestLap ? (
                              <div className="inline-flex items-center gap-1 justify-end">
                                <span
                                  title="Volta Mais Rápida da Sessão (Fastest Lap)"
                                  className="inline-flex items-center gap-1 rounded-md bg-purple-500/20 border border-purple-500/40 px-1.5 sm:px-2 py-0.5 text-purple-300 font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                                >
                                  <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-400 shrink-0" />
                                  <span>{row.best_lap}</span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-white/80">{row.best_lap || "—"}</span>
                            )}
                          </td>

                          {/* Gap Líder */}
                          <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-mono text-gray-300 whitespace-nowrap">
                            {row.gap_to_leader || "—"}
                          </td>

                          {/* Intervalo */}
                          <td className="py-3.5 px-4 text-right font-mono text-f1-subtle hidden lg:table-cell">
                            {row.interval_to_car_ahead || "—"}
                          </td>

                          {/* Voltas */}
                          <td className="py-3.5 px-3 text-center font-mono font-semibold text-gray-200 hidden md:table-cell">
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
                            <td className="py-2.5 sm:py-3.5 pr-3 sm:pr-6 pl-2 sm:pl-3 text-right font-mono font-black text-white whitespace-nowrap">
                              {row.points ? (
                                <span className="rounded bg-white/10 px-1.5 sm:px-2 py-0.5 text-emerald-400">
                                  +{row.points}
                                </span>
                              ) : (
                                <span className="text-f1-subtle">0</span>
                              )}
                            </td>
                          )}
                        </tr>

                        {/* Accordion Expandível Mobile (< md): Detalhes de Telemetria e Estratégia */}
                        {isExpanded && (
                          <tr className="md:hidden bg-[#141420] border-b border-white/10 animate-fadeIn">
                            <td colSpan={12} className="p-3">
                              <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                  <TeamLink teamId={row.team_id} teamName={row.team_name} className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                                    <span className="font-bold text-white text-xs">{row.team_name || "—"}</span>
                                  </TeamLink>
                                  <span className="text-[11px] font-mono text-f1-subtle">
                                    Carro: <strong className="text-white">#{row.driver_number || "—"}</strong>
                                  </span>
                                </div>

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
                                        {row.gap_to_leader || "—"}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <DriverLink
                                  driverId={row.driver_id}
                                  driverName={row.driver_full_name}
                                  className="flex items-center justify-center gap-1.5 w-full py-2.5 min-h-[44px] rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors border border-white/10 active:scale-95"
                                >
                                  <span>Ver Perfil Completo do Piloto</span>
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
    </div>
  );
}
