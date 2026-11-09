"use client";

import React, { useState } from "react";
import {
  MapPin,
  Calendar,
  ChevronRight,
  ChevronDown,
  Clock,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { RaceWeekendInfo } from "@/types/f1";
import DriverLink, { parseDriverNames } from "@/lib/driverUtils";
import CircuitLink from "@/lib/circuitUtils";
import CircuitRecordDrivers from "@/components/CircuitRecordDrivers";

interface Props {
  raceInfo: RaceWeekendInfo;
  onSelectSession: (session: {
    code: string;
    name: string;
    session_name?: string;
    date: string;
    time: string;
    completed: boolean;
  }) => void;
}

export default function RaceWeekendView({ raceInfo, onSelectSession }: Props) {
  const sessions = raceInfo?.sessions || [];
  // Accordion: No mobile inicia recolhido para priorizar as sessões na primeira tela
  const [recordsOpen, setRecordsOpen] = useState(false);

  const rec = raceInfo?.circuit_records;
  const hasHistorical = rec?.has_historical_data ?? Number(rec?.total_laps_analyzed) > 0;
  const winsDrivers = parseDriverNames(rec?.most_wins_drivers || rec?.most_wins_driver);
  const polesDrivers = parseDriverNames(rec?.most_poles_drivers || rec?.most_poles_driver);
  const isWinsTied = winsDrivers.length > 1;
  const isPolesTied = polesDrivers.length > 1;

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

            <CircuitLink
              circuitName={raceInfo?.circuit_name}
              circuitId={raceInfo?.circuit_id}
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:border-white/25 active:scale-[0.98] transition-all group shadow-sm shrink-0 w-full sm:w-auto"
              title={`Ver traçado, estatísticas e histórico de ${raceInfo?.circuit_name || "circuito"}`}
            >
              <span>Conhecer Circuito</span>
              <ArrowUpRight className="h-4 w-4 text-f1-red group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </CircuitLink>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. SESSÕES DO FINAL DE SEMANA (PRIORIDADE #1 NO DOM MOBILE)           */}
      {/* No mobile: Lista ergonômica de cards horizontais (alvo >= 56px);      */}
      {/* No desktop (sm+): Grid horizontal de 5 colunas.                       */}
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
                className={`relative rounded-xl border p-3.5 transition-all min-h-[60px] flex flex-row sm:flex-col items-center sm:items-stretch justify-between gap-3 ${
                  isClickable
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
                      className={`flex h-7 w-7 sm:h-5 sm:w-5 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-full text-xs sm:text-[10px] font-mono font-black ${
                        isWaitingData
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
                      <span className="inline-flex items-center gap-1 rounded-lg bg-f1-red/15 border border-f1-red/30 px-2.5 py-1.5 text-[11px] font-bold text-f1-red">
                        <span>Tempos</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
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
                    <div className="hidden sm:flex text-[10px] font-bold text-f1-red items-center gap-0.5 pt-0.5">
                      <span>Ver tempos</span>
                      <ChevronRight className="h-3 w-3" />
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

      {/* ===================================================================== */}
      {/* 3. RAIO-X HISTÓRICO DO CIRCUITO (ACCORDION NO MOBILE, ABERTO EM MD+)  */}
      {/* Esconde curiosidades secundárias sob demanda no celular               */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-white/10 bg-[#0E0E15] md:border-0 md:bg-transparent overflow-hidden">
        {/* Botão Accordion (Interativo no Mobile < md, Cabeçalho estático em md+) */}
        <button
          type="button"
          onClick={() => setRecordsOpen(!recordsOpen)}
          aria-expanded={recordsOpen}
          className="w-full min-h-[52px] md:min-h-0 px-4 py-3 md:p-0 md:mb-3 flex items-center justify-between text-left md:cursor-default active:bg-white/[0.03] md:active:bg-transparent transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 md:hidden" />
            <span className="hidden md:inline-block h-1.5 w-1.5 rounded-full bg-f1-red" />
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white md:text-f1-subtle block">
                Raio-X Histórico do Circuito
              </span>
              <span className="text-[11px] text-f1-subtle md:hidden">
                Recordes de vitórias, poles, volta rápida e speed trap
              </span>
            </div>
          </div>

          <span className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                recordsOpen ? "rotate-180 text-f1-red" : ""
              }`}
            />
          </span>
        </button>

        {/* Grid de Recordes: Visível se aberto no mobile, sempre visível em md+ */}
        <div
          className={`${
            recordsOpen ? "grid p-3.5 pt-0 border-t border-white/5" : "hidden"
          } md:grid md:p-0 md:border-0 grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3`}
        >
          {/* Record 1: Most Wins */}
          <div className="rounded-xl border border-white/10 bg-[#12121A] p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {isWinsTied ? "Maiores Vencedores" : "Maior Vencedor"}
                </span>
                {isWinsTied && (
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 shrink-0">
                    Empate ({winsDrivers.length})
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono tabular-nums text-xl sm:text-2xl font-black text-amber-400">
                  {hasHistorical && rec?.most_wins_count ? rec.most_wins_count : "0"}
                </span>
                <span className="font-mono text-[10px] text-zinc-500 uppercase">vitórias</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5">
              <CircuitRecordDrivers
                drivers={rec?.most_wins_drivers || rec?.most_wins_driver}
                accentColor="amber"
                emptyText="Sem histórico no DW"
              />
            </div>
          </div>

          {/* Record 2: Most Poles */}
          <div className="rounded-xl border border-white/10 bg-[#12121A] p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {isPolesTied ? "Recordistas de Poles" : "Recordista de Poles"}
                </span>
                {isPolesTied && (
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 shrink-0">
                    Empate ({polesDrivers.length})
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono tabular-nums text-xl sm:text-2xl font-black text-purple-400">
                  {hasHistorical && rec?.most_poles_count ? rec.most_poles_count : "0"}
                </span>
                <span className="font-mono text-[10px] text-zinc-500 uppercase">poles</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5">
              <CircuitRecordDrivers
                drivers={rec?.most_poles_drivers || rec?.most_poles_driver}
                accentColor="purple"
                emptyText="Sem histórico no DW"
              />
            </div>
          </div>

          {/* Record 3: Lap Records (Quali & Race) */}
          <div className="rounded-xl border border-white/10 bg-[#12121A] p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
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
                  <p className="text-[10px] text-zinc-500 truncate text-right">
                    {hasHistorical && rec?.all_time_holder && rec?.all_time_holder !== "—" ? (
                      <DriverLink driverName={rec.all_time_holder} className="hover:text-zinc-300">
                        {rec.all_time_holder}
                        {rec.all_time_year && rec.all_time_year > 0 ? ` (${rec.all_time_year})` : ""}
                      </DriverLink>
                    ) : null}
                  </p>
                </div>

                <div className="pt-1 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-emerald-400/80 uppercase">Corrida:</span>
                    <span className="font-mono tabular-nums font-bold text-emerald-400 text-xs">
                      {hasHistorical && rec?.lap_record && rec?.lap_record !== "—"
                        ? rec.lap_record
                        : "—"}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate text-right">
                    {hasHistorical && rec?.lap_record_holder && rec?.lap_record_holder !== "—" ? (
                      <DriverLink driverName={rec.lap_record_holder} className="hover:text-emerald-300">
                        {rec.lap_record_holder}
                        {rec.lap_record_year && rec.lap_record_year > 0 ? ` (${rec.lap_record_year})` : ""}
                      </DriverLink>
                    ) : null}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Record 4: Top Speed Trap */}
          <div className="rounded-xl border border-white/10 bg-[#12121A] p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Velocidade Máxima
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-mono tabular-nums font-black text-blue-400">
                  {hasHistorical && rec?.max_speed_kmh ? rec.max_speed_kmh : "—"}
                </span>
                {hasHistorical && rec?.max_speed_kmh ? (
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">km/h</span>
                ) : null}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5">
              <p className="text-xs text-zinc-400 truncate">
                {hasHistorical && rec?.max_speed_driver && rec?.max_speed_driver !== "—" ? (
                  <DriverLink driverName={rec.max_speed_driver} className="hover:text-blue-300">
                    {rec.max_speed_driver} ({rec.max_speed_year})
                  </DriverLink>
                ) : (
                  <span className="text-white/40">Aguardando telemetria</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
