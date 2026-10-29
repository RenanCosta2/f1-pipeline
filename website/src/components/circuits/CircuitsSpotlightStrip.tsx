import React from "react";
import Link from "next/link";
import { SeasonRaceSummary } from "@/types/f1";
import { getCountryFlag } from "@/lib/circuitUtils";
import { Flag, Trophy, ChevronRight, Calendar, Zap, MapPin } from "lucide-react";

interface Props {
  upcomingRace?: SeasonRaceSummary | null;
  lastRace?: SeasonRaceSummary | null;
}

export default function CircuitsSpotlightStrip({
  upcomingRace,
  lastRace
}: Props) {
  if (!upcomingRace && !lastRace) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* ========================================================================= */}
      {/* CARD 1: PRÓXIMO GP NO CALENDÁRIO                                         */}
      {/* ========================================================================= */}
      {upcomingRace && (
        <Link
          href={`/circuits/${upcomingRace.circuit_id}`}
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E14] p-3 transition-all duration-200 hover:border-white/25 hover:bg-[#13131C] hover:shadow-lg"
        >
          {/* Linha de sotaque superior vermelha F1 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-f1-red to-rose-400" />

          <div className="flex items-center gap-3 min-w-0">
            {/* Bandeira do País da Próxima Etapa */}
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0B0B10] flex items-center justify-center text-2xl shadow-inner">
              <span role="img" aria-label={upcomingRace.country}>
                {getCountryFlag(upcomingRace.country)}
              </span>
            </div>

            {/* Informações da Próxima Corrida */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-f1-red/30 bg-f1-red/10 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider text-f1-red">
                  <span className="h-1.5 w-1.5 rounded-full bg-f1-red animate-pulse" />
                  Próximo GP (Etapa {upcomingRace.round_number})
                </span>
                <span className="text-[10px] font-mono font-bold text-white/40">
                  {upcomingRace.country}
                </span>
              </div>
              <h4 className="text-sm font-black text-white truncate group-hover:underline decoration-white/40 transition-colors mt-0.5">
                {upcomingRace.circuit_name}
              </h4>
              <p className="text-[11px] text-f1-subtle font-mono truncate">
                <strong className="text-white">{upcomingRace.location}</strong> •{" "}
                {upcomingRace.official_event_name || `GP de ${upcomingRace.country}`}
              </p>
            </div>
          </div>

          {/* Botão de Atalho */}
          <div className="shrink-0 pl-2">
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-white/70 group-hover:text-white transition-colors">
              <span className="hidden sm:inline">Pista</span>
              <ChevronRight className="h-3.5 w-3.5 text-f1-subtle group-hover:text-white transition-colors" />
            </span>
          </div>
        </Link>
      )}

      {/* ========================================================================= */}
      {/* CARD 2: ÚLTIMO GP CONCLUÍDO                                              */}
      {/* ========================================================================= */}
      {lastRace && (
        <Link
          href={`/circuits/${lastRace.circuit_id}`}
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E14] p-3 transition-all duration-200 hover:border-white/25 hover:bg-[#13131C] hover:shadow-lg"
        >
          {/* Linha de sotaque superior na cor da equipe vencedora */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              backgroundColor: lastRace.race_winner_team_color || lastRace.team_color || "#10B981"
            }}
          />

          <div className="flex items-center gap-3 min-w-0">
            {/* Bandeira do País do Último GP */}
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0B0B10] flex items-center justify-center text-2xl shadow-inner">
              <span role="img" aria-label={lastRace.country}>
                {getCountryFlag(lastRace.country)}
              </span>
            </div>

            {/* Informações da Etapa Recente */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                  <Zap className="h-2.5 w-2.5" />
                  Último GP Realizado (Etapa {lastRace.round_number})
                </span>
                <span className="text-[10px] font-mono font-bold text-white/40">
                  {lastRace.country}
                </span>
              </div>
              <h4 className="text-sm font-black text-white truncate group-hover:text-emerald-400 transition-colors mt-0.5">
                {lastRace.circuit_name}
              </h4>
              <p className="text-[11px] text-f1-subtle font-mono truncate">
                {lastRace.race_winner_driver ? (
                  <>
                    Vitória de <strong className="text-white">{lastRace.race_winner_driver}</strong> (
                    <span
                      style={{
                        color: lastRace.race_winner_team_color || "#E10600"
                      }}
                    >
                      {lastRace.race_winner_team}
                    </span>
                    )
                  </>
                ) : (
                  <span>{lastRace.location}, {lastRace.country}</span>
                )}
              </p>
            </div>
          </div>

          {/* Botão de Atalho */}
          <div className="shrink-0 pl-2">
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-white/70 group-hover:text-white transition-colors">
              <span className="hidden sm:inline">Pista</span>
              <ChevronRight className="h-3.5 w-3.5 text-f1-subtle group-hover:text-emerald-400 transition-colors" />
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
