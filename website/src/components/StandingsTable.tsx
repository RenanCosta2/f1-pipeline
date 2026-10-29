"use client";

import { useState } from "react";
import { DriverStanding, ConstructorStanding } from "@/types/f1";
import DriverLink from "@/lib/driverUtils";
import TeamLink from "@/lib/teamUtils";
import { Trophy, Award, Medal, Flag, ArrowUpRight } from "lucide-react";

interface Props {
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
}

export default function StandingsTable({ drivers, constructors }: Props) {
  const [activeTab, setActiveTab] = useState<"drivers" | "constructors">("drivers");

  const maxDriverPoints = drivers[0]?.total_points || 1;
  const maxConstructorPoints = constructors[0]?.total_points || 1;

  return (
    <div className="rounded-2xl border border-f1-border bg-[#14141F] p-6 shadow-xl">
      {/* Tab Selector */}
      <div className="flex items-center justify-between border-b border-f1-border/60 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-f1-red" />
          <h2 className="text-xl font-black uppercase text-white tracking-tight">Classificação Mundial</h2>
        </div>

        <div className="flex items-center rounded-lg bg-[#0C0C12] p-1 border border-white/5">
          <button
            onClick={() => setActiveTab("drivers")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "drivers"
                ? "bg-f1-red text-white shadow"
                : "text-f1-subtle hover:text-white"
              }`}
          >
            Pilotos
          </button>
          <button
            onClick={() => setActiveTab("constructors")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "constructors"
                ? "bg-f1-red text-white shadow"
                : "text-f1-subtle hover:text-white"
              }`}
          >
            Construtores
          </button>
        </div>
      </div>

      {/* Drivers Table */}
      {activeTab === "drivers" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-f1-border/40 text-[11px] font-bold text-f1-subtle uppercase tracking-wider">
                <th className="pb-3 w-12 text-center">Pos</th>
                <th className="pb-3">Piloto</th>
                <th className="pb-3 hidden sm:table-cell">Nac</th>
                <th className="pb-3 hidden md:table-cell">Equipe</th>
                <th className="pb-3 text-center">Vitórias</th>
                <th className="pb-3 text-center hidden sm:table-cell">Pódios</th>
                <th className="pb-3 text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-f1-border/20">
              {drivers.map((d, index) => {
                const pointsPercent = Math.round((d.total_points / maxDriverPoints) * 100);
                const isLeader = index === 0;

                return (
                  <tr key={d.driver_full_name} className="group hover:bg-white/[0.02] transition-colors">
                    {/* Position */}
                    <td className="py-4 text-center font-black">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-mono tabular-nums font-black ${isLeader ? "bg-amber-400 text-black shadow-md shadow-amber-400/20" :
                          index === 1 ? "bg-slate-300 text-black" :
                            index === 2 ? "bg-amber-700 text-white" :
                              "text-f1-subtle"
                        }`}>
                        {d.championship_position}
                      </span>
                    </td>

                    {/* Driver Name & Headshot */}
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <DriverLink driverId={d.driver_id} driverName={d.driver_full_name}>
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#1D1D2C] transition-transform hover:scale-105">
                            {d.driver_headshot_url ? (
                              <img
                                src={d.driver_headshot_url}
                                alt={d.driver_full_name}
                                className="h-full w-full object-cover object-top"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-black text-xs text-f1-subtle">
                                {d.driver_full_name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </DriverLink>
                        <div>
                          <DriverLink driverId={d.driver_id} driverName={d.driver_full_name}>
                            <p className="font-bold text-white text-sm hover:text-white hover:underline decoration-white/30 transition-colors">
                              {d.driver_full_name}
                            </p>
                          </DriverLink>
                          <TeamLink teamName={d.team_name}>
                            <p className="text-xs text-f1-subtle md:hidden hover:underline">{d.team_name || "F1 Team"}</p>
                          </TeamLink>
                        </div>
                      </div>
                    </td>

                    {/* Nationality */}
                    <td className="py-4 hidden sm:table-cell text-xs font-mono text-f1-subtle">
                      {d.driver_nationality || "INT"}
                    </td>

                    {/* Team */}
                    <td className="py-4 hidden md:table-cell">
                      <TeamLink teamName={d.team_name}>
                        <span className="text-xs font-semibold text-white/90 hover:text-white hover:underline">
                          {d.team_name || "—"}
                        </span>
                      </TeamLink>
                    </td>

                    {/* Wins */}
                    <td className="py-4 text-center font-mono tabular-nums font-semibold text-white text-xs">
                      {d.total_wins}
                    </td>

                    {/* Podiums */}
                    <td className="py-4 text-center hidden sm:table-cell font-mono tabular-nums text-xs font-semibold text-white/80">
                      {d.total_podiums}
                    </td>

                    {/* Points & Bar */}
                    <td className="py-4 text-right">
                      <span className="font-mono tabular-nums font-black text-white text-base">{d.total_points}</span>
                      <div className="mt-1 w-24 ml-auto h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-f1-red to-amber-500"
                          style={{ width: `${pointsPercent}%` }}
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

      {/* Constructors Table */}
      {activeTab === "constructors" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-f1-border/40 text-[11px] font-bold text-f1-subtle uppercase tracking-wider">
                <th className="pb-3 w-12 text-center">Pos</th>
                <th className="pb-3">Equipe / Construtor</th>
                <th className="pb-3 text-center">Vitórias</th>
                <th className="pb-3 text-center hidden sm:table-cell">Pódios</th>
                <th className="pb-3 text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-f1-border/20">
              {constructors.map((c, index) => {
                const pointsPercent = Math.round((c.total_points / maxConstructorPoints) * 100);
                const isLeader = index === 0;

                return (
                  <tr key={c.team_name} className="group hover:bg-white/[0.02] transition-colors">
                    {/* Position */}
                    <td className="py-4 text-center font-black">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-mono tabular-nums font-black ${isLeader ? "bg-amber-400 text-black shadow-md shadow-amber-400/20" :
                          index === 1 ? "bg-slate-300 text-black" :
                            index === 2 ? "bg-amber-700 text-white" :
                              "text-f1-subtle"
                        }`}>
                        {c.championship_position}
                      </span>
                    </td>

                    {/* Team Name with Color Pill */}
                    <td className="py-4">
                      <TeamLink teamId={(c as any).team_id} teamName={c.team_name} className="inline-flex items-center gap-3 group/link">
                        <div
                          className="h-8 w-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: c.team_color || "#E10600" }}
                        />
                        <span className="font-bold text-white text-base group-hover/link:text-white group-hover/link:underline decoration-white/30 transition-colors inline-flex items-center gap-1.5">
                          {c.team_name}
                          <ArrowUpRight className="h-3.5 w-3.5 text-white/30 group-hover/link:text-white group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                        </span>
                      </TeamLink>
                    </td>

                    {/* Wins */}
                    <td className="py-4 text-center font-mono tabular-nums font-semibold text-white text-xs">
                      {c.total_wins}
                    </td>

                    {/* Podiums */}
                    <td className="py-4 text-center hidden sm:table-cell font-mono tabular-nums text-xs font-semibold text-white/80">
                      {c.total_podiums}
                    </td>

                    {/* Points & Bar */}
                    <td className="py-4 text-right">
                      <span className="font-mono tabular-nums font-black text-white text-base">{c.total_points}</span>
                      <div className="mt-1 w-28 ml-auto h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pointsPercent}%`,
                            backgroundColor: c.team_color || "#E10600"
                          }}
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
    </div>
  );
}
