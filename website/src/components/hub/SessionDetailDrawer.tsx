"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Gauge, Flag, Loader2, ArrowUp, ArrowDown, Minus, Timer, TrendingUp, ArrowUpRight } from "lucide-react";
import { SessionSummary } from "@/types/f1";
import { getTeamColor, getTeamAbbr } from "./StandingsWidget";
import DriverLink from "@/lib/driverUtils";
import TeamLink from "@/lib/teamUtils";
import CircuitLink from "@/lib/circuitUtils";
import {
  useTieCarousel,
  TieCarouselEdgeArrows,
  TieCarouselTrack,
  TieCarouselDots,
} from "@/components/ui/TieCarousel";

export function getCanonicalSessionName(sessionName?: string, sessionCode?: string): string {
  if (sessionName) {
    const s = sessionName.trim().toLowerCase();
    if (s === "practice 1" || s.includes("practice 1") || s.includes("treino livre 1") || s === "fp1") return "Practice 1";
    if (s === "practice 2" || s.includes("practice 2") || s.includes("treino livre 2") || s === "fp2") return "Practice 2";
    if (s === "practice 3" || s.includes("practice 3") || s.includes("treino livre 3") || s === "fp3") return "Practice 3";
    if (s.includes("sprint shootout") || s.includes("shootout")) return "Sprint Shootout";
    if (s.includes("sprint qualifying") || s.includes("classificação sprint") || s === "sq") return "Sprint Qualifying";
    if (s === "sprint" || s.includes("corrida sprint")) return "Sprint";
    if (s === "qualifying" || s.includes("qualifying") || s.includes("classificação") || s === "q") return "Qualifying";
    if (s === "race" || s.includes("race") || s.includes("corrida") || s.includes("grande prêmio") || s === "r") return "Race";
  }
  if (sessionCode) {
    const c = sessionCode.trim().toUpperCase();
    if (c === "FP1") return "Practice 1";
    if (c === "FP2") return "Practice 2";
    if (c === "FP3") return "Practice 3";
    if (c === "SQ") return "Sprint Qualifying";
    if (c === "SS") return "Sprint Shootout";
    if (c === "S") return "Sprint";
    if (c === "Q") return "Qualifying";
    if (c === "R") return "Race";
  }
  return sessionName || "Race";
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: {
    code: string;
    name: string;
    session_name?: string;
    date: string;
    time: string;
    completed: boolean;
  } | null;
  year: number;
  round: number;
  circuitName: string;
  initialResults?: SessionSummary[];
}

export default function SessionDetailDrawer({
  isOpen,
  onClose,
  session,
  year,
  round,
  circuitName,
  initialResults = []
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SessionSummary[]>(initialResults);
  const [speedTrap, setSpeedTrap] = useState<{ speed: number; driver: string; team: string } | null>(null);
  const [bestSectors, setBestSectors] = useState<{
    s1: { time: string; driver: string; team: string } | null;
    s2: { time: string; driver: string; team: string } | null;
    s3: { time: string; driver: string; team: string } | null;
  } | null>(null);

  const sessionType = (session?.session_name || session?.name || "").toLowerCase();
  const isRaceOrSprint = sessionType.includes("race") || sessionType === "sprint" || session?.code === "R" || session?.code === "S";
  const canonicalSession = getCanonicalSessionName(session?.session_name || session?.name, session?.code);
  const sessionDetailUrl = `/season/round/${round}?year=${year}&session=${encodeURIComponent(canonicalSession)}`;

  // Identifica a(s) melhor(es) volta(s) da sessão para exibição no card e destaque em roxo
  const fastestLapsInfo = useMemo(() => {
    const valid = results.filter((r) => r.best_lap && r.best_lap.trim() !== "" && r.best_lap !== "—");
    if (valid.length === 0) return [];
    const sorted = [...valid].sort((a, b) => a.best_lap!.localeCompare(b.best_lap!));
    const bestLap = sorted[0].best_lap;
    return sorted.filter((r) => r.best_lap === bestLap);
  }, [results]);
  const fastestLapInfo = fastestLapsInfo[0] || null;
  const flCarousel = useTieCarousel(fastestLapsInfo.length);

  // Identifica o(s) maior(es) escalador(es) em corridas (maior ganho de posições)
  const biggestClimbersInfo = useMemo(() => {
    const valid = results.filter(
      (r) => r.delta_position != null && r.grid_position != null && r.finishing_position != null
    );
    if (valid.length === 0) return [];
    const sorted = [...valid].sort((a, b) => (b.delta_position || 0) - (a.delta_position || 0));
    const top = sorted[0];
    if (!top || (top.delta_position || 0) <= 0) return [];
    const maxDelta = top.delta_position;
    return sorted
      .filter((r) => r.delta_position === maxDelta)
      .map((r) => ({
        driver: r.driver_full_name,
        driverId: r.driver_id,
        team: r.team_name,
        gained: r.delta_position,
        grid: r.grid_position,
        finish: r.finishing_position
      }));
  }, [results]);
  const biggestClimberInfo = biggestClimbersInfo[0] || null;
  const climberCarousel = useTieCarousel(biggestClimbersInfo.length);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !session) return;

    let isMounted = true;
    const sessionQueryName = session.session_name || session.name;

    setLoading(true);
    fetch(`/api/session-summary?year=${year}&round=${round}&session=${encodeURIComponent(sessionQueryName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.results) {
          setResults(data.results);
          setSpeedTrap(data.speedTrap || null);
          setBestSectors(data.bestSectors || null);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch real session summary:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, session, year, round]);

  if (!isOpen || !session || !mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-end sm:items-stretch justify-end bg-black/85 backdrop-blur-sm animate-fadeIn"
      style={{
        zIndex: 99999,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        margin: 0,
        padding: 0
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl sm:max-w-4xl bg-[#12121A] rounded-t-3xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-white/15 flex flex-col shadow-2xl overflow-hidden max-h-[92dvh] sm:max-h-none sm:h-full animate-slideUpSheet sm:animate-slideLeft pb-[env(safe-area-inset-bottom)] sm:pb-0"
      >
        {/* Mobile Drag Pill Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-400">
                Sessão Finalizada
              </span>
              <span className="text-[11px] sm:text-xs text-f1-subtle">{session.date} · {session.time}</span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black uppercase text-white mt-1 truncate">
              {session.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <CircuitLink
                circuitName={circuitName}
                className="inline-flex min-h-[36px] sm:min-h-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90 hover:text-white transition-all group"
                title={`Ver perfil e traçado do circuito ${circuitName}`}
              >
                <span>{circuitName}</span>
                <ArrowUpRight className="h-3 w-3 text-f1-subtle group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </CircuitLink>
              <span className="text-white/20 hidden sm:inline">·</span>
              <span className="text-[11px] sm:text-xs text-f1-subtle hidden sm:inline">Classificação e Tempos Oficiais</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={sessionDetailUrl}
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-xl border border-f1-red/50 bg-f1-red/15 hover:bg-f1-red text-f1-red hover:text-white px-3 sm:px-3.5 py-2 text-xs font-bold transition-all shadow-sm group active:scale-95"
              title={`Abrir página com detalhamento e telemetria da sessão ${session.name}`}
            >
              <span className="hidden sm:inline">Acessar Aba da Sessão</span>
              <span className="sm:hidden">Aba da Sessão</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <button
              onClick={onClose}
              aria-label="Fechar detalhes da sessão"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Metrics Header */}
        <div className="grid grid-cols-2 gap-px border-b border-white/10 bg-white/10">
          {isRaceOrSprint ? (
            /* Card 1: Maior Escalador na Corrida */
            <div
              className="relative bg-[#151520] p-3 sm:p-4 min-w-0 overflow-hidden"
              onMouseEnter={climberCarousel.pause}
              onMouseLeave={climberCarousel.resume}
            >
              <TieCarouselEdgeArrows carousel={climberCarousel} accent="emerald" size="xs" position="metric" />
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-bold uppercase text-emerald-400 min-w-0">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Maior Escalador</span>
              </div>
              {biggestClimberInfo ? (
                <>
                  <div className={`flex items-baseline justify-between gap-2 mt-1 ${climberCarousel.isTied ? "px-2.5" : ""}`}>
                    <p className="font-mono tabular-nums text-base sm:text-xl font-black text-emerald-400 truncate">
                      +{biggestClimberInfo.gained} {biggestClimberInfo.gained === 1 ? "POSIÇÃO" : "POSIÇÕES"}
                    </p>
                    <TieCarouselDots carousel={climberCarousel} accent="emerald" />
                  </div>
                  <TieCarouselTrack
                    carousel={climberCarousel}
                    items={biggestClimbersInfo}
                    renderItem={(c) => (
                      <p className="text-xs text-f1-subtle truncate">
                        <DriverLink
                          driverId={c.driverId}
                          driverName={c.driver}
                          className="font-bold text-white/90 hover:text-emerald-300 transition-colors"
                          title={`Ver perfil de ${c.driver}`}
                        >
                          {c.driver}
                        </DriverLink>{" "}
                        (P{c.grid} → P{c.finish}) ·{" "}
                        <TeamLink
                          teamName={c.team}
                          className="hover:text-emerald-300 transition-colors"
                        >
                          {c.team}
                        </TeamLink>
                      </p>
                    )}
                  />
                </>
              ) : (
                <>
                  <p className="font-mono text-base sm:text-xl font-bold text-white/40 mt-1">—</p>
                  <p className="text-xs text-f1-subtle truncate">Sem mudanças de posição</p>
                </>
              )}
            </div>
          ) : (
            /* Card 1: Speed Trap em Treinos/Classificação */
            <div className="bg-[#151520] p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-bold uppercase text-f1-red">
                <Gauge className="h-3.5 w-3.5 text-f1-red shrink-0" />
                <span className="truncate">Speed Trap</span>
              </div>
              {speedTrap ? (
                <>
                  <p className="font-mono tabular-nums text-base sm:text-xl font-bold text-white mt-1 truncate">{speedTrap.speed} KM/H</p>
                  <p className="text-xs text-f1-subtle truncate">
                    <DriverLink
                      driverName={speedTrap.driver}
                      className="font-bold text-white/90 hover:text-white hover:underline transition-colors"
                      title={`Ver perfil de ${speedTrap.driver}`}
                    >
                      {speedTrap.driver}
                    </DriverLink>{" "}
                    ·{" "}
                    <TeamLink
                      teamName={speedTrap.team}
                      className="hover:text-white hover:underline transition-colors"
                    >
                      {speedTrap.team}
                    </TeamLink>
                  </p>
                </>
              ) : (
                <>
                  <p className="font-mono text-base sm:text-xl font-bold text-white/40 mt-1">—</p>
                  <p className="text-xs text-f1-subtle truncate">Sem dados de velocidade</p>
                </>
              )}
            </div>
          )}

          {/* Card 2: Volta Mais Rápida (para todas as sessões) */}
          <div
            className="relative bg-[#151520] p-3 sm:p-4 min-w-0 overflow-hidden"
            onMouseEnter={flCarousel.pause}
            onMouseLeave={flCarousel.resume}
          >
            <TieCarouselEdgeArrows carousel={flCarousel} accent="purple" size="xs" position="metric" />
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-bold uppercase text-purple-400 min-w-0">
              <Timer className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Volta Mais Rápida</span>
            </div>
            {fastestLapInfo ? (
              <>
                <div className={`flex items-baseline justify-between gap-2 mt-1 ${flCarousel.isTied ? "px-2.5" : ""}`}>
                  <p className="font-mono tabular-nums text-base sm:text-xl font-bold text-purple-400 truncate">{fastestLapInfo.best_lap}</p>
                  <TieCarouselDots carousel={flCarousel} accent="purple" />
                </div>
                <TieCarouselTrack
                  carousel={flCarousel}
                  items={fastestLapsInfo}
                  renderItem={(fl) => (
                    <p className="text-xs text-f1-subtle truncate">
                      <DriverLink driverId={fl.driver_id} driverName={fl.driver_full_name} className="font-bold text-white/90 hover:text-purple-300 transition-colors">
                        {fl.driver_full_name}
                      </DriverLink> ·{" "}
                      <TeamLink
                        teamName={fl.team_name}
                        className="hover:text-purple-300 transition-colors"
                      >
                        {fl.team_name}
                      </TeamLink>
                    </p>
                  )}
                />
              </>
            ) : (
              <>
                <p className="font-mono text-base sm:text-xl font-bold text-purple-400 mt-1">—</p>
                <p className="text-xs text-f1-subtle truncate">Aguardando registro</p>
              </>
            )}
          </div>
        </div>

        {/* Setores Mais Rápidos (Abaixo dos cards nas sessões que não são corrida) */}
        {!isRaceOrSprint && bestSectors && (bestSectors.s1 || bestSectors.s2 || bestSectors.s3) && (
          <div className="bg-[#0e0e17] px-4 sm:px-6 py-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
                  Melhores Setores da Sessão
                </span>
              </div>
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider">
                Volta Ideal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Setor 1 */}
              <div className="bg-[#161622] rounded-lg p-2 sm:p-2.5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-black uppercase text-purple-400 px-1 py-0.5 rounded bg-purple-500/10">
                    S1
                  </span>
                  <span className="font-mono tabular-nums text-xs font-black text-purple-300">
                    {bestSectors.s1?.time || "—"}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-white truncate mt-1.5 leading-tight">
                  {bestSectors.s1?.driver || "—"}
                </p>
                <TeamLink
                  teamName={bestSectors.s1?.team}
                  className="text-[9px] text-f1-subtle hover:text-purple-300 transition-colors truncate leading-tight block"
                >
                  {bestSectors.s1?.team || "—"}
                </TeamLink>
              </div>

              {/* Setor 2 */}
              <div className="bg-[#161622] rounded-lg p-2 sm:p-2.5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-black uppercase text-purple-400 px-1 py-0.5 rounded bg-purple-500/10">
                    S2
                  </span>
                  <span className="font-mono tabular-nums text-xs font-black text-purple-300">
                    {bestSectors.s2?.time || "—"}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-white truncate mt-1.5 leading-tight">
                  {bestSectors.s2?.driver || "—"}
                </p>
                <TeamLink
                  teamName={bestSectors.s2?.team}
                  className="text-[9px] text-f1-subtle hover:text-purple-300 transition-colors truncate leading-tight block"
                >
                  {bestSectors.s2?.team || "—"}
                </TeamLink>
              </div>

              {/* Setor 3 */}
              <div className="bg-[#161622] rounded-lg p-2 sm:p-2.5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-black uppercase text-purple-400 px-1 py-0.5 rounded bg-purple-500/10">
                    S3
                  </span>
                  <span className="font-mono tabular-nums text-xs font-black text-purple-300">
                    {bestSectors.s3?.time || "—"}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-white truncate mt-1.5 leading-tight">
                  {bestSectors.s3?.driver || "—"}
                </p>
                <TeamLink
                  teamName={bestSectors.s3?.team}
                  className="text-[9px] text-f1-subtle hover:text-purple-300 transition-colors truncate leading-tight block"
                >
                  {bestSectors.s3?.team || "—"}
                </TeamLink>
              </div>
            </div>
          </div>
        )}

        {/* Classification Table */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden sm:overflow-x-auto p-3.5 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-f1-subtle">
              <Loader2 className="h-7 w-7 animate-spin text-f1-red" />
              <p className="text-xs uppercase font-bold tracking-wider">Carregando telemetria e classificação...</p>
            </div>
          ) : results.length > 0 ? (
            (() => {
              const sessionType = (session.session_name || session.name || "").toLowerCase();
              const isRaceOrSprint = sessionType.includes("race") || sessionType === "sprint" || session.code === "R" || session.code === "S";

              if (isRaceOrSprint) {
                return (
                  <div className="sm:min-w-[680px]">
                    <div className="grid grid-cols-[32px_36px_1fr_72px] sm:grid-cols-[40px_50px_48px_1fr_65px_85px_85px_50px_75px_45px] gap-1.5 sm:gap-2 pb-2 text-[10px] font-bold uppercase text-f1-subtle border-b border-white/10 items-center">
                      <span className="text-center">Pos</span>
                      <span className="text-center hidden sm:block">Largada</span>
                      <span className="text-center">+/-</span>
                      <span>Piloto</span>
                      <span className="hidden sm:block">Equipe</span>
                      <span className="text-right">Gap Líder</span>
                      <span className="text-right hidden sm:block">Intervalo</span>
                      <span className="text-center hidden sm:block">Paradas</span>
                      <span className="text-right hidden sm:block">Melhor</span>
                      <span className="text-center hidden sm:block">Voltas</span>
                    </div>

                    <div className="divide-y divide-white/5 text-xs">
                      {results.map((r, i) => {
                        const color = getTeamColor(r.team_name, r.team_color);
                        const abbr = getTeamAbbr(r.team_name);
                        const isWinner = (r.finishing_position || i + 1) === 1;

                        return (
                          <div
                            key={`${r.driver_full_name}-${i}`}
                            className="grid grid-cols-[32px_36px_1fr_72px] sm:grid-cols-[40px_50px_48px_1fr_65px_85px_85px_50px_75px_45px] gap-1.5 sm:gap-2 py-2.5 items-center hover:bg-white/[0.02]"
                          >
                            <span className={`font-mono tabular-nums text-center font-bold ${isWinner ? "text-amber-400 font-black" : "text-white/60"
                              }`}>
                              P{r.finishing_position || i + 1}
                            </span>

                            {/* Posição de Largada */}
                            <span className="text-center font-mono tabular-nums text-white/50 text-[11px] font-semibold hidden sm:block">
                              {r.grid_position != null ? `P${r.grid_position}` : "—"}
                            </span>

                            {/* Position Delta (+/- with Green Up / Red Down arrow) */}
                            <div className="flex items-center justify-center">
                              {r.delta_position != null && r.delta_position !== 0 ? (
                                r.delta_position > 0 ? (
                                  <span className="inline-flex items-center gap-0.5 font-bold font-mono tabular-nums text-[11px] text-emerald-400">
                                    <ArrowUp className="h-3 w-3 stroke-[3]" />
                                    {r.delta_position}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 font-bold font-mono tabular-nums text-[11px] text-red-400">
                                    <ArrowDown className="h-3 w-3 stroke-[3]" />
                                    {Math.abs(r.delta_position)}
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center font-mono tabular-nums text-[11px] text-white/30">
                                  <Minus className="h-3 w-3" />
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <DriverLink
                                driverId={r.driver_id}
                                driverName={r.driver_full_name}
                                className="flex items-center gap-2 truncate group/drow"
                                title={`Ver perfil de ${r.driver_full_name}`}
                              >
                                <div
                                  className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 shadow-sm transition-transform group-hover/drow:scale-105"
                                  style={{ borderColor: color }}
                                >
                                  {r.driver_headshot_url ? (
                                    <img
                                      src={r.driver_headshot_url}
                                      alt={r.driver_full_name}
                                      className="h-full w-full object-cover object-top"
                                    />
                                  ) : (
                                    <span className="font-mono text-[9px] font-black text-white/70">
                                      {r.driver_full_name.slice(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-bold text-white truncate group-hover/drow:text-white group-hover/drow:underline decoration-white/30 transition-colors">{r.driver_full_name}</span>
                                    {r.driver_number && (
                                      <span className="text-[10px] font-mono tabular-nums text-white/40 hidden sm:inline">#{r.driver_number}</span>
                                    )}
                                  </div>
                                  <span className="block sm:hidden text-[10px] text-f1-subtle truncate">{r.team_name}</span>
                                </div>
                              </DriverLink>
                            </div>

                            <TeamLink
                              teamName={r.team_name}
                              teamId={r.team_id}
                              className="font-bold text-[11px] truncate text-white/60 hover:text-white hover:underline decoration-white/30 transition-colors hidden sm:block"
                              title={`Ver perfil de ${r.team_name}`}
                            >
                              {abbr}
                            </TeamLink>

                            <span className="font-mono tabular-nums text-right text-[11px] font-medium text-white/90 truncate">
                              {r.gap_to_leader || (i === 0 ? "Leader" : "—")}
                            </span>

                            <span className="font-mono tabular-nums text-right text-[11px] text-white/60 hidden sm:block">
                              {r.interval_to_car_ahead || (i === 0 ? "-" : "—")}
                            </span>

                            <span className="text-center font-mono tabular-nums text-white/80 font-bold text-xs hidden sm:block">
                              {r.stops != null ? r.stops : 0}
                            </span>

                            {(() => {
                              const isFastest = Boolean(fastestLapInfo && r.best_lap && r.best_lap === fastestLapInfo.best_lap);
                              return (
                                <div className="hidden sm:flex justify-end">
                                  {isFastest ? (
                                    <span
                                      title="Volta Mais Rápida da Sessão"
                                      className="inline-flex items-center gap-1 rounded bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.5 text-purple-300 font-bold font-mono tabular-nums text-[11px] shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                    >
                                      <Timer className="h-3 w-3 text-purple-400 shrink-0" />
                                      <span>{r.best_lap}</span>
                                    </span>
                                  ) : (
                                    <span className="font-mono tabular-nums text-right text-[11px] text-white/80">
                                      {r.best_lap || "—"}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}

                            <span className="text-center font-mono tabular-nums text-white/60 text-[11px] hidden sm:block">
                              {r.laps_completed != null ? r.laps_completed : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Practice / Qualifying Sessions (Foco total nos tempos de volta e gaps)
              return (
                <div className="sm:min-w-[480px]">
                  <div className="grid grid-cols-[32px_1fr_76px_62px] sm:grid-cols-[40px_1fr_65px_95px_95px_95px] gap-1.5 sm:gap-2 pb-2 text-[10px] font-bold uppercase text-f1-subtle border-b border-white/10 items-center">
                    <span className="text-center">Pos</span>
                    <span>Piloto</span>
                    <span className="hidden sm:block">Equipe</span>
                    <span className="text-right">Melhor Volta</span>
                    <span className="text-right">Delta</span>
                    <span className="text-right hidden sm:block">Intervalo</span>
                  </div>

                  <div className="divide-y divide-white/5 text-xs">
                    {results.map((r, i) => {
                      const color = getTeamColor(r.team_name, r.team_color);
                      const abbr = getTeamAbbr(r.team_name);
                      const isLeader = (r.finishing_position || i + 1) === 1;

                      return (
                        <div
                          key={`${r.driver_full_name}-${i}`}
                          className="grid grid-cols-[32px_1fr_76px_62px] sm:grid-cols-[40px_1fr_65px_95px_95px_95px] gap-1.5 sm:gap-2 py-2.5 items-center hover:bg-white/[0.02]"
                        >
                          <span className={`font-mono tabular-nums text-center font-bold ${isLeader ? "text-purple-400 font-black" : "text-white/60"
                            }`}>
                            P{r.finishing_position || i + 1}
                          </span>

                          <DriverLink
                            driverId={r.driver_id}
                            driverName={r.driver_full_name}
                            className="flex items-center gap-2 truncate group/dmob"
                            title={`Ver perfil de ${r.driver_full_name}`}
                          >
                            <div
                              className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 shadow-sm transition-transform group-hover/dmob:scale-105"
                              style={{ borderColor: color }}
                            >
                              {r.driver_headshot_url ? (
                                <img
                                  src={r.driver_headshot_url}
                                  alt={r.driver_full_name}
                                  className="h-full w-full object-cover object-top"
                                />
                              ) : (
                                <span className="font-mono text-[9px] font-black text-white/70">
                                  {r.driver_full_name.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold text-white truncate group-hover/dmob:text-white group-hover/dmob:underline decoration-white/30 transition-colors">{r.driver_full_name}</span>
                                {r.driver_number && (
                                  <span className="text-[10px] font-mono tabular-nums text-white/40 hidden sm:inline">#{r.driver_number}</span>
                                )}
                              </div>
                              <span className="block sm:hidden text-[10px] text-f1-subtle truncate">{r.team_name}</span>
                            </div>
                          </DriverLink>

                          <TeamLink
                            teamName={r.team_name}
                            teamId={r.team_id}
                            className="font-bold text-[11px] truncate text-white/60 hover:text-white hover:underline decoration-white/30 transition-colors hidden sm:block"
                            title={`Ver perfil de ${r.team_name}`}
                          >
                            {abbr}
                          </TeamLink>

                          <div className="flex justify-end">
                            {isLeader ? (
                              <span
                                title="Melhor Volta da Sessão"
                                className="inline-flex items-center gap-1 rounded bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.5 text-purple-300 font-bold font-mono tabular-nums text-[11px] shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                              >
                                <Timer className="h-3 w-3 text-purple-400 shrink-0" />
                                <span>{r.best_lap}</span>
                              </span>
                            ) : (
                              <span className="font-mono tabular-nums text-right text-[11px] font-bold text-white">
                                {r.best_lap || "—"}
                              </span>
                            )}
                          </div>

                          {/* Delta to Leader's Best Lap */}
                          <span className={`font-mono tabular-nums text-right text-[11px] truncate ${isLeader ? "text-purple-400 font-bold" : "text-white/80"
                            }`}>
                            {r.gap_to_leader || (isLeader ? "Líder" : "—")}
                          </span>

                          {/* Interval to Car Ahead */}
                          <span className="font-mono tabular-nums text-right text-[11px] text-white/50 hidden sm:block">
                            {r.interval_to_car_ahead || (isLeader ? "-" : "—")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-16 text-f1-subtle text-xs">
              Nenhum dado registrado para esta sessão ainda.
            </div>
          )}
        </div>

        {/* Drawer Footer: Redirecionamento Direto para a Aba de Detalhamento da Sessão */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#0E0E16] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-center sm:text-left min-w-0">
            <p className="text-xs font-bold text-white truncate">
              Detalhamento Completo da Sessão ({canonicalSession})
            </p>
            <p className="text-[11px] text-f1-subtle truncate">
              {isRaceOrSprint
                ? "Telemetria de voltas, ritmo de corrida, estratégias de pneus e pit stops."
                : "Volta ideal, setores detalhados S1/S2/S3, speed traps e tempos oficiais."}
            </p>
          </div>
          <Link
            href={sessionDetailUrl}
            className="w-full sm:w-auto inline-flex min-h-[44px] sm:min-h-[38px] items-center justify-center gap-2 rounded-xl bg-f1-red hover:bg-f1-darkred px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-f1-red/25 active:scale-95 transition-all shrink-0"
            title={`Acessar aba da sessão ${session.name} na página do GP`}
          >
            <span>Acessar Aba da Sessão</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
