"use client";

import { IdealLap } from "@/types/f1";
import { Timer, CheckCircle, Sparkles, AlertCircle, Award, ArrowUpRight } from "lucide-react";
import { DriverLink } from "@/lib/driverUtils";
import TeamLink from "@/lib/teamUtils";

interface Props {
  data: IdealLap[];
  className?: string;
}

export default function IdealLapCard({ data, className }: Props) {
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
    <div className={`rounded-2xl border border-white/10 bg-[#0B0B10] p-6 shadow-xl ${className || ""}`}>
      {/* Header */}
      <div className="border-b border-white/10 pb-4 mb-6">
        <h3 className="text-lg font-mono font-bold uppercase text-white tracking-wider flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          Volta Ideal Teórica vs Volta Real (Ultimate Lap)
        </h3>
        <p className="text-xs text-f1-subtle font-medium mt-1">
          A soma dos três melhores setores individuais (S1 + S2 + S3) aferidos na sessão comparados com o tempo real obtido na volta mais rápida.
        </p>
      </div>

      {/* Global Purple Sectors Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-xl border border-purple-500/30 bg-[#13111E] flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                Melhor Setor 1
              </span>
            </div>
            <span className="text-xl font-black font-mono text-purple-300 block">
              {bestS1.time !== "9:99:999" ? bestS1.time : "—"}
            </span>
            {bestS1.driver ? (
              <DriverLink driverName={bestS1.driver} className="block group">
                <span className="text-xs text-white group-hover:text-purple-300 transition-colors font-medium inline-flex items-center gap-1 mt-0.5 max-w-full">
                  <span className="truncate">{bestS1.driver}</span>
                  <ArrowUpRight className="h-3 w-3 shrink-0 text-purple-400/60 group-hover:text-purple-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </DriverLink>
            ) : (
              <span className="text-xs text-white font-medium block truncate mt-0.5">—</span>
            )}
            <TeamLink
              teamName={bestS1.team}
              className="text-[10px] block truncate font-mono text-zinc-500 hover:text-purple-300 transition-colors"
            >
              {bestS1.team || "—"}
            </TeamLink>
          </div>

          {bestS1.driver ? (
            <DriverLink
              driverName={bestS1.driver}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 transition-transform hover:scale-105"
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
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5"
              style={{ borderColor: "#A855F7" }}
            >
              <span className="font-mono text-[10px] font-bold text-purple-300">S1</span>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl border border-purple-500/30 bg-[#13111E] flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                Melhor Setor 2
              </span>
            </div>
            <span className="text-xl font-black font-mono text-purple-300 block">
              {bestS2.time !== "9:99:999" ? bestS2.time : "—"}
            </span>
            {bestS2.driver ? (
              <DriverLink driverName={bestS2.driver} className="block group">
                <span className="text-xs text-white group-hover:text-purple-300 transition-colors font-medium inline-flex items-center gap-1 mt-0.5 max-w-full">
                  <span className="truncate">{bestS2.driver}</span>
                  <ArrowUpRight className="h-3 w-3 shrink-0 text-purple-400/60 group-hover:text-purple-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </DriverLink>
            ) : (
              <span className="text-xs text-white font-medium block truncate mt-0.5">—</span>
            )}
            <TeamLink
              teamName={bestS2.team}
              className="text-[10px] block truncate font-mono text-zinc-500 hover:text-purple-300 transition-colors"
            >
              {bestS2.team || "—"}
            </TeamLink>
          </div>

          {bestS2.driver ? (
            <DriverLink
              driverName={bestS2.driver}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 transition-transform hover:scale-105"
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
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5"
              style={{ borderColor: "#A855F7" }}
            >
              <span className="font-mono text-[10px] font-bold text-purple-300">S2</span>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl border border-purple-500/30 bg-[#13111E] flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                Melhor Setor 3
              </span>
            </div>
            <span className="text-xl font-black font-mono text-purple-300 block">
              {bestS3.time !== "9:99:999" ? bestS3.time : "—"}
            </span>
            {bestS3.driver ? (
              <DriverLink driverName={bestS3.driver} className="block group">
                <span className="text-xs text-white group-hover:text-purple-300 transition-colors font-medium inline-flex items-center gap-1 mt-0.5 max-w-full">
                  <span className="truncate">{bestS3.driver}</span>
                  <ArrowUpRight className="h-3 w-3 shrink-0 text-purple-400/60 group-hover:text-purple-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </DriverLink>
            ) : (
              <span className="text-xs text-white font-medium block truncate mt-0.5">—</span>
            )}
            <TeamLink
              teamName={bestS3.team}
              className="text-[10px] block truncate font-mono text-zinc-500 hover:text-purple-300 transition-colors"
            >
              {bestS3.team || "—"}
            </TeamLink>
          </div>

          {bestS3.driver ? (
            <DriverLink
              driverName={bestS3.driver}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 transition-transform hover:scale-105"
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
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5"
              style={{ borderColor: "#A855F7" }}
            >
              <span className="font-mono text-[10px] font-bold text-purple-300">S3</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-bold text-f1-subtle uppercase tracking-wider">
              <th className="pb-3 w-10 text-center">Pos</th>
              <th className="pb-3">Piloto & Equipe</th>
              <th className="pb-3 text-center">Melhor S1</th>
              <th className="pb-3 text-center">Melhor S2</th>
              <th className="pb-3 text-center">Melhor S3</th>
              <th className="pb-3 text-right">Volta Real</th>
              <th className="pb-3 text-right">Delta Teórico (Eficiência)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-xs">
            {sortedLaps.map((item, idx) => {
              const isPerfect = item.delta_ideal_lap === "0:00.000" || item.delta_ideal_lap === "0:00:000";
              const isBestS1 = item.sector_1 === bestS1.time;
              const isBestS2 = item.sector_2 === bestS2.time;
              const isBestS3 = item.sector_3 === bestS3.time;

              return (
                <tr key={item.driver_full_name} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3.5 text-center font-bold font-sans">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-black ${
                      idx === 0 ? "bg-amber-400 text-black font-bold" : "text-f1-subtle"
                    }`}>
                      {idx + 1}
                    </span>
                  </td>

                  <td className="py-3.5 font-sans">
                    <div className="flex items-center gap-2.5">
                      <DriverLink
                        driverName={item.driver_full_name}
                        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 transition-transform hover:scale-105"
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
                      <div className="min-w-0">
                        <DriverLink
                          driverName={item.driver_full_name}
                          className="font-bold text-white text-sm block truncate hover:text-f1-red transition-colors"
                          title={`Ver perfil de ${item.driver_full_name}`}
                        >
                          {item.driver_full_name}
                        </DriverLink>
                        <TeamLink
                          teamName={item.team_name}
                          className="text-[11px] block truncate font-medium hover:underline decoration-white/30 underline-offset-2"
                          style={{ color: item.team_color || undefined }}
                          title={`Ver perfil de ${item.team_name}`}
                        >
                          {item.team_name}
                        </TeamLink>
                      </div>
                    </div>
                  </td>

                  {/* S1 */}
                  <td className="py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      isBestS1 ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40" : "text-slate-300"
                    }`}>
                      {item.sector_1 || "—"}
                    </span>
                  </td>

                  {/* S2 */}
                  <td className="py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      isBestS2 ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40" : "text-slate-300"
                    }`}>
                      {item.sector_2 || "—"}
                    </span>
                  </td>

                  {/* S3 */}
                  <td className="py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      isBestS3 ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40" : "text-slate-300"
                    }`}>
                      {item.sector_3 || "—"}
                    </span>
                  </td>

                  {/* Real Lap */}
                  <td className="py-3.5 text-right text-white font-bold text-sm">
                    {item.lap_time || "—"}
                  </td>

                  {/* Delta & Efficiency */}
                  <td className="py-3.5 text-right font-sans">
                    <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-md ${
                      isPerfect
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                    }`}>
                      {isPerfect ? "0.000s (100% Perfeita)" : `+${item.delta_ideal_lap}`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
