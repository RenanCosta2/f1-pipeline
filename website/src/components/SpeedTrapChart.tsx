"use client";

import { useState } from "react";
import { MaxSpeed } from "@/types/f1";
import DriverLink from "@/lib/driverUtils";
import { Zap, Award, ArrowUpRight, ShieldCheck, Flame } from "lucide-react";

interface Props {
  data: MaxSpeed[];
}

export default function SpeedTrapChart({ data }: Props) {
  const [viewMode, setViewMode] = useState<"drivers" | "teams">("drivers");

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-f1-border bg-[#14141F] p-8 text-center text-f1-subtle">
        Nenhum registro de telemetria de velocidade para esta sessão.
      </div>
    );
  }

  // Deduplicate drivers (in case multiple records exist) and sort by max_speed_trap
  const uniqueDriversMap = new Map<string, MaxSpeed>();
  data.forEach((item) => {
    if (!uniqueDriversMap.has(item.driver_full_name) || (item.max_speed_trap || 0) > (uniqueDriversMap.get(item.driver_full_name)?.max_speed_trap || 0)) {
      uniqueDriversMap.set(item.driver_full_name, item);
    }
  });

  const sortedDrivers = Array.from(uniqueDriversMap.values()).sort(
    (a, b) => (b.max_speed_trap || 0) - (a.max_speed_trap || 0)
  );

  const topSpeed = sortedDrivers[0]?.max_speed_trap || 350;

  // Aggregate by Team
  const teamMap = new Map<string, { team: string; maxTrap: number; sumTrap: number; count: number; bestDriver: string }>();
  sortedDrivers.forEach((d) => {
    const trap = d.max_speed_trap || 0;
    if (!teamMap.has(d.team_name)) {
      teamMap.set(d.team_name, { team: d.team_name, maxTrap: trap, sumTrap: trap, count: 1, bestDriver: d.driver_full_name });
    } else {
      const entry = teamMap.get(d.team_name)!;
      entry.sumTrap += trap;
      entry.count += 1;
      if (trap > entry.maxTrap) {
        entry.maxTrap = trap;
        entry.bestDriver = d.driver_full_name;
      }
    }
  });

  const sortedTeams = Array.from(teamMap.values()).sort((a, b) => b.maxTrap - a.maxTrap);

  return (
    <div className="rounded-2xl border border-f1-border bg-[#14141F] p-6 shadow-xl">
      {/* Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-f1-border/50 pb-5 mb-6 gap-4">
        <div>
          <h3 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            Radar de Velocidades Máximas (Top Speeds)
          </h3>
          <p className="text-xs text-f1-subtle font-medium mt-0.5">
            Velocidades aferidas no Speed Trap oficial da FIA, Linha de Chegada (FL) e setores intermediários
          </p>
        </div>

        <div className="flex items-center rounded-lg bg-[#0C0C12] p-1 border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("drivers")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === "drivers"
                ? "bg-f1-red text-white shadow"
                : "text-f1-subtle hover:text-white"
            }`}
          >
            Pilotos ({sortedDrivers.length})
          </button>
          <button
            onClick={() => setViewMode("teams")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === "teams"
                ? "bg-f1-red text-white shadow"
                : "text-f1-subtle hover:text-white"
            }`}
          >
            Por Equipe ({sortedTeams.length})
          </button>
        </div>
      </div>

      {/* Podium Cards for Top 3 Fastest Cars */}
      {sortedDrivers.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {sortedDrivers.slice(0, 3).map((driver, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={driver.driver_full_name}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  isFirst
                    ? "bg-gradient-to-br from-amber-500/15 via-[#1D1D2C] to-[#14141F] border-amber-500/40 shadow-lg shadow-amber-500/5"
                    : "bg-[#181826] border-white/5"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                      isFirst ? "bg-amber-400 text-black font-black" : idx === 1 ? "bg-slate-300 text-black" : "bg-amber-700 text-white"
                    }`}>
                      {idx + 1}
                    </span>
                    <DriverLink driverName={driver.driver_full_name}>
                      <span className="text-xs font-bold text-white hover:text-amber-300 transition-colors">
                        {driver.driver_full_name}
                      </span>
                    </DriverLink>
                  </div>
                  <p className="text-[11px] text-f1-subtle font-medium mt-1">{driver.team_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-white block">
                    {driver.max_speed_trap ? Number(driver.max_speed_trap).toFixed(1) : "—"}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">km/h Speed Trap</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drivers View */}
      {viewMode === "drivers" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-f1-border/40 text-[11px] font-bold text-f1-subtle uppercase tracking-wider">
                <th className="pb-3 w-10 text-center">Pos</th>
                <th className="pb-3">Piloto & Equipe</th>
                <th className="pb-3 text-center">Inter 1 (I1)</th>
                <th className="pb-3 text-center">Inter 2 (I2)</th>
                <th className="pb-3 text-center">Linha Chegada (FL)</th>
                <th className="pb-3 text-right">Speed Trap Oficial</th>
                <th className="pb-3 w-32 hidden sm:table-cell">Radar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-f1-border/20 text-xs">
              {sortedDrivers.map((item, idx) => {
                const speed = Number(item.max_speed_trap || 0);
                const percent = Math.min(Math.round((speed / (topSpeed + 5)) * 100), 100);
                const deltaToLeader = speed - topSpeed;

                return (
                  <tr key={item.driver_full_name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-center font-black">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-mono ${
                        idx === 0 ? "bg-amber-400 text-black font-bold" : "text-f1-subtle"
                      }`}>
                        {idx + 1}
                      </span>
                    </td>

                    <td className="py-3">
                      <DriverLink driverName={item.driver_full_name}>
                        <span className="font-bold text-white text-sm block hover:text-f1-red transition-colors">
                          {item.driver_full_name}
                        </span>
                      </DriverLink>
                      <span className="text-[11px] text-f1-subtle">{item.team_name}</span>
                    </td>

                    <td className="py-3 text-center font-mono text-f1-subtle">
                      {item.max_speed_i1 ? `${Number(item.max_speed_i1).toFixed(1)}` : "—"}
                    </td>

                    <td className="py-3 text-center font-mono text-f1-subtle">
                      {item.max_speed_i2 ? `${Number(item.max_speed_i2).toFixed(1)}` : "—"}
                    </td>

                    <td className="py-3 text-center font-mono text-slate-300 font-semibold">
                      {item.max_speed_fl ? `${Number(item.max_speed_fl).toFixed(1)}` : "—"}
                    </td>

                    <td className="py-3 text-right font-mono">
                      <span className="font-black text-amber-400 text-sm block">
                        {speed > 0 ? `${speed.toFixed(1)} km/h` : "—"}
                      </span>
                      {idx > 0 && speed > 0 && (
                        <span className="text-[10px] text-f1-subtle">
                          {deltaToLeader.toFixed(1)} km/h
                        </span>
                      )}
                    </td>

                    <td className="py-3 hidden sm:table-cell">
                      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-f1-red"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Teams View */}
      {viewMode === "teams" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-f1-border/40 text-[11px] font-bold text-f1-subtle uppercase tracking-wider">
                <th className="pb-3 w-10 text-center">Pos</th>
                <th className="pb-3">Equipe</th>
                <th className="pb-3">Piloto Mais Rápido</th>
                <th className="pb-3 text-center">Média de Top Speed</th>
                <th className="pb-3 text-right">Velocidade Máxima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-f1-border/20 text-xs">
              {sortedTeams.map((t, idx) => {
                const avgSpeed = t.count > 0 ? t.sumTrap / t.count : t.maxTrap;
                return (
                  <tr key={t.team} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 text-center font-mono font-bold text-f1-subtle">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 font-bold text-white text-sm">
                      {t.team}
                    </td>
                    <td className="py-3.5 text-f1-subtle font-medium">
                      <DriverLink driverName={t.bestDriver}>
                        <span className="hover:text-white transition-colors">{t.bestDriver}</span>
                      </DriverLink>
                    </td>
                    <td className="py-3.5 text-center font-mono text-slate-300 font-semibold">
                      {avgSpeed.toFixed(1)} km/h
                    </td>
                    <td className="py-3.5 text-right font-mono font-black text-amber-400 text-sm">
                      {t.maxTrap.toFixed(1)} km/h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
