"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { DriverStanding, DriverCatalogItem } from "@/types/f1";
import { ArrowUpRight, Crown } from "lucide-react";
import {
  useTieCarousel,
  TieCarouselEdgeArrows,
  TieCarouselTrack,
  TieCarouselDots,
} from "@/components/ui/TieCarousel";

interface Props {
  currentLeader?: DriverStanding | null;
  currentLeaders?: DriverStanding[];
  historicLeader?: DriverCatalogItem | null;
  historicLeaders?: DriverCatalogItem[];
  seasonYear: number;
}

export default function DriversSpotlightStrip({
  currentLeader,
  currentLeaders = [],
  historicLeader,
  historicLeaders = [],
  seasonYear
}: Props) {
  const effectiveCurrent = currentLeaders.length > 0 ? currentLeaders : currentLeader ? [currentLeader] : [];
  const effectiveHistoric = historicLeaders.length > 0 ? historicLeaders : historicLeader ? [historicLeader] : [];

  const curCarousel = useTieCarousel(effectiveCurrent.length, { autoPlayMs: 5000 });
  const histCarousel = useTieCarousel(effectiveHistoric.length, { autoPlayMs: 5000 });

  if (effectiveCurrent.length === 0 && effectiveHistoric.length === 0) return null;

  const activeCurrent = effectiveCurrent[curCarousel.index] || effectiveCurrent[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {/* ========================================================================= */}
      {/* CARD 1: LÍDER DA TEMPORADA ATUAL                                         */}
      {/* ========================================================================= */}
      {effectiveCurrent.length > 0 && (
        <div
          onMouseEnter={curCarousel.pause}
          onMouseLeave={curCarousel.resume}
          className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E14] py-3 sm:py-4 transition-all duration-200 hover:border-white/25 hover:bg-[#13131C] hover:shadow-lg min-h-[68px] sm:min-h-[76px] ${
            curCarousel.isTied ? "px-5 sm:px-6" : "px-3 sm:px-4"
          }`}
        >
          {/* Linha de sotaque superior na cor da equipe */}
          <div
            className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
            style={{ backgroundColor: activeCurrent?.team_color || "#E10600" }}
          />
          <TieCarouselEdgeArrows carousel={curCarousel} accent="emerald" size="xs" />

          <TieCarouselTrack
            carousel={curCarousel}
            items={effectiveCurrent}
            keyExtractor={(l) => l.driver_id || l.driver_full_name}
            renderItem={(leader) => (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Link
                    href={`/drivers/${leader.driver_id || ""}`}
                    className="relative h-11 w-11 sm:h-13 sm:w-13 lg:h-14 lg:w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0B0B10]"
                    style={{
                      borderColor: leader.team_color
                        ? `${leader.team_color}66`
                        : "rgba(255,255,255,0.1)"
                    }}
                  >
                    {leader.driver_headshot_url ? (
                      <Image
                        src={leader.driver_headshot_url}
                        alt={leader.driver_full_name}
                        fill
                        className="object-cover object-top transition-transform duration-200 group-hover:scale-105"
                        sizes="64px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-mono text-xs font-bold text-white/50">
                        {leader.driver_id?.slice(0, 3).toUpperCase() || "F1"}
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Líder da Temporada ({seasonYear})
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono font-bold text-white/40">
                        P1
                      </span>
                    </div>
                    <Link href={`/drivers/${leader.driver_id || ""}`} className="block">
                      <h4 className="text-xs sm:text-sm lg:text-base font-black text-white truncate hover:underline decoration-white/40 transition-colors mt-0.5 leading-snug">
                        {leader.driver_full_name}
                      </h4>
                    </Link>
                    <p className="text-[10px] sm:text-[11px] lg:text-xs text-f1-subtle font-mono truncate mt-0.5">
                      <strong className="text-white">{leader.team_name}</strong> •{" "}
                      <strong className="text-emerald-400">{leader.total_points} pts</strong> •{" "}
                      {leader.total_wins} {leader.total_wins === 1 ? "vitória" : "vitórias"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                  <Link
                    href={`/drivers/${leader.driver_id || ""}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <span className="hidden sm:inline lg:hidden xl:inline">Perfil</span>
                    <ArrowUpRight className="h-3.5 w-3.5 sm:h-3 sm:w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <TieCarouselDots carousel={curCarousel} accent="emerald" />
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* CARD 2: MAIOR CAMPEÃO DA HISTÓRIA                                        */}
      {/* ========================================================================= */}
      {effectiveHistoric.length > 0 && (
        <div
          onMouseEnter={histCarousel.pause}
          onMouseLeave={histCarousel.resume}
          className={`group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0E0E14] py-3 sm:py-4 transition-all duration-200 hover:border-amber-500/40 hover:bg-[#13131C] hover:shadow-lg min-h-[68px] sm:min-h-[76px] ${
            histCarousel.isTied ? "px-5 sm:px-6" : "px-3 sm:px-4"
          }`}
        >
          {/* Linha de sotaque superior dourada */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-300 transition-all group-hover:h-1.5" />
          <TieCarouselEdgeArrows carousel={histCarousel} accent="amber" size="xs" />

          <TieCarouselTrack
            carousel={histCarousel}
            items={effectiveHistoric}
            keyExtractor={(c) => c.driver_id}
            renderItem={(champ) => (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Link
                    href={`/drivers/${champ.driver_id}`}
                    className="relative h-11 w-11 sm:h-13 sm:w-13 lg:h-14 lg:w-14 shrink-0 overflow-hidden rounded-xl border border-amber-500/30 bg-[#0B0B10]"
                  >
                    {champ.driver_headshot_url ? (
                      <Image
                        src={champ.driver_headshot_url}
                        alt={champ.driver_full_name}
                        fill
                        className="object-cover object-top transition-transform duration-200 group-hover:scale-105"
                        sizes="64px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-mono text-xs font-bold text-amber-400">
                        {champ.driver_abbreviation || "LEG"}
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-400">
                        <Crown className="h-2.5 w-2.5" />
                        Maior Campeão da História
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-400">
                        {champ.total_world_championships}x Títulos
                      </span>
                    </div>
                    <Link href={`/drivers/${champ.driver_id}`} className="block">
                      <h4 className="text-xs sm:text-sm lg:text-base font-black text-white truncate hover:text-amber-400 transition-colors mt-0.5 leading-snug">
                        {champ.driver_full_name}
                      </h4>
                    </Link>
                    <p className="text-[10px] sm:text-[11px] lg:text-xs text-f1-subtle font-mono truncate mt-0.5">
                      <strong className="text-amber-400">{champ.total_wins} vitórias</strong> •{" "}
                      <strong className="text-white">{champ.total_podiums} pódios</strong> •{" "}
                      {champ.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pts
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                  <Link
                    href={`/drivers/${champ.driver_id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-amber-400 hover:bg-amber-500/20 hover:text-white transition-all"
                  >
                    <span className="hidden sm:inline lg:hidden xl:inline">Perfil</span>
                    <ArrowUpRight className="h-3.5 w-3.5 sm:h-3 sm:w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <TieCarouselDots carousel={histCarousel} accent="amber" />
                </div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
