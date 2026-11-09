"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  ChevronRight,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { RaceWeekendInfo } from "@/types/f1";
import DriverLink, { parseDriverNames } from "@/lib/driverUtils";
import TeamLink from "@/lib/teamUtils";
import CircuitLink from "@/lib/circuitUtils";
import CircuitRecordDrivers from "@/components/CircuitRecordDrivers";
import {
  useTieCarousel,
  TieCarouselEdgeArrows,
  TieCarouselTrack,
  TieCarouselDots,
} from "@/components/ui/TieCarousel";
import { getCanonicalSessionName } from "./SessionDetailDrawer";

interface Props {
  raceInfo: RaceWeekendInfo;
  year?: number;
  onSelectSession: (session: {
    code: string;
    name: string;
    session_name?: string;
    date: string;
    time: string;
    completed: boolean;
  }) => void;
}

export default function RaceWeekendView({ raceInfo, year, onSelectSession }: Props) {
  const effectiveYear = year || new Date().getFullYear();
  const sessions = raceInfo?.sessions || [];

  const rec = raceInfo?.circuit_records;
  const hasHistorical = rec?.has_historical_data ?? Number(rec?.total_laps_analyzed) > 0;
  const winsDrivers = parseDriverNames(rec?.most_wins_drivers || rec?.most_wins_driver);
  const polesDrivers = parseDriverNames(rec?.most_poles_drivers || rec?.most_poles_driver);
  const speedDrivers =
    rec?.max_speed_drivers && rec.max_speed_drivers.length > 0
      ? rec.max_speed_drivers
      : rec?.max_speed_driver && rec.max_speed_driver !== "—"
          ? [{ driver: rec.max_speed_driver, team: rec.max_speed_team, year: rec.max_speed_year || 0, headshot_url: rec.max_speed_headshot_url }]
          : [];

  const winsCarousel = useTieCarousel(winsDrivers.length);
  const polesCarousel = useTieCarousel(polesDrivers.length);
  const speedCarousel = useTieCarousel(speedDrivers.length);

  return (
    <div className="space-y-5 sm:space-y-7 animate-fadeIn">
      {/* ===================================================================== */}
      {/* 1. GRAND PRIX HERO BANNER (Compacto no mobile, acima da dobra)        */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111118] p-4 sm:p-8">
        {/* Circuit Stylized Background Track */}
        <svg
          className="pointer-events-none absolute -right-6 -bottom-8 h-48 sm:h-60 w-3/5 opacity-15"
          viewBox="0 0 360 160"
          fill="none"
        >
          <path
            d="M42 104C68 120 92 132 114 114C134 98 126 61 150 49C171 38 187 67 204 67C225 67 231 38 253 42C275 46 264 75 288 80C314 84 326 104 305 118C281 134 254 112 233 122C207 136 189 111 169 124C144 139 129 121 114 114"
            stroke="#E10600"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-f1-red/40 bg-f1-red/15 px-3 py-1 text-[10px] sm:text-[11px] font-black text-f1-red uppercase tracking-wider">
              <span className="live-dot" /> Fim de Semana ao Vivo
            </div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-f1-subtle">
              Etapa {raceInfo?.round_number || 14} · {raceInfo?.event_date || "Data Oficial"}
            </span>
          </div>

          <h2 className="mt-2.5 sm:mt-3 text-fluid-hero font-black uppercase tracking-tight text-white">
            {raceInfo?.official_event_name || "Formula 1 Grand Prix"}
          </h2>

          <div className="mt-3.5 sm:mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-white/80 flex-1 min-w-0">
              <span className="flex items-center gap-1.5 text-f1-red min-w-0 max-w-full">
                <MapPin className="h-4 w-4 shrink-0" />
                <strong className="text-white truncate">{raceInfo?.circuit_name || "Circuito"}</strong>
              </span>
              <span className="text-white/40 hidden sm:inline">•</span>
              <span className="text-f1-subtle text-[11px] sm:text-xs truncate">
                {raceInfo?.location || "Local"}, {raceInfo?.country || "País"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/season/round/${raceInfo?.round_number || 14}?year=${effectiveYear}`}
                className="inline-flex min-h-[44px] sm:min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-f1-red hover:bg-f1-darkred px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white active:scale-[0.98] transition-all group shadow-md shadow-f1-red/20 shrink-0 flex-1 sm:flex-initial"
                title={`Ver análise completa e telemetria do GP (${raceInfo?.official_event_name})`}
              >
                <span>Ver GP Completo</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <CircuitLink
                circuitName={raceInfo?.circuit_name}
                circuitId={raceInfo?.circuit_id}
                className="inline-flex min-h-[44px] sm:min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:border-white/25 active:scale-[0.98] transition-all group shadow-sm shrink-0 flex-1 sm:flex-initial"
                title={`Ver traçado, estatísticas e histórico de ${raceInfo?.circuit_name || "circuito"}`}
              >
                <span>Conhecer Circuito</span>
                <ArrowUpRight className="h-4 w-4 text-f1-red group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </CircuitLink>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. RAIO-X HISTÓRICO DO CIRCUITO (ACIMA DO CRONOGRAMA)                 */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-f1-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-f1-red" />
          <span>Raio-X Histórico do Circuito</span>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Record 1: Most Wins */}
          <div
            onMouseEnter={winsCarousel.pause}
            onMouseLeave={winsCarousel.resume}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-[#12121A] p-3.5 sm:p-4 flex flex-col justify-between"
          >
            <TieCarouselEdgeArrows carousel={winsCarousel} accent="amber" position="metric" />
            <div>
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {winsCarousel.isTied ? "Maiores Vencedores" : "Maior Vencedor"}
              </span>
              <div className={`mt-2 flex items-baseline justify-between gap-2 ${winsCarousel.isTied ? "px-2.5" : ""}`}>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono tabular-nums text-xl sm:text-2xl font-black text-amber-400">
                    {hasHistorical && rec?.most_wins_count ? rec.most_wins_count : "0"}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">vitórias</span>
                </div>
                <TieCarouselDots carousel={winsCarousel} accent="amber" />
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5">
              <CircuitRecordDrivers
                drivers={rec?.most_wins_drivers || rec?.most_wins_driver}
                items={rec?.most_wins_items}
                accentColor="amber"
                emptyText="Sem histórico no DW"
                carousel={winsCarousel}
                showAvatar={true}
              />
            </div>
          </div>

          {/* Record 2: Most Poles */}
          <div
            onMouseEnter={polesCarousel.pause}
            onMouseLeave={polesCarousel.resume}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-[#12121A] p-3.5 sm:p-4 flex flex-col justify-between"
          >
            <TieCarouselEdgeArrows carousel={polesCarousel} accent="purple" position="metric" />
            <div>
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {polesCarousel.isTied ? "Recordistas de Poles" : "Recordista de Poles"}
              </span>
              <div className={`mt-2 flex items-baseline justify-between gap-2 ${polesCarousel.isTied ? "px-2.5" : ""}`}>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono tabular-nums text-xl sm:text-2xl font-black text-purple-400">
                    {hasHistorical && rec?.most_poles_count ? rec.most_poles_count : "0"}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">poles</span>
                </div>
                <TieCarouselDots carousel={polesCarousel} accent="purple" />
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5">
              <CircuitRecordDrivers
                drivers={rec?.most_poles_drivers || rec?.most_poles_driver}
                items={rec?.most_poles_items}
                accentColor="purple"
                emptyText="Sem histórico no DW"
                carousel={polesCarousel}
                showAvatar={true}
              />
            </div>
          </div>

          {/* Record 3: Lap Records (Quali & Race) */}
          <div className="rounded-xl border border-white/10 bg-[#12121A] p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Volta Mais Rápida
              </span>
              <div className="mt-2 space-y-1.5">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Quali:</span>
                    <span className="font-mono tabular-nums font-bold text-white text-xs">
                      {hasHistorical && rec?.all_time_record && rec?.all_time_record !== "—"
                        ? rec.all_time_record
                        : "—"}
                    </span>
                  </div>
                        {hasHistorical && rec?.all_time_holder && rec?.all_time_holder !== "—" ? (
                          <div className="flex items-center justify-end gap-1.5 mt-1 min-w-0">
                            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full overflow-hidden border border-white/20 bg-white/5">
                              {rec.all_time_headshot_url ? (
                                <img src={rec.all_time_headshot_url} alt={rec.all_time_holder} className="h-full w-full object-cover object-top" />
                              ) : (
                                <span className="font-mono text-[8px] font-bold text-white/70">
                                  {rec.all_time_holder.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <DriverLink driverName={rec.all_time_holder} className="hover:text-zinc-300 text-[10px] text-zinc-400 truncate">
                              {rec.all_time_holder}
                              {rec.all_time_year && rec.all_time_year > 0 ? ` (${rec.all_time_year})` : ""}
                            </DriverLink>
                      </div>
                    ) : null}
                </div>

                  <div className="pt-1.5 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-mono text-emerald-400/80 uppercase">Corrida:</span>
                      <span className="font-mono tabular-nums font-bold text-emerald-400 text-xs">
                        {hasHistorical && rec?.lap_record && rec?.lap_record !== "—"
                          ? rec.lap_record
                          : "—"}
                      </span>
                    </div>
                          {hasHistorical && rec?.lap_record_holder && rec?.lap_record_holder !== "—" ? (
                            <div className="flex items-center justify-end gap-1.5 mt-1 min-w-0">
                              <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full overflow-hidden border border-emerald-500/30 bg-white/5">
                                {rec.lap_record_headshot_url ? (
                                  <img src={rec.lap_record_headshot_url} alt={rec.lap_record_holder} className="h-full w-full object-cover object-top" />
                                ) : (
                                  <span className="font-mono text-[8px] font-bold text-emerald-400">
                                    {rec.lap_record_holder.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <DriverLink driverName={rec.lap_record_holder} className="hover:text-emerald-300 text-[10px] text-zinc-400 truncate">
                                {rec.lap_record_holder}
                                {rec.lap_record_year && rec.lap_record_year > 0 ? ` (${rec.lap_record_year})` : ""}
                              </DriverLink>
                      </div>
                      ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Record 4: Top Speed Trap */}
            <div
              onMouseEnter={speedCarousel.pause}
              onMouseLeave={speedCarousel.resume}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-[#12121A] p-3.5 sm:p-4 flex flex-col justify-between"
            >
              <TieCarouselEdgeArrows carousel={speedCarousel} accent="blue" position="metric" />
              <div>
                <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Velocidade Máxima
                </span>
                <div className={`mt-2 flex items-baseline justify-between gap-2 ${speedCarousel.isTied ? "px-2.5" : ""}`}>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-mono tabular-nums font-black text-blue-400">
                      {rec?.max_speed_kmh && Number(rec.max_speed_kmh) > 0 ? rec.max_speed_kmh : "—"}
                    </span>
                    {rec?.max_speed_kmh && Number(rec.max_speed_kmh) > 0 ? (
                      <span className="font-mono text-[10px] text-zinc-500 uppercase">km/h</span>
                    ) : null}
                  </div>
                  <TieCarouselDots carousel={speedCarousel} accent="blue" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-white/5">
                {speedDrivers.length > 0 ? (
                  <TieCarouselTrack
                    carousel={speedCarousel}
                    items={speedDrivers}
                    keyExtractor={(s, i) => `${s.driver}-${s.team || ''}-${i}`}
                    renderItem={(s) => (
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full overflow-hidden border border-blue-500/30 bg-white/5">
                                {s.headshot_url ? (
                                  <img src={s.headshot_url} alt={s.driver} className="h-full w-full object-cover object-top" />
                                ) : (
                                  <span className="font-mono text-[9px] font-bold text-blue-400">
                                    {s.driver.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-zinc-300 truncate font-semibold">
                                  <DriverLink driverName={s.driver} className="hover:text-blue-300 text-white font-bold">
                                    {s.driver}
                                  </DriverLink>
                                  {s.year > 0 ? <span className="text-zinc-500 font-mono text-[11px] ml-1">({s.year})</span> : null}
                                </p>
                                {(s.team || rec?.max_speed_team) ? (
                                  <p className="text-[10px] sm:text-[11px] text-blue-400/90 font-mono truncate mt-0.5">
                                    <TeamLink teamName={s.team || rec?.max_speed_team!} className="hover:text-white hover:underline transition-colors">
                                      {s.team || rec?.max_speed_team}
                                    </TeamLink>
                                  </p>
                                ) : null}
                              </div>
                            </div>
                    )}
                  />
                            ) : (
                            <p className="text-xs text-white/40 truncate">Aguardando telemetria</p>
                )}
                          </div>
            </div>
          </div>
            </div>

            {/* ===================================================================== */}
            {/* 3. SESSÕES DO FINAL DE SEMANA (CRONOGRAMA & RESULTADOS)               */}
            {/* ===================================================================== */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                  <Calendar className="h-4 w-4 text-f1-red" />
                  <span>Cronograma & Resultados</span>
                </div>
                <span className="text-[11px] text-f1-subtle">
                  Toque na sessão para abrir tempos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
                {sessions.map((session, idx) => {
                  const isClickable = session.completed;
                  const isWaitingData = !session.completed && session.waiting_data;
                  const canonicalSession = getCanonicalSessionName(session.session_name || session.name, session.session_code);
                  const sessionPageUrl = `/season/round/${raceInfo?.round_number || 14}?year=${effectiveYear}&session=${encodeURIComponent(canonicalSession)}`;

                  return (
                    <div
                      key={idx}
                      role={isClickable ? "button" : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (isClickable && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          onSelectSession({
                            code: session.session_code || `FP${idx + 1}`,
                            name: session.name,
                            session_name: session.session_name,
                            date: session.date,
                            time: session.time,
                            completed: session.completed
                          });
                        }
                      }}
                      onClick={() =>
                        isClickable &&
                        onSelectSession({
                          code: session.session_code || `FP${idx + 1}`,
                          name: session.name,
                          session_name: session.session_name,
                          date: session.date,
                          time: session.time,
                          completed: session.completed
                        })
                      }
                      className={`relative rounded-xl border p-3.5 transition-all min-h-[60px] flex flex-row sm:flex-col items-center sm:items-stretch justify-between gap-3 ${isClickable
                        ? "border-white/15 bg-[#14141E] hover:border-f1-red/50 active:scale-[0.99] sm:hover:-translate-y-0.5 cursor-pointer shadow-md"
                        : isWaitingData
                          ? "border-amber-500/35 bg-[#17140E] shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/10"
                          : "border-white/5 bg-black/30 opacity-65"
                        }`}
                    >
                      {/* Esquerda (Mobile) / Topo (Desktop): Identificação da Sessão */}
                      <div className="flex sm:block items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`flex h-7 w-7 sm:h-5 sm:w-5 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-full text-xs sm:text-[10px] font-mono font-black ${isWaitingData
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : isClickable
                                ? "bg-f1-red/20 text-f1-red sm:bg-white/10 sm:text-white/80"
                                : "bg-white/5 text-white/40"
                              }`}
                          >
                            {idx + 1}
                          </span>

                          {/* Status Badge Desktop */}
                          <div className="hidden sm:block">
                            {session.completed ? (
                              <span className="font-mono text-[10px] font-bold uppercase text-emerald-400">
                                Finalizado
                              </span>
                            ) : isWaitingData ? (
                              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                                </span>
                                <span>Aguardando</span>
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] uppercase text-zinc-500">
                                Programado
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="min-w-0 sm:mt-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm sm:text-lg font-black uppercase text-white font-mono leading-tight">
                              {session.session_code || `FP${idx + 1}`}
                            </p>
                            <span className="sm:hidden text-xs font-bold text-white/80 truncate">
                              · {session.name}
                            </span>
                          </div>
                          <p className="hidden sm:block text-[11px] text-f1-subtle font-medium truncate mt-0.5">
                            {session.name}
                          </p>
                          <p className="sm:hidden text-[11px] text-f1-subtle font-mono mt-0.5">
                            {session.date} · <strong className="text-white">{session.time}</strong>
                            {session.leader ? ` · Líder: ${session.leader.split(" ").pop()}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Direita (Mobile) / Rodapé (Desktop): Status & Call to Action */}
                      <div className="shrink-0 sm:mt-4 sm:pt-2.5 sm:border-t sm:border-white/5 sm:space-y-2">
                        {/* Info Data/Hora (Desktop apenas, pois no mobile já está inline à esquerda) */}
                        <div className="hidden sm:flex items-end justify-between text-xs">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-white/40">{session.date}</p>
                            <p className="font-mono font-bold text-white text-xs">{session.time}</p>
                          </div>
                          {session.leader && (
                            <div className="text-right max-w-[85px]">
                              <p className="text-[8px] uppercase font-bold text-emerald-400/80 leading-none">
                                Líder
                              </p>
                              <p className="text-[10px] font-semibold text-white truncate mt-0.5">
                                <DriverLink
                                  driverName={session.leader}
                                  stopPropagation={true}
                                  className="hover:text-emerald-300"
                                >
                                  {session.leader}
                                </DriverLink>
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Mobile Action / Status Pill */}
                        <div className="flex sm:hidden items-center gap-1.5">
                          {isClickable ? (
                            <>
                              <span className="inline-flex items-center gap-1 rounded-lg bg-f1-red/15 border border-f1-red/30 px-2.5 py-1.5 text-[11px] font-bold text-f1-red">
                                <span>Tempos</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                              <Link
                                href={sessionPageUrl}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-white/15 bg-white/5 text-white/70 hover:text-white active:scale-95 transition-all"
                                title={`Ir direto para a aba de ${session.name}`}
                              >
                                <ArrowUpRight className="h-3.5 w-3.5 text-f1-red" />
                              </Link>
                            </>
                          ) : isWaitingData ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                              <Clock className="h-3 w-3 animate-spin" style={{ animationDuration: "6s" }} />
                              <span>Processando</span>
                            </span>
                          ) : (
                            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-mono text-zinc-400">
                              Agendado
                            </span>
                          )}
                        </div>

                        {/* Desktop Footer Action */}
                        {isClickable && (
                          <div className="hidden sm:flex items-center justify-between gap-1.5 pt-0.5">
                            <div className="text-[10px] font-bold text-f1-red flex items-center gap-0.5">
                              <span>Ver tempos</span>
                              <ChevronRight className="h-3 w-3" />
                            </div>
                            <Link
                              href={sessionPageUrl}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-bold text-white/50 hover:text-white flex items-center gap-0.5 transition-colors group/link"
                              title={`Ir direto para a aba de ${session.name}`}
                            >
                              <span className="hover:underline">Aba da Sessão</span>
                              <ArrowUpRight className="h-3 w-3 text-f1-red group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                            </Link>
                          </div>
                        )}

                        {isWaitingData && (
                          <div className="hidden sm:flex text-[10px] font-semibold text-amber-300/90 items-center gap-1.5 pt-0.5">
                            <Clock
                              className="h-3 w-3 animate-spin text-amber-400 flex-shrink-0"
                              style={{ animationDuration: "6s" }}
                            />
                            <span className="truncate">Aguardando dados</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          );
}
