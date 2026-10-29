"use client";

import React from "react";
import Link from "next/link";
import { DriverCatalogItem } from "@/types/f1";
import { ArrowLeft, Trophy, Flag, Shield } from "lucide-react";
import { getCountryFlag } from "@/lib/circuitUtils";
import { TeamLink } from "@/lib/teamUtils";

interface Props {
  profile: DriverCatalogItem;
}

export default function DriverProfileHero({ profile }: Props) {
  const teamColor = profile.team_color || "#E10600";
  const isChampion = profile.total_world_championships > 0;
  const flag = getCountryFlag(profile.driver_nationality);

  const raceWins = profile.race_wins ?? profile.total_wins;
  const sprintWins = profile.sprint_wins ?? 0;
  const racePodiums = profile.race_podiums ?? (profile.total_podiums - (profile.sprint_podiums ?? 0));
  const sprintPodiums = profile.sprint_podiums ?? 0;

  return (
    <div className="space-y-3">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <Link
          href="/drivers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-f1-subtle hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar para Galeria de Pilotos</span>
        </Link>
      </div>

      {/* Strip Hero Compacto (Estilo Cockpit F1) */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg">
        {/* Accent Bar Superior */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: teamColor }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Lado Esquerdo: Foto/Avatar + Identificação em Linha Compacta */}
          <div className="flex items-center gap-4 min-w-0">
            {/* Foto Oficial com Moldura Compacta */}
            <div
              className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#06060A] shadow-md"
              style={{ borderColor: `${teamColor}88` }}
            >
              {profile.driver_headshot_url ? (
                <img
                  src={profile.driver_headshot_url}
                  alt={profile.driver_full_name}
                  className="h-full w-full object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-xl font-black text-white"
                  style={{
                    background: `linear-gradient(135deg, #181824 0%, ${teamColor}44 100%)`
                  }}
                >
                  {profile.driver_abbreviation || profile.driver_full_name.substring(0, 3).toUpperCase()}
                </div>
              )}
            </div>

            {/* Nome, Equipe e Metadados em Tipografia Enxuta */}
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                {profile.is_active ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    GRID 2026
                  </span>
                ) : (
                  <span className="font-semibold text-zinc-400">
                    INATIVO ({profile.last_season})
                  </span>
                )}
                <span className="text-white/20">•</span>
                <span className="text-f1-subtle">
                  {profile.first_season}–{profile.last_season} ({profile.total_seasons} temp.)
                </span>
                {profile.driver_nationality && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="text-zinc-300 font-medium flex items-center gap-1">
                      <span>{flag}</span>
                      <span>{profile.driver_nationality}</span>
                    </span>
                  </>
                )}
                {profile.driver_abbreviation && (
                  <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-black text-white">
                    {profile.driver_abbreviation}
                  </span>
                )}
              </div>

              {/* Nome */}
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white truncate">
                  {profile.driver_full_name}
                </h1>
                {isChampion && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-black text-amber-400 shrink-0">
                    <Trophy className="h-3 w-3" />
                    {profile.total_world_championships}x Campeão
                  </span>
                )}
              </div>

              {/* Equipe Atual */}
              <div className="flex items-center gap-2 text-xs font-medium">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: teamColor }}
                />
                <TeamLink
                  teamName={profile.team_name}
                  teamId={profile.team_id}
                  className="text-white font-bold hover:underline hover:text-white transition-colors"
                  title={`Ver perfil de ${profile.team_name}`}
                >
                  {profile.team_name || "Fórmula 1"}
                </TeamLink>
                <span className="text-f1-subtle font-mono text-[11px]">
                  {profile.is_active ? "· Equipe Atual" : "· Última Equipe"}
                </span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Régua de KPIs em Linha Compacta (1 única linha) */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/5 lg:pl-6">
            {/* GPs */}
            <div className="rounded-xl border border-white/5 bg-[#12121A] px-3 py-2 text-center min-w-[64px] sm:min-w-[80px]">
              <span className="block text-[10px] font-bold uppercase text-f1-subtle tracking-wider">
                GPs
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono block">
                {profile.total_gps}
              </span>
              {profile.rank_gps && (
                <span className="text-[10px] text-f1-subtle font-mono block -mt-0.5">
                  #{profile.rank_gps}
                </span>
              )}
            </div>

            {/* Vitórias */}
            <div className="rounded-xl border border-white/5 bg-[#12121A] px-3 py-2 text-center min-w-[64px] sm:min-w-[80px]">
              <span className="block text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                Vitórias
              </span>
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono block">
                {profile.total_wins}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono block -mt-0.5" title={`${raceWins} GP · ${sprintWins} Sprint`}>
                {raceWins} GP
              </span>
            </div>

            {/* Pódios */}
            <div className="rounded-xl border border-white/5 bg-[#12121A] px-3 py-2 text-center min-w-[64px] sm:min-w-[80px]">
              <span className="block text-[10px] font-bold uppercase text-blue-400 tracking-wider">
                Pódios
              </span>
              <span className="text-base sm:text-lg font-black text-blue-300 font-mono block">
                {profile.total_podiums}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono block -mt-0.5" title={`${racePodiums} GP · ${sprintPodiums} Sprint`}>
                {racePodiums} GP
              </span>
            </div>

            {/* Poles */}
            <div className="rounded-xl border border-white/5 bg-[#12121A] px-3 py-2 text-center min-w-[64px] sm:min-w-[80px]">
              <span className="block text-[10px] font-bold uppercase text-purple-400 tracking-wider">
                Poles
              </span>
              <span className="text-base sm:text-lg font-black text-purple-300 font-mono block">
                {profile.race_poles}
              </span>
              {(profile.rank_poles || profile.rank_race_wins) && (
                <span className="text-[10px] text-zinc-400 font-mono block -mt-0.5">
                  #{profile.rank_poles || "—"}
                </span>
              )}
            </div>

            {/* Pontos Totais */}
            <div className="rounded-xl border border-white/5 bg-[#12121A] px-3 py-2 text-center min-w-[70px] sm:min-w-[90px]">
              <span className="block text-[10px] font-bold uppercase text-f1-subtle tracking-wider">
                Pontos
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono block">
                {Math.round(profile.total_points).toLocaleString("pt-BR")}
              </span>
              {profile.rank_points && (
                <span className="text-[10px] text-zinc-400 font-mono block -mt-0.5">
                  #{profile.rank_points}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
