"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flag, ChevronRight, ChevronDown, Zap, Award, Clock, Timer, TrendingUp, ArrowUpRight } from "lucide-react";
import { SessionSummary, RaceWeekendInfo } from "@/types/f1";
import DriverLink from "@/lib/driverUtils";
import TeamLink from "@/lib/teamUtils";
import CircuitLink from "@/lib/circuitUtils";
import { getTeamColor } from "./StandingsWidget";

interface Props {
  lastRaceResults: SessionSummary[];
  upcomingRace: RaceWeekendInfo;
  year?: number;
  onOpenSchedule: () => void;
}

function parseLapTimeToSeconds(lapTimeStr?: string | null): number | null {
  if (!lapTimeStr) return null;
  const clean = lapTimeStr.trim();
  if (!clean || clean === "-" || clean === "—") return null;

  const colonParts = clean.split(":");
  if (colonParts.length === 3) {
    const hours = parseFloat(colonParts[0]);
    const mins = parseFloat(colonParts[1]);
    const secs = parseFloat(colonParts[2]);
    if (!isNaN(hours) && !isNaN(mins) && !isNaN(secs)) {
      return hours * 3600 + mins * 60 + secs;
    }
  } else if (colonParts.length === 2) {
    const mins = parseFloat(colonParts[0]);
    const secs = parseFloat(colonParts[1]);
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs;
    }
  } else if (colonParts.length === 1) {
    const secs = parseFloat(colonParts[0]);
    if (!isNaN(secs)) return secs;
  }
  return null;
}

function formatLapTimeDisplay(lapTimeStr?: string | null): string {
  if (!lapTimeStr) return "—";
  const clean = lapTimeStr.trim();
  if (clean.startsWith("00:")) {
    return clean.replace(/^00:0?/, "");
  }
  return clean;
}

export default function BetweenRacesView({
  lastRaceResults = [],
  upcomingRace,
  year,
  onOpenSchedule
}: Props) {
  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const lastRaceWinner = lastRaceResults[0];
  const lastRacePodium = lastRaceResults.slice(0, 3);

  // Fastest Lap (menor tempo de volta numérico)
  const fastestLapResult = useMemo(() => {
    const valid = [...lastRaceResults]
      .map((r) => ({
        result: r,
        secs: parseLapTimeToSeconds(r.best_lap),
      }))
      .filter((item): item is { result: SessionSummary; secs: number } => item.secs !== null && item.secs > 0);

    if (valid.length === 0) return null;
    valid.sort((a, b) => a.secs - b.secs);
    return valid[0].result;
  }, [lastRaceResults]);

  // Biggest Climber (delta_position > 0, maior escalador)
  const biggestClimber = useMemo(() => {
    const valid = [...lastRaceResults].filter((r) => (r.delta_position ?? 0) > 0);
    if (valid.length === 0) return null;
    return valid.sort((a, b) => {
      const deltaDiff = (b.delta_position || 0) - (a.delta_position || 0);
      if (deltaDiff !== 0) return deltaDiff;
      return (a.finishing_position || 99) - (b.finishing_position || 99);
    })[0];
  }, [lastRaceResults]);

  return (
    <div className="space-y-5 sm:space-y-8 animate-fadeIn">
      {/* Previous Grand Prix Recap */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-f1-subtle">
            <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
            <span>Último GP Concluído</span>
          </div>
          {lastRaceWinner && (
            <Link
              href={`/season/round/${lastRaceWinner.round_number}?year=${year || lastRaceWinner.year}`}
              className="group inline-flex min-h-[44px] sm:min-h-0 items-center gap-1 rounded-xl sm:rounded-none border sm:border-0 border-f1-red/30 bg-f1-red/10 sm:bg-transparent px-3 sm:px-0 py-1.5 sm:py-0 text-[11px] sm:text-xs font-bold text-f1-red hover:text-red-400 active:scale-[0.98] transition-all"
            >
              <span className="sm:hidden">Análise completa</span>
              <span className="hidden sm:inline">Ver análise completa da corrida</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        <div>
          <h2 className="text-xl sm:text-3xl font-black uppercase text-white leading-tight">
            {lastRaceWinner?.official_event_name || "Formula 1 Grand Prix"}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-f1-subtle font-medium mt-0.5 sm:mt-1">
            <CircuitLink
              circuitName={lastRaceWinner?.location || lastRaceWinner?.country}
              className="hover:text-white hover:underline transition-colors"
              title={`Ver circuito em ${lastRaceWinner?.location || lastRaceWinner?.country}`}
            >
              <span>{lastRaceWinner?.location || "Local"}, {lastRaceWinner?.country || "País"}</span>
            </CircuitLink>
            <span>·</span>
            <span className="font-mono tabular-nums">Round {lastRaceWinner?.round_number || 14}</span>
          </div>
        </div>

        {/* Visual Podium (Compacto em < lg para proteger tablets com sidebar, P2-P1-P3 completo em lg+) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
          {/* P2 */}
          {lastRacePodium[1] && (
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#13131A] p-3 lg:p-4 2xl:p-5 order-2 lg:order-1 flex flex-col justify-between min-w-0">
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: getTeamColor(lastRacePodium[1].team_name, lastRacePodium[1].team_color) }}
              />
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 2xl:gap-3">
                  <DriverLink driverId={lastRacePodium[1].driver_id} driverName={lastRacePodium[1].driver_full_name}>
                    <div
                      className="relative h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 shrink-0 overflow-hidden rounded-full border bg-black/40 transition-transform hover:scale-105"
                      style={{ borderColor: getTeamColor(lastRacePodium[1].team_name, lastRacePodium[1].team_color) }}
                    >
                      {lastRacePodium[1].driver_headshot_url ? (
                        <img
                          src={lastRacePodium[1].driver_headshot_url}
                          alt={lastRacePodium[1].driver_full_name}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-mono text-[10px] lg:text-xs font-black text-white/70">
                          {lastRacePodium[1].driver_full_name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </DriverLink>
                  <span className="text-lg lg:text-2xl 2xl:text-3xl font-black text-white/40 font-mono">2º</span>
                </div>
                <span className="lg:hidden font-mono tabular-nums text-[11px] font-black text-white/90 bg-white/5 px-1.5 py-0.5 rounded">
                  +{lastRacePodium[1].points || 18} pts
                </span>
                <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                  <span className="font-mono tabular-nums text-[11px] text-white/40 uppercase font-semibold">P2</span>
                  <DriverLink
                    driverId={lastRacePodium[1].driver_id}
                    driverName={lastRacePodium[1].driver_full_name}
                    className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 px-1.5 2xl:px-2 py-0.5 text-[10px] font-bold text-white/80 hover:bg-white/15 hover:text-white transition-all group"
                    title={`Ver perfil de ${lastRacePodium[1].driver_full_name}`}
                  >
                    <span className="hidden 2xl:inline">Perfil</span>
                    <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </DriverLink>
                </div>
              </div>
              <div className="mt-2 lg:mt-3">
                <DriverLink driverId={lastRacePodium[1].driver_id} driverName={lastRacePodium[1].driver_full_name}>
                  <h3 className="text-xs sm:text-sm lg:text-base 2xl:text-lg font-black text-white truncate hover:text-white hover:underline decoration-white/40 transition-colors">
                    {lastRacePodium[1].driver_full_name}
                  </h3>
                </DriverLink>
                <TeamLink
                  teamName={lastRacePodium[1].team_name}
                  teamId={lastRacePodium[1].team_id}
                  className="text-[10px] sm:text-xs font-medium text-f1-subtle hover:text-white transition-colors block truncate mt-0.5"
                >
                  {lastRacePodium[1].team_name}
                </TeamLink>
              </div>
              <div className="hidden lg:flex mt-4 pt-3 border-t border-white/5 items-center justify-between text-xs">
                <span className="text-white/40">Pontos</span>
                <span className="font-mono tabular-nums font-black text-white">+{lastRacePodium[1].points || 18} pts</span>
              </div>
            </div>
          )}

          {/* P1 Winner (Horizontal enxuto em < lg, Card Central em Destaque em lg+) */}
          {lastRaceWinner && (
            <div className="col-span-2 lg:col-span-1 relative overflow-hidden rounded-xl border border-amber-500/40 bg-[#14131A] p-3 sm:p-4 2xl:p-6 order-1 lg:order-2 flex flex-row lg:flex-col items-center lg:items-stretch justify-between gap-3 lg:min-h-[205px] 2xl:min-h-[220px] min-w-0">
              <div className="absolute inset-x-0 top-0 h-1 bg-amber-400" />

              {/* Layout Mobile & Tablet (< lg): Tudo em uma única linha horizontal compacta */}
              <div className="flex lg:hidden items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <DriverLink driverId={lastRaceWinner.driver_id} driverName={lastRaceWinner.driver_full_name}>
                    <div className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-full border-2 border-amber-400 bg-black/40">
                      {lastRaceWinner.driver_headshot_url ? (
                        <img
                          src={lastRaceWinner.driver_headshot_url}
                          alt={lastRaceWinner.driver_full_name}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-mono text-xs font-black text-amber-300">
                          {lastRaceWinner.driver_full_name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </DriverLink>
                  <span className="text-2xl font-black text-amber-400 font-mono shrink-0">1º</span>
                  <div className="min-w-0">
                    <DriverLink driverId={lastRaceWinner.driver_id} driverName={lastRaceWinner.driver_full_name}>
                      <h3 className="text-sm sm:text-base font-black text-white truncate">
                        {lastRaceWinner.driver_full_name}
                      </h3>
                    </DriverLink>
                    <TeamLink
                      teamName={lastRaceWinner.team_name}
                      teamId={lastRaceWinner.team_id}
                      className="text-[11px] sm:text-xs font-semibold text-amber-300 truncate block"
                    >
                      {lastRaceWinner.team_name}
                    </TeamLink>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="block font-mono text-[9px] font-bold uppercase tracking-wider text-amber-400/90">
                    Vencedor
                  </span>
                  <span className="font-mono tabular-nums font-black text-amber-400 text-sm sm:text-base">
                    +{lastRaceWinner.points || 25} pts
                  </span>
                </div>
              </div>

              {/* Layout Desktop (lg+): Card P1 Vertical Clássico */}
              <div className="hidden lg:flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-2.5 2xl:gap-3">
                  <DriverLink driverId={lastRaceWinner.driver_id} driverName={lastRaceWinner.driver_full_name}>
                    <div className="relative h-11 w-11 2xl:h-14 2xl:w-14 shrink-0 overflow-hidden rounded-full border-2 border-amber-400 bg-black/40 transition-transform hover:scale-105">
                      {lastRaceWinner.driver_headshot_url ? (
                        <img
                          src={lastRaceWinner.driver_headshot_url}
                          alt={lastRaceWinner.driver_full_name}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-mono text-sm font-black text-amber-300">
                          {lastRaceWinner.driver_full_name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </DriverLink>
                  <span className="text-3xl 2xl:text-4xl font-black text-amber-400 font-mono">1</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono tabular-nums text-[10px] 2xl:text-[11px] font-bold uppercase tracking-wider text-amber-400 whitespace-nowrap">
                    P1 · Vencedor
                  </span>
                  <DriverLink
                    driverId={lastRaceWinner.driver_id}
                    driverName={lastRaceWinner.driver_full_name}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 2xl:px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20 hover:text-white transition-all group"
                    title={`Ver perfil completo de ${lastRaceWinner.driver_full_name}`}
                  >
                    <span className="hidden 2xl:inline">Perfil</span>
                    <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </DriverLink>
                </div>
              </div>
              <div className="hidden lg:block mt-3 2xl:mt-4">
                <DriverLink driverId={lastRaceWinner.driver_id} driverName={lastRaceWinner.driver_full_name}>
                  <h3 className="text-lg 2xl:text-xl font-black text-white truncate hover:text-amber-300 transition-colors">
                    {lastRaceWinner.driver_full_name}
                  </h3>
                </DriverLink>
                <TeamLink
                  teamName={lastRaceWinner.team_name}
                  teamId={lastRaceWinner.team_id}
                  className="text-xs font-semibold text-amber-300 hover:text-white transition-colors block truncate mt-0.5"
                >
                  {lastRaceWinner.team_name}
                </TeamLink>
              </div>
              <div className="hidden lg:flex mt-3 2xl:mt-4 pt-3 border-t border-amber-400/20 items-center justify-between text-xs gap-2">
                <span className="text-white/60 truncate">Pontuação máxima</span>
                <span className="font-mono tabular-nums font-black text-amber-400 text-sm 2xl:text-base shrink-0">+{lastRaceWinner.points || 25} pts</span>
              </div>
            </div>
          )}

          {/* P3 */}
          {lastRacePodium[2] && (
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#13131A] p-3 lg:p-4 2xl:p-5 order-3 lg:order-3 flex flex-col justify-between min-w-0">
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: getTeamColor(lastRacePodium[2].team_name, lastRacePodium[2].team_color) }}
              />
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 2xl:gap-3">
                  <DriverLink driverId={lastRacePodium[2].driver_id} driverName={lastRacePodium[2].driver_full_name}>
                    <div
                      className="relative h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 shrink-0 overflow-hidden rounded-full border bg-black/40 transition-transform hover:scale-105"
                      style={{ borderColor: getTeamColor(lastRacePodium[2].team_name, lastRacePodium[2].team_color) }}
                    >
                      {lastRacePodium[2].driver_headshot_url ? (
                        <img
                          src={lastRacePodium[2].driver_headshot_url}
                          alt={lastRacePodium[2].driver_full_name}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-mono text-[10px] lg:text-xs font-black text-white/70">
                          {lastRacePodium[2].driver_full_name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </DriverLink>
                  <span className="text-lg lg:text-2xl 2xl:text-3xl font-black text-white/40 font-mono">3º</span>
                </div>
                <span className="lg:hidden font-mono tabular-nums text-[11px] font-black text-white/90 bg-white/5 px-1.5 py-0.5 rounded">
                  +{lastRacePodium[2].points || 15} pts
                </span>
                <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                  <span className="font-mono tabular-nums text-[11px] text-white/40 uppercase font-semibold">P3</span>
                  <DriverLink
                    driverId={lastRacePodium[2].driver_id}
                    driverName={lastRacePodium[2].driver_full_name}
                    className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 px-1.5 2xl:px-2 py-0.5 text-[10px] font-bold text-white/80 hover:bg-white/15 hover:text-white transition-all group"
                    title={`Ver perfil de ${lastRacePodium[2].driver_full_name}`}
                  >
                    <span className="hidden 2xl:inline">Perfil</span>
                    <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </DriverLink>
                </div>
              </div>
              <div className="mt-2 lg:mt-3">
                <DriverLink driverId={lastRacePodium[2].driver_id} driverName={lastRacePodium[2].driver_full_name}>
                  <h3 className="text-xs sm:text-sm lg:text-base 2xl:text-lg font-black text-white truncate hover:text-white hover:underline decoration-white/40 transition-colors">
                    {lastRacePodium[2].driver_full_name}
                  </h3>
                </DriverLink>
                <TeamLink
                  teamName={lastRacePodium[2].team_name}
                  teamId={lastRacePodium[2].team_id}
                  className="text-[10px] sm:text-xs font-medium text-f1-subtle hover:text-white transition-colors block truncate mt-0.5"
                >
                  {lastRacePodium[2].team_name}
                </TeamLink>
              </div>
              <div className="hidden lg:flex mt-4 pt-3 border-t border-white/5 items-center justify-between text-xs">
                <span className="text-white/40">Pontos</span>
                <span className="font-mono tabular-nums font-black text-white">+{lastRacePodium[2].points || 15} pts</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Highlights: Accordion expansível no mobile (< sm) para priorizar a Próxima Etapa acima da dobra */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setHighlightsOpen(!highlightsOpen)}
            aria-expanded={highlightsOpen}
            className="sm:hidden w-full min-h-[46px] flex items-center justify-between rounded-xl border border-white/10 bg-[#12121A] px-3.5 py-2.5 text-left active:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Timer className="h-4 w-4 text-purple-400 shrink-0" />
              <span className="text-xs font-bold text-white truncate">
                Volta Rápida & Maior Escalador
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-f1-subtle transition-transform duration-200 shrink-0 ${
                highlightsOpen ? "rotate-180 text-f1-red" : ""
              }`}
            />
          </button>

          <div
            className={`${
              highlightsOpen ? "grid mt-2.5" : "hidden"
            } sm:grid sm:mt-0 grid-cols-2 gap-2.5 sm:gap-4`}
          >
          {/* Card: Volta Mais Rápida */}
          <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-[#13111E] p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 pb-2 sm:pb-2.5 border-b border-purple-500/20">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-purple-400 shrink-0" />
                <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300 truncate">
                  Volta Rápida
                </span>
              </div>
              {fastestLapResult && (
                <span className="font-mono tabular-nums text-[11px] sm:text-sm font-black text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 sm:px-2 py-0.5 rounded shrink-0">
                  {formatLapTimeDisplay(fastestLapResult.best_lap)}
                </span>
              )}
            </div>

            {fastestLapResult ? (
              <div className="mt-2.5 sm:mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <DriverLink driverId={fastestLapResult.driver_id} driverName={fastestLapResult.driver_full_name}>
                    <div
                      className="relative h-8 w-8 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-full border-2 bg-black/40 transition-transform hover:scale-105"
                      style={{
                        borderColor: getTeamColor(fastestLapResult.team_name, fastestLapResult.team_color),
                      }}
                    >
                      {fastestLapResult.driver_headshot_url ? (
                        <img
                          src={fastestLapResult.driver_headshot_url}
                          alt={fastestLapResult.driver_full_name}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-mono text-[10px] sm:text-xs font-black text-purple-300">
                          {fastestLapResult.driver_full_name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </DriverLink>
                  <div className="min-w-0">
                    <DriverLink driverId={fastestLapResult.driver_id} driverName={fastestLapResult.driver_full_name}>
                      <h4 className="text-xs sm:text-base font-black text-white truncate hover:text-purple-300 transition-colors">
                        {fastestLapResult.driver_full_name}
                      </h4>
                    </DriverLink>
                    <TeamLink
                      teamName={fastestLapResult.team_name}
                      teamId={fastestLapResult.team_id}
                      className="text-[10px] sm:text-xs font-medium text-f1-subtle hover:text-purple-300 hover:underline transition-colors truncate block"
                    >
                      {fastestLapResult.team_name}
                    </TeamLink>
                  </div>
                </div>

                <DriverLink
                  driverId={fastestLapResult.driver_id}
                  driverName={fastestLapResult.driver_full_name}
                  className="hidden sm:inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all group shrink-0"
                  title={`Ver perfil de ${fastestLapResult.driver_full_name}`}
                >
                  <span>Perfil</span>
                  <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </DriverLink>
              </div>
            ) : (
              <div className="mt-2.5 py-2 text-center text-[11px] text-f1-subtle font-medium">
                Sem registro
              </div>
            )}
          </div>

          {/* Card: Maior Escalador */}
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-[#101716] p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 pb-2 sm:pb-2.5 border-b border-emerald-500/20">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300 truncate">
                  Escalador
                </span>
              </div>
              {biggestClimber && biggestClimber.delta_position && biggestClimber.delta_position > 0 ? (
                <span className="font-mono tabular-nums text-[11px] sm:text-sm font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 rounded shrink-0">
                  +{biggestClimber.delta_position} <span className="hidden sm:inline">pos</span>
                </span>
              ) : null}
            </div>

            {biggestClimber ? (
              <div className="mt-2.5 sm:mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <DriverLink driverId={biggestClimber.driver_id} driverName={biggestClimber.driver_full_name}>
                    <div
                      className="relative h-8 w-8 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-full border-2 bg-black/40 shadow-md transition-transform hover:scale-105"
                      style={{
                        borderColor: getTeamColor(biggestClimber.team_name, biggestClimber.team_color),
                      }}
                    >
                      {biggestClimber.driver_headshot_url ? (
                        <img
                          src={biggestClimber.driver_headshot_url}
                          alt={biggestClimber.driver_full_name}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-mono text-[10px] sm:text-xs font-black text-emerald-300">
                          {biggestClimber.driver_full_name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </DriverLink>
                  <div className="min-w-0">
                    <DriverLink driverId={biggestClimber.driver_id} driverName={biggestClimber.driver_full_name}>
                      <h4 className="text-xs sm:text-base font-black text-white truncate hover:text-emerald-300 transition-colors">
                        {biggestClimber.driver_full_name}
                      </h4>
                    </DriverLink>
                    <div className="flex items-center gap-1 font-mono tabular-nums text-[10px] sm:text-xs font-bold">
                      <span className="text-white/50">P{biggestClimber.grid_position ?? "—"}</span>
                      <span className="text-emerald-400">➔</span>
                      <span className="text-emerald-400">P{biggestClimber.finishing_position ?? "—"}</span>
                    </div>
                  </div>
                </div>

                <DriverLink
                  driverId={biggestClimber.driver_id}
                  driverName={biggestClimber.driver_full_name}
                  className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all group shrink-0"
                  title={`Ver perfil de ${biggestClimber.driver_full_name}`}
                >
                  <span>Perfil</span>
                  <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </DriverLink>
              </div>
            ) : (
              <div className="mt-2.5 py-2 text-center text-[11px] text-f1-subtle font-medium">
                Sem registro
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Next Race Countdown & Teaser Card */}
      <NextRaceCountdownCard upcomingRace={upcomingRace} onOpenSchedule={onOpenSchedule} />
    </div>
  );
}

// Subcomponent: Next Race Countdown Card
function NextRaceCountdownCard({
  upcomingRace,
  onOpenSchedule
}: {
  upcomingRace: RaceWeekendInfo;
  onOpenSchedule: () => void;
}) {
  const targetTime = useMemo(() => {
    if (upcomingRace?.race_timestamp_utc) {
      const parsed = new Date(upcomingRace.race_timestamp_utc).getTime();
      if (!isNaN(parsed) && parsed > Date.now()) return parsed;
    }
    // Fallback: 4 days ahead
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 4);
    fallback.setHours(10, 0, 0, 0);
    return fallback.getTime();
  }, [upcomingRace]);

  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, targetTime - Date.now()));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [targetTime]);

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111118] p-4 sm:p-6 2xl:p-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 items-center">
        <div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-f1-subtle">
              <span className="h-1.5 w-1.5 rounded-full bg-f1-red" />
              <span>Próxima Etapa · Round {upcomingRace?.round_number || 15}</span>
            </div>
            <CircuitLink
              circuitName={upcomingRace?.circuit_name}
              circuitId={upcomingRace?.circuit_id}
              className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group"
              title={`Ver traçado e estatísticas do circuito ${upcomingRace?.circuit_name}`}
            >
              <span>Circuito</span>
              <ArrowUpRight className="h-3 w-3 text-f1-subtle group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </CircuitLink>
          </div>
          <CircuitLink
            circuitName={upcomingRace?.circuit_name}
            circuitId={upcomingRace?.circuit_id}
            className="hover:underline decoration-white/30 transition-colors inline-block group"
            title={`Ver perfil e estatísticas do circuito ${upcomingRace?.circuit_name || "Oficial"}`}
          >
            <h3 className="text-xl sm:text-3xl font-black uppercase text-white group-hover:underline transition-colors leading-tight">
              {upcomingRace?.circuit_name || "Circuito Oficial"}
            </h3>
          </CircuitLink>
          <p className="mt-0.5 sm:mt-1 text-xs text-f1-subtle">
            {upcomingRace?.location || "Local"}, {upcomingRace?.country || "País"} · {upcomingRace?.event_date || "Data"}
          </p>

          <div className="mt-3.5 sm:mt-6 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <button
              onClick={onOpenSchedule}
              className="flex min-h-[44px] items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-f1-red px-3.5 sm:px-4 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white hover:bg-f1-darkred active:scale-[0.98] transition-all shadow-sm"
            >
              <span>Ver horários</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <CircuitLink
              circuitName={upcomingRace?.circuit_name}
              circuitId={upcomingRace?.circuit_id}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 sm:px-3.5 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10 hover:text-white hover:border-white/25 active:scale-[0.98] transition-all group"
              title={`Ver traçado, estatísticas e histórico de ${upcomingRace?.circuit_name}`}
            >
              <span>Guia da Pista</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-f1-red group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </CircuitLink>
          </div>
        </div>

        {/* Real Countdown Grid */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-f1-subtle mb-2 sm:mb-3">
            Luzes se apagam em
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 sm:p-4">
              <span className="font-mono tabular-nums text-xl sm:text-3xl font-black text-white">
                {String(days).padStart(2, "0")}
              </span>
              <span className="block text-[9px] font-bold uppercase text-f1-subtle mt-0.5 sm:mt-1">Dias</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 sm:p-4">
              <span className="font-mono tabular-nums text-xl sm:text-3xl font-black text-white">
                {String(hours).padStart(2, "0")}
              </span>
              <span className="block text-[9px] font-bold uppercase text-f1-subtle mt-0.5 sm:mt-1">Horas</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 sm:p-4">
              <span className="font-mono tabular-nums text-xl sm:text-3xl font-black text-white">
                {String(minutes).padStart(2, "0")}
              </span>
              <span className="block text-[9px] font-bold uppercase text-f1-subtle mt-0.5 sm:mt-1">Min</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 sm:p-4">
              <span className="font-mono tabular-nums text-xl sm:text-3xl font-black text-f1-red">
                {String(seconds).padStart(2, "0")}
              </span>
              <span className="block text-[9px] font-bold uppercase text-f1-subtle mt-0.5 sm:mt-1">Seg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
