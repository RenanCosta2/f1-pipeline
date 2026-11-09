"use client";

import React, { useState } from "react";
import { IdealLap } from "@/types/f1";
import { Timer, CheckCircle, Sparkles, AlertCircle, Award, ArrowUpRight, ChevronDown, ExternalLink } from "lucide-react";
import DriverLink from "@/lib/driverUtils";
import TeamLink from "@/lib/teamUtils";

interface Props {
  data: IdealLap[];
  className?: string;
}

export default function IdealLapCard({ data, className }: Props) {
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-[#0B0B10] p-8 text-center text-f1-subtle ${className || ""}`}>
        Nenhum registro de volta ideal teórica para esta sessão.
      </div>
    );
  }

  // Deduplicate drivers (in case multiple records exist) and keep best lap
  const uniqueLapsMap = new Map<string, IdealLap>();
  data.forEach((item) => {
    if (!uniqueLapsMap.has(item.driver_full_name) || (item.lap_time && item.lap_time < (uniqueLapsMap.get(item.driver_full_name)?.lap_time || "9:99:999"))) {
      uniqueLapsMap.set(item.driver_full_name, item);
    }
  });

  const sortedLaps = Array.from(uniqueLapsMap.values()).sort((a, b) =>
    (a.lap_time || "9:99:999") > (b.lap_time || "9:99:999") ? 1 : -1
  );

  // Find absolute best sectors across all drivers (Purple Sectors)
  let bestS1 = { time: "9:99:999", driver: "", team: "", color: "", headshot: "" };
  let bestS2 = { time: "9:99:999", driver: "", team: "", color: "", headshot: "" };
  let bestS3 = { time: "9:99:999", driver: "", team: "", color: "", headshot: "" };

  sortedLaps.forEach((d) => {
    if (d.sector_1 && d.sector_1 < bestS1.time) {
      bestS1 = {
        time: d.sector_1,
        driver: d.driver_full_name,
        team: d.team_name,
        color: d.team_color || "",
        headshot: d.driver_headshot_url || ""
      };
    }
    if (d.sector_2 && d.sector_2 < bestS2.time) {
      bestS2 = {
        time: d.sector_2,
        driver: d.driver_full_name,
        team: d.team_name,
        color: d.team_color || "",
        headshot: d.driver_headshot_url || ""
      };
    }
    if (d.sector_3 && d.sector_3 < bestS3.time) {
      bestS3 = {
        time: d.sector_3,
        driver: d.driver_full_name,
        team: d.team_name,
        color: d.team_color || "",
        headshot: d.driver_headshot_url || ""
      };
    }
  });

  return (
    <div className={`rounded-2xl border border-white/10 bg-[#0B0B10] p-3.5 sm:p-6 shadow-xl ${className || ""}`}>
      {/* Header */}
      <div className="border-b border-white/10 pb-3 sm:pb-4 mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-lg font-mono font-bold uppercase text-white tracking-wider flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          Volta Ideal Teórica vs Volta Real
        </h3>
        <p className="text-[11px] sm:text-xs text-f1-subtle font-medium mt-0.5 sm:mt-1">
          A soma dos três melhores setores individuais (S1 + S2 + S3) aferidos na sessão comparados com o tempo real obtido na volta mais rápida.
        </p>
      </div>

      {/* Global Purple Sectors Cards (Lado a Lado mesmo no Mobile: grid-cols-3) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-4 sm:mb-6">
        {/* Setor 1 */}
        <div className="p-2 sm:p-4 rounded-xl border border-purple-500/30 bg-[#13111E] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 pr-0 sm:pr-2 flex-1">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider truncate">
                <span className="sm:hidden">S1</span>
                <span className="hidden sm:inline">Melhor Setor 1</span>
              </span>
            </div>
            <span className="text-sm sm:text-xl font-black font-mono text-purple-300 block truncate">
              {bestS1.time !== "9:99:999" ? bestS1.time : "—"}
            </span>
            {bestS1.driver ? (
              <DriverLink driverName={bestS1.driver} className="block group">
                <span className="text-[11px] sm:text-xs text-white group-hover:text-purple-300 transition-colors font-bold sm:font-medium inline-flex items-center gap-0.5 sm:gap-1 mt-0.5 max-w-full">
                  <span className="truncate">{bestS1.driver.split(" ").slice(-1)[0]}</span>
                  <ArrowUpRight className="hidden sm:inline h-3 w-3 shrink-0 text-purple-400/60 group-hover:text-purple-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </DriverLink>
            ) : (
              <span className="text-[11px] sm:text-xs text-white font-medium block truncate mt-0.5">—</span>
            )}
            <TeamLink
              teamName={bestS1.team}
              className="text-[9px] sm:text-[10px] block truncate font-mono text-zinc-500 hover:text-purple-300 transition-colors hidden sm:block"
            >
              {bestS1.team || "—"}
            </TeamLink>
          </div>

          {bestS1.driver ? (
            <DriverLink
              driverName={bestS1.driver}
              className="relative hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 transition-transform hover:scale-105"
              style={{ borderColor: bestS1.color || "#A855F7" }}
              title={`Ver perfil de ${bestS1.driver}`}
            >
              {bestS1.headshot ? (
                <img src={bestS1.headshot} alt={bestS1.driver} className="h-full w-full object-cover object-top" />
              ) : (
                <span className="font-mono text-[10px] font-bold text-purple-300">S1</span>
              )}
            </DriverLink>
          ) : (
            <div
              className="relative hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5"
              style={{ borderColor: "#A855F7" }}
            >
              <span className="font-mono text-[10px] font-bold text-purple-300">S1</span>
            </div>
          )}
        </div>

        {/* Setor 2 */}
        <div className="p-2 sm:p-4 rounded-xl border border-purple-500/30 bg-[#13111E] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 pr-0 sm:pr-2 flex-1">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider truncate">
                <span className="sm:hidden">S2</span>
                <span className="hidden sm:inline">Melhor Setor 2</span>
              </span>
            </div>
            <span className="text-sm sm:text-xl font-black font-mono text-purple-300 block truncate">
              {bestS2.time !== "9:99:999" ? bestS2.time : "—"}
            </span>
            {bestS2.driver ? (
              <DriverLink driverName={bestS2.driver} className="block group">
                <span className="text-[11px] sm:text-xs text-white group-hover:text-purple-300 transition-colors font-bold sm:font-medium inline-flex items-center gap-0.5 sm:gap-1 mt-0.5 max-w-full">
                  <span className="truncate">{bestS2.driver.split(" ").slice(-1)[0]}</span>
                  <ArrowUpRight className="hidden sm:inline h-3 w-3 shrink-0 text-purple-400/60 group-hover:text-purple-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </DriverLink>
            ) : (
              <span className="text-[11px] sm:text-xs text-white font-medium block truncate mt-0.5">—</span>
            )}
            <TeamLink
              teamName={bestS2.team}
              className="text-[9px] sm:text-[10px] block truncate font-mono text-zinc-500 hover:text-purple-300 transition-colors hidden sm:block"
            >
              {bestS2.team || "—"}
            </TeamLink>
          </div>

          {bestS2.driver ? (
            <DriverLink
              driverName={bestS2.driver}
              className="relative hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 transition-transform hover:scale-105"
              style={{ borderColor: bestS2.color || "#A855F7" }}
              title={`Ver perfil de ${bestS2.driver}`}
            >
              {bestS2.headshot ? (
                <img src={bestS2.headshot} alt={bestS2.driver} className="h-full w-full object-cover object-top" />
              ) : (
                <span className="font-mono text-[10px] font-bold text-purple-300">S2</span>
              )}
            </DriverLink>
          ) : (
            <div
              className="relative hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5"
              style={{ borderColor: "#A855F7" }}
            >
              <span className="font-mono text-[10px] font-bold text-purple-300">S2</span>
            </div>
          )}
        </div>

        {/* Setor 3 */}
        <div className="p-2 sm:p-4 rounded-xl border border-purple-500/30 bg-[#13111E] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 pr-0 sm:pr-2 flex-1">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider truncate">
                <span className="sm:hidden">S3</span>
                <span className="hidden sm:inline">Melhor Setor 3</span>
              </span>
            </div>
            <span className="text-sm sm:text-xl font-black font-mono text-purple-300 block truncate">
              {bestS3.time !== "9:99:999" ? bestS3.time : "—"}
            </span>
            {bestS3.driver ? (
              <DriverLink driverName={bestS3.driver} className="block group">
                <span className="text-[11px] sm:text-xs text-white group-hover:text-purple-300 transition-colors font-bold sm:font-medium inline-flex items-center gap-0.5 sm:gap-1 mt-0.5 max-w-full">
                  <span className="truncate">{bestS3.driver.split(" ").slice(-1)[0]}</span>
                  <ArrowUpRight className="hidden sm:inline h-3 w-3 shrink-0 text-purple-400/60 group-hover:text-purple-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </DriverLink>
            ) : (
              <span className="text-[11px] sm:text-xs text-white font-medium block truncate mt-0.5">—</span>
            )}
            <TeamLink
              teamName={bestS3.team}
              className="text-[9px] sm:text-[10px] block truncate font-mono text-zinc-500 hover:text-purple-300 transition-colors hidden sm:block"
            >
              {bestS3.team || "—"}
            </TeamLink>
          </div>

          {bestS3.driver ? (
            <DriverLink
              driverName={bestS3.driver}
              className="relative hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 transition-transform hover:scale-105"
              style={{ borderColor: bestS3.color || "#A855F7" }}
              title={`Ver perfil de ${bestS3.driver}`}
            >
              {bestS3.headshot ? (
                <img src={bestS3.headshot} alt={bestS3.driver} className="h-full w-full object-cover object-top" />
              ) : (
                <span className="font-mono text-[10px] font-bold text-purple-300">S3</span>
              )}
            </DriverLink>
          ) : (
            <div
              className="relative hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5"
              style={{ borderColor: "#A855F7" }}
            >
              <span className="font-mono text-[10px] font-bold text-purple-300">S3</span>
            </div>
          )}
        </div>
      </div>

      {/* Dica visual de expansão no mobile (< md) */}
      <div className="md:hidden flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-[11px] text-f1-subtle">
        <span className="flex items-center gap-1.5">
          <ChevronDown className="h-3.5 w-3.5 text-f1-red shrink-0" />
          <span>Toque em qualquer linha para expandir setores (S1, S2, S3) e perfil</span>
        </span>
      </div>

      {/* Main Table: Zero Scroll Horizontal no mobile */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] sm:text-[11px] font-bold text-f1-subtle uppercase tracking-wider">
              <th className="pb-2.5 sm:pb-3 w-7 sm:w-10 text-center">Pos</th>
              <th className="pb-2.5 sm:pb-3">Piloto</th>
              <th className="pb-2.5 sm:pb-3 text-center hidden md:table-cell">Melhor S1</th>
              <th className="pb-2.5 sm:pb-3 text-center hidden md:table-cell">Melhor S2</th>
              <th className="pb-2.5 sm:pb-3 text-center hidden md:table-cell">Melhor S3</th>
              <th className="pb-2.5 sm:pb-3 text-right">Volta Real</th>
              <th className="pb-2.5 sm:pb-3 text-right whitespace-nowrap">
                <span className="sm:hidden">Delta</span>
                <span className="hidden sm:inline">Delta Teórico (Eficiência)</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-xs">
            {sortedLaps.map((item, idx) => {
              const isPerfect = item.delta_ideal_lap === "0:00.000" || item.delta_ideal_lap === "0:00:000";
              const isBestS1 = item.sector_1 === bestS1.time;
              const isBestS2 = item.sector_2 === bestS2.time;
              const isBestS3 = item.sector_3 === bestS3.time;
              const isExpanded = expandedDriver === item.driver_full_name;

              return (
                <React.Fragment key={item.driver_full_name}>
                  <tr
                    onClick={() => setExpandedDriver(isExpanded ? null : item.driver_full_name)}
                    className={`group transition-colors cursor-pointer md:cursor-default ${
                      isExpanded ? "bg-white/[0.06] md:bg-transparent" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <td className="py-2.5 sm:py-3.5 text-center font-bold font-sans">
                      <span className={`inline-flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full text-[10px] sm:text-xs font-black ${
                        idx === 0 ? "bg-amber-400 text-black font-bold" : "text-f1-subtle"
                      }`}>
                        {idx + 1}
                      </span>
                    </td>

                    <td className="py-2.5 sm:py-3.5 font-sans max-w-[165px] sm:max-w-none">
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <div
                          className="w-1.5 h-7 rounded-full shrink-0 sm:hidden"
                          style={{ backgroundColor: item.team_color || "#374151" }}
                        />
                        <DriverLink
                          driverName={item.driver_full_name}
                          className="relative hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 transition-transform hover:scale-105 pointer-events-none md:pointer-events-auto"
                          style={{ borderColor: item.team_color || "#374151" }}
                          title={`Ver perfil de ${item.driver_full_name}`}
                        >
                          {item.driver_headshot_url ? (
                            <img
                              src={item.driver_headshot_url}
                              alt={item.driver_full_name}
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <span className="text-[10px] font-mono text-f1-subtle">
                              {item.driver_full_name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </DriverLink>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5 min-w-0">
                            <DriverLink
                              driverName={item.driver_full_name}
                              className="font-bold text-white text-xs sm:text-sm block truncate hover:text-f1-red transition-colors pointer-events-none md:pointer-events-auto"
                              title={`Ver perfil de ${item.driver_full_name}`}
                            >
                              {item.driver_full_name}
                            </DriverLink>
                            <span
                              className={`md:hidden inline-flex h-5 w-5 items-center justify-center rounded-md border shrink-0 transition-all ${
                                isExpanded
                                  ? "border-f1-red/50 bg-f1-red/20 text-f1-red shadow-[0_0_8px_rgba(225,6,0,0.25)]"
                                  : "border-white/15 bg-white/[0.06] text-white/70 group-hover:border-white/30 group-hover:text-white"
                              }`}
                              aria-hidden="true"
                            >
                              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                            </span>
                          </div>
                          <TeamLink
                            teamName={item.team_name}
                            className="text-[10px] sm:text-[11px] block truncate font-medium hover:underline decoration-white/30 underline-offset-2 pointer-events-none md:pointer-events-auto"
                            style={{ color: item.team_color || undefined }}
                            title={`Ver perfil de ${item.team_name}`}
                          >
                            {item.team_name}
                          </TeamLink>
                        </div>
                      </div>
                    </td>

                    {/* S1 */}
                    <td className="py-2.5 sm:py-3.5 text-center hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        isBestS1 ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40" : "text-slate-300"
                      }`}>
                        {item.sector_1 || "—"}
                      </span>
                    </td>

                    {/* S2 */}
                    <td className="py-2.5 sm:py-3.5 text-center hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        isBestS2 ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40" : "text-slate-300"
                      }`}>
                        {item.sector_2 || "—"}
                      </span>
                    </td>

                    {/* S3 */}
                    <td className="py-2.5 sm:py-3.5 text-center hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        isBestS3 ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40" : "text-slate-300"
                      }`}>
                        {item.sector_3 || "—"}
                      </span>
                    </td>

                    {/* Real Lap */}
                    <td className="py-2.5 sm:py-3.5 text-right text-white font-bold text-xs sm:text-sm whitespace-nowrap">
                      {item.lap_time || "—"}
                    </td>

                    {/* Delta & Efficiency */}
                    <td className="py-2.5 sm:py-3.5 text-right font-sans whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-mono text-[10px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md ${
                        isPerfect
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                      }`}>
                        {isPerfect ? "0.000s" : `+${item.delta_ideal_lap}`}
                      </span>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="md:hidden bg-[#141420] border-b border-white/10 animate-fadeIn font-sans">
                      <td colSpan={7} className="p-3">
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5 text-xs">
                          <div className="grid grid-cols-3 gap-2 text-center font-mono">
                            <div className={`rounded-lg p-2 border ${isBestS1 ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/5 text-white"}`}>
                              <span className="block text-[9px] text-f1-subtle uppercase font-sans">Melhor S1</span>
                              <span className="text-xs font-black">{item.sector_1 || "—"}</span>
                            </div>
                            <div className={`rounded-lg p-2 border ${isBestS2 ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/5 text-white"}`}>
                              <span className="block text-[9px] text-f1-subtle uppercase font-sans">Melhor S2</span>
                              <span className="text-xs font-black">{item.sector_2 || "—"}</span>
                            </div>
                            <div className={`rounded-lg p-2 border ${isBestS3 ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/5 text-white"}`}>
                              <span className="block text-[9px] text-f1-subtle uppercase font-sans">Melhor S3</span>
                              <span className="text-xs font-black">{item.sector_3 || "—"}</span>
                            </div>
                          </div>

                          <DriverLink
                            driverName={item.driver_full_name}
                            className="flex items-center justify-center gap-1.5 w-full py-2.5 min-h-[44px] rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors border border-white/10 active:scale-95"
                          >
                            <span>Ver Perfil Completo do Piloto</span>
                            <ExternalLink className="h-3.5 w-3.5 text-f1-subtle" />
                          </DriverLink>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
