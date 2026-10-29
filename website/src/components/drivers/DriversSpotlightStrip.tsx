import React from "react";
import Link from "next/link";
import Image from "next/image";
import { DriverStanding, DriverCatalogItem } from "@/types/f1";
import { Trophy, ArrowUpRight, Crown } from "lucide-react";

interface Props {
  currentLeader?: DriverStanding | null;
  historicLeader?: DriverCatalogItem | null;
  seasonYear: number;
}

export default function DriversSpotlightStrip({
  currentLeader,
  historicLeader,
  seasonYear
}: Props) {
  if (!currentLeader && !historicLeader) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* ========================================================================= */}
      {/* CARD 1: LÍDER DA TEMPORADA ATUAL                                         */}
      {/* ========================================================================= */}
      {currentLeader && (
        <Link
          href={`/drivers/${currentLeader.driver_id || ""}`}
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E14] p-3 transition-all duration-200 hover:border-white/25 hover:bg-[#13131C] hover:shadow-lg"
        >
          {/* Linha de sotaque superior na cor da equipe */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: currentLeader.team_color || "#E10600" }}
          />

          <div className="flex items-center gap-3 min-w-0">
            {/* Foto do Piloto em Caixa Compacta */}
            <div
              className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0B0B10]"
              style={{
                borderColor: currentLeader.team_color
                  ? `${currentLeader.team_color}66`
                  : "rgba(255,255,255,0.1)"
              }}
            >
              {currentLeader.driver_headshot_url ? (
                <Image
                  src={currentLeader.driver_headshot_url}
                  alt={currentLeader.driver_full_name}
                  fill
                  className="object-cover object-top transition-transform duration-200 group-hover:scale-105"
                  sizes="44px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-xs font-bold text-white/50">
                  {currentLeader.driver_id?.slice(0, 3).toUpperCase() || "F1"}
                </div>
              )}
            </div>

            {/* Informações de Liderança */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Líder da Temporada ({seasonYear})
                </span>
                <span className="text-[10px] font-mono font-bold text-white/40">
                  P1
                </span>
              </div>
              <h4 className="text-sm font-black text-white truncate group-hover:underline decoration-white/40 transition-colors mt-0.5">
                {currentLeader.driver_full_name}
              </h4>
              <p className="text-[11px] text-f1-subtle font-mono truncate">
                <strong className="text-white">{currentLeader.team_name}</strong> •{" "}
                <strong className="text-emerald-400">{currentLeader.total_points} pts</strong> •{" "}
                {currentLeader.total_wins} {currentLeader.total_wins === 1 ? "vitória" : "vitórias"}
              </p>
            </div>
          </div>

          {/* Botão de Atalho */}
          <div className="shrink-0 pl-2">
            <span className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/70 group-hover:bg-white/10 group-hover:text-white transition-all">
              <span>Perfil</span>
              <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </Link>
      )}

      {/* ========================================================================= */}
      {/* CARD 2: MAIOR CAMPEÃO DA HISTÓRIA                                        */}
      {/* ========================================================================= */}
      {historicLeader && (
        <Link
          href={`/drivers/${historicLeader.driver_id}`}
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0E0E14] p-3 transition-all duration-200 hover:border-amber-500/40 hover:bg-[#13131C] hover:shadow-lg"
        >
          {/* Linha de sotaque superior dourada */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-300" />

          <div className="flex items-center gap-3 min-w-0">
            {/* Foto do Piloto Histórico */}
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-amber-500/30 bg-[#0B0B10]">
              {historicLeader.driver_headshot_url ? (
                <Image
                  src={historicLeader.driver_headshot_url}
                  alt={historicLeader.driver_full_name}
                  fill
                  className="object-cover object-top transition-transform duration-200 group-hover:scale-105"
                  sizes="44px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-xs font-bold text-amber-400">
                  {historicLeader.driver_abbreviation || "LEG"}
                </div>
              )}
            </div>

            {/* Informações Históricas */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider text-amber-400">
                  <Crown className="h-2.5 w-2.5" />
                  Maior Campeão (Era Moderna)
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400">
                  {historicLeader.total_world_championships}x Títulos
                </span>
              </div>
              <h4 className="text-sm font-black text-white truncate group-hover:text-amber-400 transition-colors mt-0.5">
                {historicLeader.driver_full_name}
              </h4>
              <p className="text-[11px] text-f1-subtle font-mono truncate">
                <strong className="text-amber-400">{historicLeader.total_wins} vitórias</strong> •{" "}
                <strong className="text-white">{historicLeader.total_podiums} pódios</strong> •{" "}
                {historicLeader.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pts
              </p>
            </div>
          </div>

          {/* Botão de Atalho */}
          <div className="shrink-0 pl-2">
            <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-400 group-hover:bg-amber-500/20 group-hover:text-white transition-all">
              <span>Perfil</span>
              <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
