"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Trophy, ChevronRight, X, ArrowUpRight } from "lucide-react";
import { DriverStanding, ConstructorStanding } from "@/types/f1";
import { DriverLink } from "@/lib/driverUtils";
import TeamLink from "@/lib/teamUtils";

interface Props {
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
  year: number;
}

const TEAM_COLORS: Record<string, string> = {
  mclaren: "#FF8000",
  ferrari: "#E80020",
  "red bull": "#3671C6",
  mercedes: "#27F4D2",
  "aston martin": "#229971",
  alpine: "#0093CC",
  williams: "#64C4FF",
  "racing bulls": "#6692FF",
  rb: "#6692FF",
  audi: "#F50537",
  sauber: "#01C00E",
  haas: "#B6BABD"
};

export function getTeamColor(teamName?: string | null, explicitColor?: string | null): string {
  if (explicitColor) {
    return explicitColor.startsWith("#") ? explicitColor : `#${explicitColor}`;
  }
  if (!teamName) return "#E10600";
  const lower = teamName.toLowerCase();
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#E10600";
}

export function getTeamAbbr(teamName?: string | null): string {
  if (!teamName) return "F1";
  const lower = teamName.toLowerCase();
  if (lower.includes("mclaren")) return "MCL";
  if (lower.includes("ferrari")) return "FER";
  if (lower.includes("red bull")) return "RBR";
  if (lower.includes("mercedes")) return "MER";
  if (lower.includes("aston")) return "AMR";
  if (lower.includes("alpine")) return "ALP";
  if (lower.includes("williams")) return "WIL";
  if (lower.includes("haas")) return "HAS";
  if (lower.includes("racing bulls") || lower.includes("rb")) return "VCB";
  if (lower.includes("sauber") || lower.includes("audi")) return "AUD";
  return teamName.substring(0, 3).toUpperCase();
}

export default function StandingsWidget({ drivers = [], constructors = [], year }: Props) {
  const [tab, setTab] = useState<"drivers" | "teams">("drivers");
  const [fullModalOpen, setFullModalOpen] = useState(false);

  const top10Drivers = drivers.slice(0, 10);
  const top10Teams = constructors.slice(0, 10);
  const leaderDriver = top10Drivers[0];
  const leaderTeam = top10Teams[0];
  const p2Driver = top10Drivers[1];

  return (
    <>
      <aside className="rounded-2xl border border-white/10 bg-[#12121A] p-5 shadow-2xl space-y-5">
      {/* Header & Tabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Mundial {year}
          </span>
          <span className="font-mono text-[10px] font-bold uppercase text-zinc-500">Top 10</span>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-black/40 p-0.5 text-xs font-mono font-bold uppercase">
          <button
            onClick={() => setTab("drivers")}
            className={`py-1.5 rounded-md transition-colors ${tab === "drivers" ? "bg-white/15 text-white" : "text-f1-subtle hover:text-white"
              }`}
          >
            Pilotos
          </button>
          <button
            onClick={() => setTab("teams")}
            className={`py-1.5 rounded-md transition-colors ${tab === "teams" ? "bg-white/15 text-white" : "text-f1-subtle hover:text-white"
              }`}
          >
            Construtores
          </button>
        </div>
      </div>

      {/* Standings List */}
      {tab === "drivers" ? (
        <div className="space-y-2">
          {/* Subtle P1 Highlight */}
          {leaderDriver && (
            <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-[#14131A] p-3.5">
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: getTeamColor(leaderDriver.team_name, leaderDriver.team_color) }}
              />
              <div className="flex items-center justify-between gap-3 pl-2">
                <DriverLink
                  driverId={leaderDriver.driver_id}
                  driverName={leaderDriver.driver_full_name}
                  className="flex items-center gap-3 group/p1"
                  title={`Ver perfil de ${leaderDriver.driver_full_name}`}
                >
                  {leaderDriver.driver_headshot_url ? (
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-amber-400/40 bg-black/40 transition-transform group-hover/p1:scale-105">
                      <img
                        src={leaderDriver.driver_headshot_url}
                        alt={leaderDriver.driver_full_name}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300 font-black font-mono text-sm border border-amber-400/30">
                      1º
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        Líder
                      </span>
                      <span className="text-[10px] text-f1-subtle font-medium truncate max-w-[110px]">
                        {leaderDriver.team_name || "Mercedes"}
                      </span>
                    </div>
                    <p className="text-sm font-black text-white leading-tight mt-0.5 group-hover/p1:text-amber-300 transition-colors">
                      {leaderDriver.driver_full_name}
                    </p>
                  </div>
                </DriverLink>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right font-mono tabular-nums">
                    <span className="text-base font-black text-amber-400">{leaderDriver.total_points}</span>
                    <span className="text-[9px] text-f1-subtle block uppercase font-sans">PTS</span>
                  </div>
                  <DriverLink
                    driverId={leaderDriver.driver_id}
                    driverName={leaderDriver.driver_full_name}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors group"
                    title={`Ver perfil completo de ${leaderDriver.driver_full_name}`}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </DriverLink>
                </div>
              </div>

              {/* Advantage over P2 */}
              {p2Driver && (
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-f1-subtle font-medium pl-2">
                  <span>Vantagem p/ P2 ({p2Driver.driver_full_name.split(" ")[1] || "P2"})</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-400">
                    +{leaderDriver.total_points - p2Driver.total_points} pts
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Compact Rows P2 to P10 */}
          <div className="space-y-1 divide-y divide-white/5">
            {top10Drivers.slice(1).map((d) => {
              const gapToLeader = (leaderDriver?.total_points || 0) - d.total_points;
              const color = getTeamColor(d.team_name, d.team_color);

              return (
                <div
                  key={d.driver_full_name}
                  className="flex items-center justify-between py-2 px-1.5 rounded-lg hover:bg-white/[0.03] transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-5 text-center font-mono tabular-nums font-bold text-white/50 text-[11px] shrink-0">
                      {d.championship_position}
                    </span>
                    <DriverLink
                      driverId={d.driver_id}
                      driverName={d.driver_full_name}
                      className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 shadow-sm transition-transform hover:scale-105"
                      style={{ borderColor: color }}
                      title={`Ver perfil de ${d.driver_full_name}`}
                    >
                      {d.driver_headshot_url ? (
                        <img
                          src={d.driver_headshot_url}
                          alt={d.driver_full_name}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <span className="font-mono text-[9px] font-black text-white/70">
                          {d.driver_full_name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </DriverLink>
                    <div className="truncate min-w-0">
                      <DriverLink
                        driverId={d.driver_id}
                        driverName={d.driver_full_name}
                        className="font-bold text-white truncate text-xs hover:text-white hover:underline decoration-white/30 transition-colors block"
                        title={`Ver perfil de ${d.driver_full_name}`}
                      >
                        {d.driver_full_name}
                      </DriverLink>
                      <TeamLink
                        teamName={d.team_name}
                        className="text-[10px] text-f1-subtle truncate block hover:text-white hover:underline transition-colors"
                        title={`Ver perfil de ${d.team_name}`}
                      >
                        {d.team_name}
                      </TeamLink>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono tabular-nums pl-2">
                    <p className="font-bold text-white text-xs">
                      {d.total_points} <small className="text-[9px] text-f1-subtle font-sans">PTS</small>
                    </p>
                    <p className="text-[10px] text-white/40">-{gapToLeader}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Constructors Top 10 */
        <div className="space-y-2">
          {leaderTeam && (
            <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-[#14131A] p-3.5">
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: getTeamColor(leaderTeam.team_name, leaderTeam.team_color) }}
              />
              <div className="flex items-center justify-between gap-3 pl-2">
                <TeamLink
                  teamName={leaderTeam.team_name}
                  className="flex items-center gap-3 group/lead min-w-0"
                  title={`Ver perfil de ${leaderTeam.team_name}`}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-lg text-white transition-transform group-hover/lead:scale-105"
                    style={{ backgroundColor: `${getTeamColor(leaderTeam.team_name, leaderTeam.team_color)}35` }}
                  >
                    {getTeamAbbr(leaderTeam.team_name)[0]}
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Líder de Construtores
                    </span>
                    <p className="text-base font-black text-white leading-tight mt-0.5 truncate group-hover/lead:text-amber-300 transition-colors">
                      {leaderTeam.team_name}
                    </p>
                  </div>
                </TeamLink>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right font-mono tabular-nums">
                    <span className="text-base font-black text-amber-400">{leaderTeam.total_points}</span>
                    <span className="text-[9px] text-f1-subtle block uppercase font-sans">PTS</span>
                  </div>
                  <TeamLink
                    teamName={leaderTeam.team_name}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors group"
                    title={`Ver perfil completo de ${leaderTeam.team_name}`}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </TeamLink>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1 divide-y divide-white/5">
            {top10Teams.slice(1).map((t) => {
              const gapToLeader = (leaderTeam?.total_points || 0) - t.total_points;
              const color = getTeamColor(t.team_name, t.team_color);

              return (
                <div
                  key={t.team_name}
                  className="flex items-center justify-between py-2 px-1.5 rounded-lg hover:bg-white/[0.03] transition-colors text-xs"
                >
                  <TeamLink
                    teamName={t.team_name}
                    className="flex items-center gap-2.5 min-w-0 group/trow flex-1"
                    title={`Ver perfil de ${t.team_name}`}
                  >
                    <span className="w-5 text-center font-mono tabular-nums font-bold text-white/50 text-[11px]">
                      {t.championship_position}
                    </span>
                    <span className="h-4 w-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div className="truncate">
                      <p className="font-bold text-white truncate text-xs group-hover/trow:text-white group-hover/trow:underline decoration-white/30 transition-colors">{t.team_name}</p>
                    </div>
                  </TeamLink>

                  <div className="text-right shrink-0 font-mono tabular-nums pl-2">
                    <p className="font-bold text-white text-xs">
                      {t.total_points} <small className="text-[9px] text-f1-subtle font-sans">PTS</small>
                    </p>
                    <p className="text-[10px] text-white/40">-{gapToLeader}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Button: Open Full Modal */}
      <div className="pt-2 border-t border-white/5">
        <button
          onClick={() => setFullModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:border-white/20 hover:bg-white/10 transition-colors"
        >
          <span>Ver classificação completa</span>
          <ChevronRight className="h-3.5 w-3.5 text-f1-red" />
        </button>
      </div>
      </aside>

      {/* Modal: Full Standings (rendered via Portal on document.body to avoid space-y-* margin & stacking issues) */}
      {fullModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onClick={() => setFullModalOpen(false)}
            className="fixed inset-0 z-[9999] !m-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#12121A] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase text-white">Classificação Geral {year}</h3>
                  <p className="text-xs text-f1-subtle">Tabela completa de pontuação do Campeonato Mundial</p>
                </div>
                <button
                  onClick={() => setFullModalOpen(false)}
                  className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex gap-2 border-b border-white/10 px-6 pt-3">
                <button
                  onClick={() => setTab("drivers")}
                  className={`pb-2 px-3 text-xs font-bold uppercase transition-colors border-b-2 ${tab === "drivers" ? "border-f1-red text-white" : "border-transparent text-white/50"
                    }`}
                >
                  Pilotos ({drivers.length})
                </button>
                <button
                  onClick={() => setTab("teams")}
                  className={`pb-2 px-3 text-xs font-bold uppercase transition-colors border-b-2 ${tab === "teams" ? "border-f1-red text-white" : "border-transparent text-white/50"
                    }`}
                >
                  Construtores ({constructors.length})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {tab === "drivers"
                  ? drivers.map((d) => (
                    <div
                      key={d.driver_full_name}
                      className="grid grid-cols-[36px_1fr_auto] items-center gap-3 border-b border-white/5 py-2.5 px-2 hover:bg-white/[0.02]"
                    >
                      <span className="font-mono tabular-nums text-sm text-white/50 font-bold">{d.championship_position}</span>
                      <DriverLink
                        driverId={d.driver_id}
                        driverName={d.driver_full_name}
                        className="flex items-center gap-3 min-w-0 group/dmodal"
                        title={`Ver perfil de ${d.driver_full_name}`}
                      >
                        <div
                          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 shadow-sm transition-transform group-hover/dmodal:scale-105"
                          style={{ borderColor: getTeamColor(d.team_name, d.team_color) }}
                        >
                          {d.driver_headshot_url ? (
                            <img
                              src={d.driver_headshot_url}
                              alt={d.driver_full_name}
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <span className="font-mono text-[10px] font-black text-white/70">
                              {d.driver_full_name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-white truncate group-hover/dmodal:text-white group-hover/dmodal:underline decoration-white/30 transition-colors">{d.driver_full_name}</p>
                          <p className="text-[11px] text-f1-subtle truncate">
                            {d.team_name} · {d.driver_nationality || "FIA"}
                          </p>
                        </div>
                      </DriverLink>
                      <div className="text-right font-mono tabular-nums">
                        <span className="text-sm font-bold text-white">{d.total_points}</span>
                        <span className="text-[10px] text-f1-subtle ml-1 font-sans">PTS</span>
                      </div>
                    </div>
                  ))
                  : constructors.map((c) => (
                    <div
                      key={c.team_name}
                      className="grid grid-cols-[36px_1fr_auto] items-center gap-3 border-b border-white/5 py-2.5 px-2 hover:bg-white/[0.02]"
                    >
                      <span className="font-mono tabular-nums text-sm text-white/50 font-bold">{c.championship_position}</span>
                      <TeamLink
                        teamName={c.team_name}
                        className="flex items-center gap-3 min-w-0 group/cmodal flex-1"
                        title={`Ver perfil de ${c.team_name}`}
                      >
                        <span
                          className="h-6 w-1 rounded-full shrink-0"
                          style={{ backgroundColor: getTeamColor(c.team_name, c.team_color) }}
                        />
                        <p className="text-sm font-bold text-white truncate group-hover/cmodal:text-white group-hover/cmodal:underline decoration-white/30 transition-colors">{c.team_name}</p>
                      </TeamLink>
                      <div className="text-right font-mono tabular-nums">
                        <span className="text-sm font-bold text-white">{c.total_points}</span>
                        <span className="text-[10px] text-f1-subtle ml-1 font-sans">PTS</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
