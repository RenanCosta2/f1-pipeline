"use client";

import React from "react";
import {
  MapPin,
  History,
  Trophy,
  Zap,
  Timer,
  Gauge,
  Calendar,
  ChevronRight,
  Clock,
  ArrowUpRight
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Grand Prix Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111118] p-6 sm:p-8">
        {/* Circuit Stylized Background Track */}
        <svg
          className="pointer-events-none absolute -right-6 -bottom-8 h-60 w-3/5 opacity-15"
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
          <div className="inline-flex items-center gap-2 rounded-full border border-f1-red/40 bg-f1-red/15 px-3 py-1 text-[11px] font-black text-f1-red uppercase tracking-wider">
            <span className="live-dot" /> Fim de Semana de GP ao Vivo
          </div>

          <p className="mt-4 text-xs font-mono font-bold uppercase tracking-wider text-f1-subtle">
            Etapa {raceInfo?.round_number || 14} · {raceInfo?.event_date || "Data Oficial"}
          </p>

          <h2 className="mt-1 text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            {raceInfo?.official_event_name || "Formula 1 Grand Prix"}
          </h2>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/80">
              <span className="flex items-center gap-1.5 text-f1-red">
                <MapPin className="h-4 w-4" />
                <strong className="text-white">{raceInfo?.circuit_name || "Circuito"}</strong>
              </span>
              <span className="text-white/40">•</span>
              <span className="text-f1-subtle">{raceInfo?.location || "Local"}, {raceInfo?.country || "País"}</span>
            </div>

            <CircuitLink
              circuitName={raceInfo?.circuit_name}
              circuitId={raceInfo?.circuit_id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90 hover:text-white hover:border-white/20 transition-all group shadow-sm"
              title={`Ver traçado, estatísticas e histórico de ${raceInfo?.circuit_name || "circuito"}`}
            >
              <span>Conhecer Circuito</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-f1-subtle group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </CircuitLink>
          </div>
        </div>
      </div>

      {/* Historical Track Records (Raio-X Histórico do Circuito) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-f1-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-f1-red" />
          <span>Raio-X Histórico do Circuito</span>
        </div>

        {(() => {
          const rec = raceInfo?.circuit_records;
          const hasHistorical = rec?.has_historical_data ?? (Number(rec?.total_laps_analyzed) > 0);
          const winsDrivers = parseDriverNames(rec?.most_wins_drivers || rec?.most_wins_driver);
          const polesDrivers = parseDriverNames(rec?.most_poles_drivers || rec?.most_poles_driver);
          const isWinsTied = winsDrivers.length > 1;
          const isPolesTied = polesDrivers.length > 1;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Record 1: Most Wins */}
              <div className="rounded-xl border border-white/10 bg-[#12121A] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {isWinsTied ? "Maiores Vencedores" : "Maior Vencedor"}
                    </span>
                    {isWinsTied && (
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 shrink-0">
                        <span className="w-1 h-1 rounded-full bg-amber-400/80" />
                        Empate ({winsDrivers.length})
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-mono tabular-nums text-2xl font-black text-amber-400">
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
              <div className="rounded-xl border border-white/10 bg-[#12121A] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {isPolesTied ? "Recordistas de Poles" : "Recordista de Poles"}
                    </span>
                    {isPolesTied && (
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 shrink-0">
                        <span className="w-1 h-1 rounded-full bg-purple-400/80" />
                        Empate ({polesDrivers.length})
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-mono tabular-nums text-2xl font-black text-purple-400">
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
              <div className="rounded-xl border border-white/10 bg-[#12121A] p-4 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Volta Mais Rápida
                  </span>
                  <div className="mt-2 space-y-1.5">
                    {/* Quali */}
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Quali:</span>
                        <span className="font-mono tabular-nums font-bold text-white text-xs">
                          {hasHistorical && rec?.all_time_record && rec?.all_time_record !== "—" ? rec.all_time_record : "—"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate text-right">
                        {hasHistorical && rec?.all_time_holder && rec?.all_time_holder !== "—" ? (
                          <DriverLink driverName={rec.all_time_holder} className="hover:text-zinc-300">
                            {rec.all_time_holder}{rec.all_time_year && rec.all_time_year > 0 ? ` (${rec.all_time_year})` : ""}
                          </DriverLink>
                        ) : null}
                      </p>
                    </div>

                    {/* Race */}
                    <div className="pt-1 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono text-emerald-400/80 uppercase">Corrida:</span>
                        <span className="font-mono tabular-nums font-bold text-emerald-400 text-xs">
                          {hasHistorical && rec?.lap_record && rec?.lap_record !== "—" ? rec.lap_record : "—"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate text-right">
                        {hasHistorical && rec?.lap_record_holder && rec?.lap_record_holder !== "—" ? (
                          <DriverLink driverName={rec.lap_record_holder} className="hover:text-emerald-300">
                            {rec.lap_record_holder}{rec.lap_record_year && rec.lap_record_year > 0 ? ` (${rec.lap_record_year})` : ""}
                          </DriverLink>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Record 4: Top Speed Trap */}
              <div className="rounded-xl border border-white/10 bg-[#12121A] p-4 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Velocidade Máxima
                  </span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-mono tabular-nums font-black text-blue-400">
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
          );
        })()}
      </div>

      {/* Weekend Sessions Timeline (Session Hub) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-f1-subtle">
            <Calendar className="h-4 w-4 text-f1-red" />
            <span>Sessões do Final de Semana</span>
          </div>
          <span className="text-[11px] text-white/40">Clique numa sessão finalizada para ver estatísticas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {sessions.map((session, idx) => {
            const isClickable = session.completed;
            const isWaitingData = !session.completed && session.waiting_data;

            return (
              <div
                key={idx}
                onClick={() => isClickable && onSelectSession({
                  code: session.session_code || `FP${idx + 1}`,
                  name: session.name,
                  session_name: session.session_name,
                  date: session.date,
                  time: session.time,
                  completed: session.completed
                })}
                className={`relative rounded-xl border p-3 sm:p-3.5 transition-all flex flex-col justify-between ${isClickable
                    ? "border-white/10 bg-[#14141E] hover:border-f1-red/50 hover:-translate-y-0.5 cursor-pointer shadow-md"
                    : isWaitingData
                      ? "border-amber-500/35 bg-[#17140E] hover:border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/10"
                      : "border-white/5 bg-black/30 opacity-60"
                  }`}
              >
                <div>
                  {/* Top Bar: Número da sessão na esquerda e Badge de status na direita */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-bold ${isWaitingData
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : isClickable
                          ? "bg-white/10 text-white/80"
                          : "bg-white/5 text-white/40"
                      }`}>
                      {idx + 1}
                    </span>

                    {session.completed ? (
                      <span className="flex-shrink-0 font-mono text-[10px] font-bold uppercase text-emerald-400">
                        Finalizado
                      </span>
                    ) : isWaitingData ? (
                      <span className="flex-shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        <span className="relative flex h-2 w-2 flex-shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                        </span>
                        <span>Aguardando</span>
                      </span>
                    ) : (
                      <span className="flex-shrink-0 font-mono text-[10px] uppercase text-zinc-500">
                        Programado
                      </span>
                    )}
                  </div>

                  {/* Código da Sessão e Nome */}
                  <p className="mt-3 text-lg font-black uppercase text-white font-mono leading-tight">
                    {session.session_code || `FP${idx + 1}`}
                  </p>
                  <p className="text-[11px] text-f1-subtle font-medium truncate mt-0.5">
                    {session.name}
                  </p>
                </div>

                {/* Footer do Card: Data/Hora e Status Detalhado */}
                <div className="mt-4 pt-2.5 border-t border-white/5 space-y-2">
                  <div className="flex items-end justify-between text-xs">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-white/40">{session.date}</p>
                      <p className="font-mono font-bold text-white text-xs">{session.time}</p>
                    </div>
                    {session.leader && (
                      <div className="text-right max-w-[85px]">
                        <p className="text-[8px] uppercase font-bold text-emerald-400/80 leading-none">Líder</p>
                        <p className="text-[10px] font-semibold text-white truncate mt-0.5">
                          <DriverLink driverName={session.leader} stopPropagation={true} className="hover:text-emerald-300">
                            {session.leader}
                          </DriverLink>
                        </p>
                      </div>
                    )}
                  </div>

                  {isClickable && (
                    <div className="text-[10px] font-bold text-f1-red flex items-center gap-0.5 pt-0.5">
                      <span>Ver tempos</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  )}

                  {isWaitingData && (
                    <div className="text-[10px] font-semibold text-amber-300/90 flex items-center gap-1.5 pt-0.5">
                      <Clock className="h-3 w-3 animate-spin text-amber-400 flex-shrink-0" style={{ animationDuration: '6s' }} />
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
