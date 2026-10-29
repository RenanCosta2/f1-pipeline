"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { SeasonRaceSummary } from "@/types/f1";
import { ChevronRight, Calendar, Flag, Trophy, Clock, CheckCircle2, Clock3 } from "lucide-react";
import { DriverLink } from "@/lib/driverUtils";
import { TeamLink } from "@/lib/teamUtils";
import { CircuitLink } from "@/lib/circuitUtils";

interface SeasonRacesListProps {
  races: SeasonRaceSummary[];
  selectedYear: number;
}

const MONTHS_SHORT_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez"
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const day = match[3];
      const monthIdx = parseInt(match[2], 10) - 1;
      const month = MONTHS_SHORT_PT[monthIdx] || match[2];
      return `${day} ${month}`;
    }
    const d = new Date(dateStr);
    return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS_SHORT_PT[d.getUTCMonth()] || ""}`;
  } catch {
    return String(dateStr);
  }
}

export default function SeasonRacesList({ races, selectedYear }: SeasonRacesListProps) {
  if (!races || races.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#0D0D12] p-12 text-center">
        <Trophy className="mx-auto h-12 w-12 text-f1-subtle/50 mb-3" />
        <h3 className="text-lg font-bold text-white">Nenhum GP encontrado para {selectedYear}</h3>
        <p className="text-sm text-f1-subtle mt-1">Os dados desta temporada ainda estão sendo processados.</p>
      </div>
    );
  }

  const completedRaces = races.filter(r => r.race_status === "Completed");
  const inProgressRaces = races.filter(r => r.race_status === "In Progress");

  return (
    <div className="w-full space-y-4">
      {/* Header Resumo */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Grandes Prêmios da Temporada {selectedYear}
          </h2>
          <p className="text-xs text-f1-subtle mt-0.5">
            {completedRaces.length} de {races.length} corridas realizadas
            {inProgressRaces.length > 0 && ` • ${inProgressRaces.length} GP em andamento`}
            {" • Clique em qualquer GP realizado ou em andamento para explorar todas as sessões"}
          </p>
        </div>
      </div>

      {/* Container Principal da Lista estilo F1 */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B10] shadow-2xl">
        {/* Cabeçalho da Lista */}
        <div className="grid grid-cols-12 items-center border-b border-white/10 px-6 py-3.5 text-[11px] font-black uppercase tracking-wider text-f1-subtle bg-white/[0.02]">
          <div className="col-span-3 sm:col-span-3">Grand Prix</div>
          <div className="col-span-2 sm:col-span-2">Data</div>
          <div className="col-span-3 sm:col-span-3">Vencedor / Status</div>
          <div className="col-span-2 sm:col-span-2">Equipe / Sessões</div>
          <div className="col-span-1 text-center hidden sm:block">Voltas</div>
          <div className="col-span-2 sm:col-span-1 text-right">Tempo / Ação</div>
        </div>

        {/* Linhas / Strips de Cada GP */}
        <div className="divide-y divide-white/5">
          {races.map((race) => {
            const isCompleted = race.race_status === "Completed";
            const isInProgress = race.race_status === "In Progress";
            const isAvailable = isCompleted || isInProgress;
            const teamColor = race.team_color ? (race.team_color.startsWith("#") ? race.team_color : `#${race.team_color}`) : "#E10600";

            const rowContent = (
              <>
                {/* 1. GRAND PRIX (País & Rodada) */}
                <div className="col-span-3 sm:col-span-3 flex items-center gap-3 pr-2">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 font-mono tabular-nums text-[11px] font-bold ${
                      isInProgress
                        ? "text-emerald-400 group-hover:bg-emerald-500/20"
                        : "text-f1-subtle"
                    } ${
                      isCompleted ? "group-hover:bg-white/10 group-hover:text-white" : ""
                    } transition-colors`}
                  >
                    {String(race.round_number).padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`block truncate text-sm font-bold ${
                        isInProgress
                          ? "text-white group-hover:text-emerald-400"
                          : isCompleted
                          ? "text-white group-hover:underline decoration-white/40"
                          : "text-gray-300"
                      } transition-colors`}
                    >
                      {race.country || race.official_event_name}
                    </span>
                    <CircuitLink
                      circuitId={race.circuit_id}
                      circuitName={race.circuit_name || race.location}
                      stopPropagation={true}
                      className="block truncate text-[11px] text-f1-subtle hover:text-white hover:underline"
                      title={`Ver detalhes do circuito ${race.circuit_name || race.location}`}
                    >
                      {race.location || race.circuit_name}
                    </CircuitLink>
                  </div>
                </div>

                {/* 2. DATE */}
                <div className="col-span-2 sm:col-span-2 flex items-center gap-1.5 text-xs font-medium text-gray-300">
                  <Calendar className="h-3.5 w-3.5 text-f1-subtle/70 shrink-0" />
                  <span>{formatDate(race.event_date)}</span>
                </div>

                {/* 3. WINNER / STATUS */}
                <div className="col-span-3 sm:col-span-3 flex items-center gap-2.5 pr-2">
                  {isCompleted && race.winner_name ? (
                    <DriverLink
                      driverId={race.driver_id}
                      driverName={race.winner_name}
                      driverAbbr={race.winner_code}
                      stopPropagation={true}
                      className="flex items-center gap-2.5 group/winner"
                      title={`Ver perfil do vencedor ${race.winner_name}`}
                    >
                      <div
                        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden border border-white/20 bg-white/5 transition-transform group-hover/winner:scale-105"
                        style={{ borderColor: teamColor }}
                      >
                        {race.winner_headshot_url ? (
                          <img
                            src={race.winner_headshot_url}
                            alt={race.winner_name}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <span className="font-mono text-[10px] font-black text-white">
                            {race.winner_code || race.winner_name.slice(0, 3).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-white group-hover/winner:text-white group-hover/winner:underline decoration-white/30 transition-colors">
                          {race.winner_name}
                        </span>
                        {race.winner_number && (
                          <span className="font-mono tabular-nums text-[10px] text-f1-subtle">
                            #{race.winner_number}
                          </span>
                        )}
                      </div>
                    </DriverLink>
                  ) : isInProgress ? (
                    <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Ao Vivo</span>
                    </div>
                  ) : (
                    <span className="font-mono text-xs text-white/30 tracking-wider">
                      Agendado
                    </span>
                  )}
                </div>

                {/* 4. TEAM / SESSÕES */}
                <div className="col-span-2 sm:col-span-2 flex items-center gap-2 pr-2">
                  {isCompleted && (race.team_name || race.race_winner_team) ? (
                    <TeamLink
                      teamId={race.race_winner_team_id}
                      teamName={race.team_name || race.race_winner_team}
                      stopPropagation={true}
                      className="flex items-center gap-2 group/team truncate"
                      title={`Ver perfil da equipe ${race.team_name || race.race_winner_team}`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: teamColor }}
                      />
                      <span className="truncate text-xs font-medium text-gray-200 group-hover/team:text-white group-hover/team:underline">
                        {race.team_name || race.race_winner_team}
                      </span>
                    </TeamLink>
                  ) : isInProgress ? (
                    <span className="truncate text-xs font-semibold text-emerald-400/90">
                      {race.completed_sessions_count
                        ? `${race.completed_sessions_count} sessão(ões)`
                        : "Sessões ativas"}
                    </span>
                  ) : (
                    <span className="text-xs text-f1-subtle/40">—</span>
                  )}
                </div>

                {/* 5. LAPS */}
                <div className="col-span-1 text-center font-mono tabular-nums text-xs font-medium text-gray-300 hidden sm:block">
                  {isCompleted && race.laps_completed ? race.laps_completed : "—"}
                </div>

                {/* 6. TIME / ACTION */}
                <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-2 text-right">
                  {isCompleted ? (
                    <span className="font-mono tabular-nums text-xs font-semibold text-white tracking-tight">
                      {race.time_formatted ? race.time_formatted : "—"}
                    </span>
                  ) : isInProgress ? (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Ver Sessões
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-f1-subtle/40">—</span>
                  )}
                  {isAvailable ? (
                    <ChevronRight
                      className={`h-4 w-4 transition-all shrink-0 ${
                        isInProgress
                          ? "text-emerald-400 group-hover:translate-x-0.5 group-hover:text-emerald-300"
                          : "text-f1-subtle group-hover:text-white group-hover:translate-x-0.5"
                      }`}
                    />
                  ) : (
                    <span className="h-4 w-4 shrink-0" />
                  )}
                </div>
              </>
            );

            if (isAvailable) {
              return (
                <Link
                  key={`${race.year}-${race.round_number}`}
                  href={`/season/round/${race.round_number}?year=${race.year}`}
                  className={`group grid grid-cols-12 items-center px-6 py-4 transition-all duration-200 hover:bg-white/[0.04] cursor-pointer ${
                    isInProgress
                      ? "hover:border-l-4 hover:border-l-emerald-500 bg-emerald-500/[0.02]"
                      : "hover:border-l-4 hover:border-l-f1-red"
                  }`}
                >
                  {rowContent}
                </Link>
              );
            }

            return (
              <div
                key={`${race.year}-${race.round_number}`}
                className="grid grid-cols-12 items-center px-6 py-4 opacity-60 bg-black/10 cursor-default"
                title="Corrida ainda não realizada"
              >
                {rowContent}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
