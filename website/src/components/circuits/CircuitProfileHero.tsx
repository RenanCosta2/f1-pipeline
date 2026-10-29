"use client";

import React from "react";
import Link from "next/link";
import { CircuitOverviewItem } from "@/types/f1";
import { getCountryFlag, getTrackTypeBadge, formatSeasonsRanges } from "@/lib/circuitUtils";
import {
  ArrowLeft,
  Calendar,
  Flag,
  Trophy,
  Timer,
  Zap,
  AlertTriangle,
  MapPin,
  Shield
} from "lucide-react";

interface Props {
  overview: CircuitOverviewItem;
}

export default function CircuitProfileHero({ overview }: Props) {
  const trackBadge = getTrackTypeBadge(overview.track_type);
  const countryFlag = getCountryFlag(overview.country);
  const teamColor = overview.most_wins_team_color || "#E10600";

  return (
    <div className="space-y-3">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <Link
          href="/circuits"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-f1-subtle hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar para Catálogo de Circuitos</span>
        </Link>
      </div>

      {/* Strip Hero Compacto (~90px: Faixa Horizontal Enxuta de Alta Densidade) */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E14] p-4 sm:p-5 shadow-lg">
        {/* Accent Bar Superior */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background: `linear-gradient(90deg, #E10600 0%, ${teamColor} 100%)`
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Lado Esquerdo: Bandeira + Identificação Oficial em Linha */}
          <div className="flex items-center gap-4 min-w-0">
            {/* Bandeira do País com Moldura Compacta */}
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#161622] text-3xl sm:text-4xl shadow-md">
              <span role="img" aria-label={overview.country}>
                {countryFlag}
              </span>
            </div>

            {/* Metadados, Nome e Localização */}
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider font-sans ${trackBadge.badgeClass}`}
                >
                  <MapPin className="h-2.5 w-2.5" />
                  {trackBadge.label}
                </span>

                {(overview.years_held?.length || overview.seasons_list || overview.first_gp_year) && (
                  <>
                    <span className="text-white/20">•</span>
                    <span
                      className="text-f1-subtle"
                      title={overview.seasons_list ? `Temporadas com GP: ${overview.seasons_list}` : undefined}
                    >
                      {formatSeasonsRanges(overview.years_held || overview.seasons_list || (overview.first_gp_year ? [overview.first_gp_year, overview.last_gp_year || overview.first_gp_year] : []))}
                    </span>
                  </>
                )}

                <span className="text-white/20">•</span>
                <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-black text-white font-mono">
                  {overview.circuit_id.toUpperCase()}
                </span>
              </div>

              {/* Nome do Circuito */}
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white truncate">
                {overview.circuit_name}
              </h1>

              {/* Localização e País */}
              <div className="flex items-center gap-2 text-xs font-medium text-f1-subtle">
                <span className="text-white font-bold">{overview.location}</span>
                <span>•</span>
                <span className="text-zinc-300">{overview.country}</span>
                {overview.most_wins_team && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: teamColor }} />
                      <strong className="text-white">{overview.most_wins_team}</strong> ({overview.most_wins_team_count}v)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Lado Direito: Régua de KPIs em Linha Compacta (5 métricas em 1 linha) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/5 lg:pl-5">
            {/* 1. GPs Disputados */}
            <div className="rounded-xl border border-white/5 bg-[#12121A] px-3 py-2 text-center min-w-[70px]">
              <span className="block text-[10px] font-bold uppercase text-f1-subtle tracking-wider">
                GPs
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono block">
                {overview.total_gps_completed}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono block -mt-0.5">
                Edições
              </span>
            </div>

            {/* 2. Recorde de Corrida */}
            <div className="rounded-xl border border-white/5 bg-[#12121A] px-3 py-2 text-center min-w-[95px]">
              <span className="block text-[10px] font-bold uppercase text-purple-400 tracking-wider">
                Recorde GP
              </span>
              <span className="text-xs sm:text-sm font-black text-purple-300 font-mono block mt-0.5 truncate">
                {overview.race_lap_record_formatted || "—"}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans block truncate -mt-0.5" title={overview.race_lap_record_driver || "Sem registro"}>
                {overview.race_lap_record_driver || "Sem registro"}
              </span>
            </div>

            {/* 3. Recorde de Quali */}
            <div className="rounded-xl border border-white/5 bg-[#12121A] px-3 py-2 text-center min-w-[95px]">
              <span className="block text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                Recorde Quali
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-300 font-mono block mt-0.5 truncate">
                {overview.quali_lap_record_formatted || "—"}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans block truncate -mt-0.5" title={overview.quali_lap_record_driver || "Sem registro"}>
                {overview.quali_lap_record_driver || "Sem registro"}
              </span>
            </div>

            {/* 4. Maior Vencedor */}
            <div className="rounded-xl border border-white/5 bg-[#12121A] px-3 py-2 text-center min-w-[95px]">
              <span className="block text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                Top Piloto
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-300 block mt-0.5 truncate font-sans" title={overview.most_wins_driver || "—"}>
                {overview.most_wins_driver ? overview.most_wins_driver.split(' ').pop() : "—"}
              </span>
              <span className="text-[10px] text-amber-400 font-mono block -mt-0.5">
                {overview.most_wins_count ? `${overview.most_wins_count} vitórias` : "—"}
              </span>
            </div>

            {/* 5. Média DNF */}
            <div className="rounded-xl border border-white/5 bg-[#12121A] px-3 py-2 text-center min-w-[70px] col-span-2 sm:col-span-1">
              <span className="block text-[10px] font-bold uppercase text-rose-400 tracking-wider">
                Média DNF
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono block">
                {Number(overview.avg_dnfs_per_race || 0).toFixed(1)}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono block -mt-0.5">
                {overview.total_dnfs} total
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
