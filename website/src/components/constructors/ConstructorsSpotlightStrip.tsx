import React from "react";
import Link from "next/link";
import { ConstructorStanding, ConstructorCatalogItem } from "@/types/f1";
import { getTeamProfileUrl, getTeamAbbreviation } from "@/lib/teamUtils";
import { Trophy, ArrowUpRight, Crown, Shield } from "lucide-react";

interface Props {
  currentLeader?: ConstructorStanding | null;
  historicLeader?: ConstructorCatalogItem | null;
  seasonYear: number;
}

export default function ConstructorsSpotlightStrip({
  currentLeader,
  historicLeader,
  seasonYear
}: Props) {
  if (!currentLeader && !historicLeader) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {/* ========================================================================= */}
      {/* CARD 1: LÍDER DE CONSTRUTORES DA TEMPORADA ATUAL                         */}
      {/* ========================================================================= */}
      {currentLeader && (
        <Link
          href={getTeamProfileUrl(undefined, currentLeader.team_name)}
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E14] p-3 sm:p-4 transition-all duration-200 hover:border-white/25 hover:bg-[#13131C] hover:shadow-lg min-h-[68px] sm:min-h-[76px] active:scale-[0.99]"
        >
          {/* Linha de sotaque superior na cor da equipe */}
          <div
            className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
            style={{ backgroundColor: currentLeader.team_color || "#E10600" }}
          />

          <div className="flex items-center gap-3 min-w-0">
            {/* Monograma da Equipe Líder */}
            <div
              className="relative h-11 w-11 sm:h-13 sm:w-13 lg:h-14 lg:w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 flex flex-col items-center justify-center font-mono font-black text-xs sm:text-sm text-white shadow-inner"
              style={{
                background: `linear-gradient(135deg, #181824 0%, ${currentLeader.team_color || "#E10600"}44 100%)`,
                borderColor: currentLeader.team_color
                  ? `${currentLeader.team_color}66`
                  : "rgba(255,255,255,0.1)"
              }}
            >
              <div
                className="h-1 w-3.5 rounded-full mb-0.5"
                style={{ backgroundColor: currentLeader.team_color || "#E10600" }}
              />
              <span className="text-xs sm:text-sm">{getTeamAbbreviation(currentLeader.team_name)}</span>
            </div>

            {/* Informações da Equipe Líder */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Líder de Construtores ({seasonYear})
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-white/40">
                  P1
                </span>
              </div>
              <h4 className="text-xs sm:text-sm lg:text-base font-black text-white truncate group-hover:underline decoration-white/40 transition-colors mt-0.5 leading-snug">
                {currentLeader.team_name}
              </h4>
              <p className="text-[10px] sm:text-[11px] lg:text-xs text-f1-subtle font-mono truncate mt-0.5">
                <strong className="text-emerald-400">{currentLeader.total_points} pts</strong> •{" "}
                <strong className="text-white">{currentLeader.total_wins} {currentLeader.total_wins === 1 ? "vitória" : "vitórias"}</strong> •{" "}
                {currentLeader.total_podiums} pódios
              </p>
            </div>
          </div>

          {/* Botão de Atalho */}
          <div className="shrink-0 pl-2">
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white/70 group-hover:bg-white/10 group-hover:text-white transition-all">
              <span className="hidden sm:inline lg:hidden xl:inline">Equipe</span>
              <ArrowUpRight className="h-3.5 w-3.5 sm:h-3 sm:w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </Link>
      )}

      {/* ========================================================================= */}
      {/* CARD 2: MAIOR CAMPEÃ DA HISTÓRIA                                         */}
      {/* ========================================================================= */}
      {historicLeader && (
        <Link
          href={getTeamProfileUrl(historicLeader.team_id, historicLeader.team_name)}
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0E0E14] p-3 sm:p-4 transition-all duration-200 hover:border-amber-500/40 hover:bg-[#13131C] hover:shadow-lg min-h-[68px] sm:min-h-[76px] active:scale-[0.99]"
        >
          {/* Linha de sotaque superior dourada */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-300 transition-all group-hover:h-1.5" />

          <div className="flex items-center gap-3 min-w-0">
            {/* Monograma da Equipe Histórica */}
            <div
              className="relative h-11 w-11 sm:h-13 sm:w-13 lg:h-14 lg:w-14 shrink-0 overflow-hidden rounded-xl border border-amber-500/30 flex flex-col items-center justify-center font-mono font-black text-xs sm:text-sm text-white shadow-inner"
              style={{
                background: `linear-gradient(135deg, #181824 0%, ${historicLeader.team_color || "#E10600"}44 100%)`
              }}
            >
              <div
                className="h-1 w-3.5 rounded-full mb-0.5 bg-amber-400"
              />
              <span className="text-amber-300 text-xs sm:text-sm">{getTeamAbbreviation(historicLeader.team_name, historicLeader.team_id)}</span>
            </div>

            {/* Informações da Equipe Histórica */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-400">
                  <Crown className="h-2.5 w-2.5" />
                  Maior Campeã da História
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-400">
                  {historicLeader.total_world_championships}x Títulos
                </span>
              </div>
              <h4 className="text-xs sm:text-sm lg:text-base font-black text-white truncate group-hover:text-amber-400 transition-colors mt-0.5 leading-snug">
                {historicLeader.team_name}
              </h4>
              <p className="text-[10px] sm:text-[11px] lg:text-xs text-f1-subtle font-mono truncate mt-0.5">
                <strong className="text-amber-400">{historicLeader.total_wins} vitórias</strong> •{" "}
                <strong className="text-purple-300">{historicLeader.total_one_two} dobradinhas</strong> •{" "}
                {historicLeader.total_podiums} pódios
              </p>
            </div>
          </div>

          {/* Botão de Atalho */}
          <div className="shrink-0 pl-2">
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-amber-400 group-hover:bg-amber-500/20 group-hover:text-white transition-all">
              <span className="hidden sm:inline lg:hidden xl:inline">Equipe</span>
              <ArrowUpRight className="h-3.5 w-3.5 sm:h-3 sm:w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
