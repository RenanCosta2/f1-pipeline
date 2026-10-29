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
  ArrowUpRight
} from "lucide-react";
import TyreStrategyChart from "@/components/TyreStrategyChart";
import RacePaceChart from "@/components/RacePaceChart";
import LapChart from "@/components/LapChart";
import IdealLapCard from "@/components/IdealLapCard";
import { DriverLink } from "@/lib/driverUtils";
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

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <div>
        <Link
          href={`/season?year=${year}&tab=races`}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-f1-subtle hover:text-white transition-colors"
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
              className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm self-start md:self-auto min-w-[260px] hover:border-white/25 transition-all"
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
      <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-3 scrollbar-thin">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-f1-subtle shrink-0 mr-2">
          Sessão:
        </span>
        {availableSessions.map((session) => {
          const isSelected = session === activeSession;
          return (
            <button
              key={session}
              onClick={() => changeSession(session)}
              className={`shrink-0 rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                isSelected
                  ? "bg-f1-red text-white"
                  : "border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white"
              }`}
            >
              {session === "Practice 1" && "Treino Livre 1"}
              {session === "Practice 2" && "Treino Livre 2"}
              {session === "Practice 3" && "Treino Livre 3"}
              {session === "Sprint Shootout" && "Qualificação Sprint"}
              {session === "Sprint Qualifying" && "Qualificação Sprint"}
              {session === "Sprint" && "Sprint"}
              {session === "Qualifying" && "Qualificação"}
              {session === "Race" && "Corrida"}
              {!["Practice 1", "Practice 2", "Practice 3", "Sprint Shootout", "Sprint Qualifying", "Qualifying", "Sprint", "Race"].includes(session) && session}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* LINHA 1: 4 CARDS KPI DE ALTO IMPACTO (BENTO GRID SUPERIOR)                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Vencedor / Pole Position / Líder */}
        <div className="rounded-xl border border-white/10 bg-[#111118] p-4 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              {isRaceSession ? "Vencedor (P1)" : isQualiSession ? "Pole Position (P1)" : "Líder da Sessão (P1)"}
            </span>
            {winner ? (
              <DriverLink driverId={winner.driver_id} driverName={winner.driver_full_name} className="group/wlink block">
                <h4 className="text-sm font-black text-white truncate mt-0.5 group-hover/wlink:text-f1-red transition-colors">
                  {winner.driver_full_name}
                </h4>
              </DriverLink>
            ) : (
              <h4 className="text-sm font-black text-white truncate mt-0.5">—</h4>
            )}
            <p className="text-[11px] text-f1-subtle truncate" style={{ color: winner?.team_color || undefined }}>
              {winner?.team_name || "—"}
            </p>
            {isRaceSession && winner?.points ? (
              <span className="inline-block mt-2 font-mono text-[11px] font-bold text-emerald-400">
                +{winner.points} pts
              </span>
            ) : winner?.best_lap ? (
              <span className="inline-block mt-2 font-mono text-[11px] font-bold text-purple-300">
                {winner.best_lap}
              </span>
            ) : null}
          </div>

          {winner ? (
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
                <span className="font-mono text-xs font-bold text-white">
                  {winner.driver_full_name.slice(0, 3).toUpperCase()}
                </span>
              )}
            </DriverLink>
          ) : (
            <div
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5"
              style={{ borderColor: "#E10600" }}
            >
              <span className="font-mono text-xs font-bold text-white">P1</span>
            </div>
          )}
        </div>

        {/* Card 2: Volta Mais Rápida (Purple Lap) */}
        <div className="rounded-xl border border-purple-500/30 bg-[#13111E] p-4 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              Volta Mais Rápida
            </span>
            <div className="font-mono text-base font-black text-white mt-1 tracking-tight">
              {fastestLap || "—"}
            </div>
            {fastestLapDriver ? (
              <DriverLink driverId={fastestLapDriver.driver_id} driverName={fastestLapDriver.driver_full_name} className="block">
                <p className="text-[11px] text-f1-subtle hover:text-purple-300 transition-colors truncate mt-0.5">
                  {fastestLapDriver.driver_full_name}
                </p>
              </DriverLink>
            ) : (
              <p className="text-[11px] text-f1-subtle truncate mt-0.5">—</p>
            )}
            {fastestLapDriver?.team_name ? (
              <TeamLink
                teamName={fastestLapDriver.team_name}
                className="text-[10px] text-purple-300/80 font-mono hover:text-white hover:underline transition-colors block truncate"
                title={`Ver perfil de ${fastestLapDriver.team_name}`}
              >
                {fastestLapDriver.team_name}
              </TeamLink>
            ) : null}
          </div>

          <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-wider px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20">
            FL
          </span>
        </div>

        {/* Card 3: Speed Trap (Corrida) ou Volta Ideal Teórica (Quali/Treino) ou Pilotos no Grid */}
        {isRaceSession ? (
          <div className="rounded-xl border border-amber-500/30 bg-[#14120C] p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Speed Trap Máximo
              </span>
              <div className="font-mono text-base font-black text-white mt-1 tracking-tight">
                {topSpeedRecord?.max_speed_trap ? `${Number(topSpeedRecord.max_speed_trap).toFixed(1)} km/h` : "—"}
              </div>
              {topSpeedRecord ? (
                <DriverLink driverName={topSpeedRecord.driver_full_name} className="block">
                  <p className="text-[11px] text-f1-subtle hover:text-amber-300 transition-colors truncate mt-0.5">
                    {topSpeedRecord.driver_full_name}
                  </p>
                </DriverLink>
              ) : (
                <p className="text-[11px] text-f1-subtle truncate mt-0.5">—</p>
              )}
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-amber-400/80 font-mono">
                {topSpeedRecord?.team_name ? (
                  <TeamLink
                    teamName={topSpeedRecord.team_name}
                    className="hover:text-white hover:underline transition-colors truncate"
                    title={`Ver perfil de ${topSpeedRecord.team_name}`}
                  >
                    {topSpeedRecord.team_name}
                  </TeamLink>
                ) : null}
                {topSpeedRecord?.max_speed_fl && (
                  <span className="text-white/40">• FL: {topSpeedRecord.max_speed_fl} km/h</span>
                )}
              </div>
            </div>

            <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
              TRAP
            </span>
          </div>
        ) : bestSectors?.theoreticalLap ? (
          <div className="rounded-xl border border-purple-500/30 bg-[#13111E] p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Volta Ideal Teórica
              </span>
              <div className="font-mono text-base font-black text-white mt-1 tracking-tight">
                {bestSectors.theoreticalLap}
              </div>
              <p className="text-[11px] text-purple-300/80 truncate mt-0.5 font-mono">
                Soma S1 + S2 + S3
              </p>
            </div>

            <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-wider px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20">
              IDEAL
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#111118] p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Pilotos no Grid
              </span>
              <div className="font-mono text-base font-black text-white mt-1">
                {sessionResults.length} pilotos
              </div>
              <p className="text-[11px] text-f1-subtle mt-0.5">
                Classificados na sessão
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/10">
              GRID
            </span>
          </div>
        )}

        {/* Card 4: Maior Escalador (Corrida) ou Eficiência Teórica (Quali/Treino) ou Resumo */}
        {isRaceSession && biggestClimber ? (
          <div className="rounded-xl border border-emerald-500/30 bg-[#101716] p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Maior Escalador
              </span>
              <div className="font-mono text-base font-black text-white mt-1 tracking-tight flex items-baseline gap-1.5">
                <span className="text-emerald-400">+{biggestClimber.delta_position}</span>
                <span className="text-xs text-f1-subtle font-mono">
                  (P{biggestClimber.grid_position} ➔ P{biggestClimber.finishing_position})
                </span>
              </div>
              <DriverLink driverId={biggestClimber.driver_id} driverName={biggestClimber.driver_full_name} className="block">
                <p className="text-[11px] text-white/90 hover:text-emerald-300 transition-colors truncate font-semibold mt-0.5">
                  {biggestClimber.driver_full_name}
                </p>
              </DriverLink>
              {biggestClimber.team_name ? (
                <TeamLink
                  teamName={biggestClimber.team_name}
                  className="text-[10px] font-mono block truncate hover:text-white hover:underline transition-colors"
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
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
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
                <span className="font-mono text-xs font-bold text-emerald-400">
                  +{biggestClimber.delta_position}
                </span>
              )}
            </DriverLink>
          </div>
        ) : isQualiSession && mostEfficientDriver ? (
          <div className="rounded-xl border border-emerald-500/30 bg-[#101716] p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Maior Eficiência
              </span>
              <div className="font-mono text-base font-black text-white mt-1 tracking-tight">
                {mostEfficientDriver.delta_ideal_lap === "0:00:000" || mostEfficientDriver.delta_ideal_lap === "0:00.000"
                  ? "100% Perfeita"
                  : `+${mostEfficientDriver.delta_ideal_lap}`}
              </div>
              <DriverLink driverName={mostEfficientDriver.driver_full_name} className="block">
                <p className="text-[11px] text-white/90 hover:text-emerald-300 transition-colors truncate font-semibold mt-0.5">
                  {mostEfficientDriver.driver_full_name}
                </p>
              </DriverLink>
              <span
                className="text-[10px] font-mono block truncate"
                style={{ color: mostEfficientDriver.team_color || undefined }}
              >
                {mostEfficientDriver.team_name}
              </span>
            </div>

            <DriverLink
              driverName={mostEfficientDriver.driver_full_name}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
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
                <span className="font-mono text-xs font-bold text-emerald-400">EFF</span>
              )}
            </DriverLink>
          </div>
        ) : isPracticeSession && p2Driver ? (
          <div className="rounded-xl border border-sky-500/30 bg-[#111118] p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Margem para o P2
              </span>
              <div className="font-mono text-base font-black text-white mt-1 tracking-tight flex items-baseline gap-1.5">
                <span className="text-sky-400">{p2Driver.gap_to_leader || "—"}</span>
              </div>
              <DriverLink driverId={p2Driver.driver_id} driverName={p2Driver.driver_full_name} className="block">
                <p className="text-[11px] text-white/90 hover:text-sky-300 transition-colors truncate font-semibold mt-0.5">
                  {p2Driver.driver_full_name} <span className="text-f1-subtle font-normal">(P2)</span>
                </p>
              </DriverLink>
            </div>

            <DriverLink
              driverId={p2Driver.driver_id}
              driverName={p2Driver.driver_full_name}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 bg-white/5 transition-transform hover:scale-105"
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
                <span className="font-mono text-xs font-bold text-sky-400">P2</span>
              )}
            </DriverLink>
          </div>
        ) : isPracticeSession ? (
          <div className="rounded-xl border border-white/10 bg-[#111118] p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                Pilotos no Treino
              </span>
              <div className="font-mono text-base font-black text-white mt-1">
                {sessionResults.length} pilotos
              </div>
              <p className="text-[11px] text-f1-subtle mt-0.5">
                Tempos cronometrados
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/10">
              FP
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#111118] p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Resumo da Prova
              </span>
              <div className="font-mono text-base font-black text-white mt-1">
                {totalLaps} voltas
              </div>
              <div className="flex items-center gap-2 text-[11px] text-f1-subtle mt-0.5 font-mono">
                <span>{finishedCount} finalizados</span>
                {isRaceSession && <span>• {avgPitStops} pits médios</span>}
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/10">
              RACE
            </span>
          </div>
        )}
      </div>

      {/* Barra de Alternância de Abas: Dashboard Analítico vs Volta Ideal vs Tabela FIA */}
      <div className="flex items-center justify-between border-b border-white/10 overflow-x-auto scrollbar-none gap-6">
        <div className="flex items-center gap-6">
          {/* Classificação Oficial sempre disponível em 1º lugar à esquerda */}
          <button
            onClick={() => setViewMode("table")}
            className={`pb-3 pt-1 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2 border-b-2 -mb-[1px] ${
              effectiveViewMode === "table"
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
              className={`pb-3 pt-1 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2 border-b-2 -mb-[1px] ${
                effectiveViewMode === "dashboard"
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
              className={`pb-3 pt-1 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2 border-b-2 -mb-[1px] ${
                effectiveViewMode === "ideal"
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
        <div className="space-y-6 animate-fadeIn">
          {/* Gráfico de Evolução Volta a Volta em Largura Total */}
          <div className="w-full">
            {hasLapData ? (
              <LapChart data={lapData} sessionResults={sessionResults} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-8 text-center text-sm text-f1-subtle">
                Telemetria volta a volta em processamento para esta sessão.
              </div>
            )}
          </div>

          {/* Tabelas de Ritmo e de Estratégia com Altura Igual e Scrollável */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="h-[580px]">
              {hasRacePace || sessionResults.length > 0 ? (
                <RacePaceChart data={racePace} sessionResults={sessionResults} className="h-full" />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-8 text-center text-sm text-f1-subtle h-full flex items-center justify-center">
                  Dados de ritmo de corrida indisponíveis para esta sessão.
                </div>
              )}
            </div>

            <div className="h-[580px]">
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
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B10] shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-black uppercase tracking-wider text-f1-subtle">
                      <th className="py-3.5 pl-6 pr-3 w-16 text-center">Pos</th>
                      {isRaceSession && <th className="py-3.5 px-3 w-20 text-center">Largada</th>}
                      {isRaceSession && <th className="py-3.5 px-3 w-20 text-center">+/-</th>}
                      <th className="py-3.5 px-4">Piloto</th>
                      <th className="py-3.5 px-4">Equipe</th>
                      <th className="py-3.5 px-3 text-center">Nº</th>
                      <th className="py-3.5 px-4 text-right">Melhor Volta / Tempo</th>
                      <th className="py-3.5 px-4 text-right">Gap Líder</th>
                      <th className="py-3.5 px-4 text-right">Intervalo</th>
                      <th className="py-3.5 px-3 text-center">Voltas</th>
                      {isRaceSession && <th className="py-3.5 px-3 text-center">Paradas</th>}
                      {isRaceSession && <th className="py-3.5 pr-6 pl-3 text-right">Pts</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {sessionResults.map((row, index) => {
                      const pos = row.finishing_position ?? index + 1;
                      const teamColor = row.team_color || "#E10600";
                      const isFastestLap = Boolean(row.best_lap && row.best_lap === fastestLap);

                      return (
                        <tr
                          key={`${row.session_sk}-${row.driver_id || index}`}
                          className="hover:bg-white/[0.03] transition-colors"
                        >
                          {/* Posição */}
                          <td className="py-3.5 pl-6 pr-3 text-center font-bold">
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs ${
                                pos === 1
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
                            <td className="py-3.5 px-3 text-center font-mono">
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
                            <td className="py-3.5 px-3 text-center">
                              {row.delta_position != null ? (
                                row.delta_position > 0 ? (
                                  <span
                                    title={`Largou em P${row.grid_position} e ganhou ${row.delta_position} posição(ões)`}
                                    className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 font-mono text-xs font-bold text-emerald-400 shadow-sm"
                                  >
                                    <ArrowUp className="h-3 w-3 stroke-[2.5]" />
                                    +{row.delta_position}
                                  </span>
                                ) : row.delta_position < 0 ? (
                                  <span
                                    title={`Largou em P${row.grid_position} e perdeu ${Math.abs(row.delta_position)} posição(ões)`}
                                    className="inline-flex items-center gap-0.5 rounded-md bg-rose-500/10 border border-rose-500/25 px-1.5 py-0.5 font-mono text-xs font-bold text-rose-400 shadow-sm"
                                  >
                                    <ArrowDown className="h-3 w-3 stroke-[2.5]" />
                                    {row.delta_position}
                                  </span>
                                ) : (
                                  <span
                                    title={`Largou em P${row.grid_position} e manteve a posição`}
                                    className="inline-flex items-center gap-0.5 rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 font-mono text-xs font-bold text-white/40"
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
                          <td className="py-3.5 px-4">
                            <DriverLink
                              driverId={row.driver_id}
                              driverName={row.driver_full_name}
                              className="flex items-center gap-2.5 group/driver"
                              title={`Ver perfil de ${row.driver_full_name}`}
                            >
                              <div
                                className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 transition-transform group-hover/driver:scale-105"
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
                              <span className="font-bold text-white group-hover/driver:text-f1-red transition-colors">
                                {row.driver_full_name}
                              </span>
                            </DriverLink>
                          </td>

                          {/* Equipe */}
                          <td className="py-3.5 px-4">
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
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-f1-subtle">
                            #{row.driver_number}
                          </td>

                          {/* Melhor Volta / Tempo */}
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">
                            {isFastestLap ? (
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <span
                                  title="Volta Mais Rápida da Sessão (Fastest Lap)"
                                  className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-purple-300 font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                                >
                                  <Timer className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                  <span>{row.best_lap}</span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-white/80">{row.best_lap || "—"}</span>
                            )}
                          </td>

                          {/* Gap Líder */}
                          <td className="py-3.5 px-4 text-right font-mono text-gray-300">
                            {row.gap_to_leader || "—"}
                          </td>

                          {/* Intervalo */}
                          <td className="py-3.5 px-4 text-right font-mono text-f1-subtle">
                            {row.interval_to_car_ahead || "—"}
                          </td>

                          {/* Voltas */}
                          <td className="py-3.5 px-3 text-center font-mono font-semibold text-gray-200">
                            {row.laps_completed ?? "—"}
                          </td>

                          {/* Paradas (Corrida) */}
                          {isRaceSession && (
                            <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-400">
                              {row.stops ?? 0}
                            </td>
                          )}

                          {/* Pontos (Corrida) */}
                          {isRaceSession && (
                            <td className="py-3.5 pr-6 pl-3 text-right font-mono font-black text-white">
                              {row.points ? (
                                <span className="rounded bg-white/10 px-2 py-0.5 text-emerald-400">
                                  +{row.points}
                                </span>
                              ) : (
                                <span className="text-f1-subtle">0</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
