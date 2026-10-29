"use client";

import React, { useMemo } from "react";
import { TyreStrategy, SessionSummary } from "@/types/f1";
import DriverLink from "@/lib/driverUtils";
import { Disc, ShieldAlert, AlertOctagon, XCircle } from "lucide-react";

interface Props {
  data: TyreStrategy[];
  totalLaps?: number;
  sessionResults?: SessionSummary[];
  className?: string;
}

const compoundColors: { [key: string]: { bg: string; text: string; border: string; label: string } } = {
  SOFT: { bg: "#E10600", text: "#FFFFFF", border: "#FF4D4D", label: "Macio (Soft)" },
  MEDIUM: { bg: "#FFD12E", text: "#000000", border: "#FFE57F", label: "Médio (Medium)" },
  HARD: { bg: "#FFFFFF", text: "#000000", border: "#E0E0E0", label: "Duro (Hard)" },
  INTERMEDIATE: { bg: "#43B02A", text: "#FFFFFF", border: "#68D350", label: "Intermediário" },
  WET: { bg: "#0067AD", text: "#FFFFFF", border: "#3399FF", label: "Chuva (Wet)" },
};

const teamColorPalette: Record<string, string> = {
  "Mercedes": "#00D7B6",
  "Ferrari": "#ED1131",
  "Red Bull Racing": "#4781D7",
  "Red Bull": "#4781D7",
  "McLaren": "#F47600",
  "Aston Martin": "#229971",
  "Alpine": "#0093CC",
  "Williams": "#64C4FF",
  "RB": "#6692FF",
  "Racing Bulls": "#6692FF",
  "AlphaTauri": "#5E8FAA",
  "Kick Sauber": "#52E252",
  "Sauber": "#52E252",
  "Alfa Romeo": "#C92D4B",
  "Haas": "#B6BABD",
  "Haas F1 Team": "#B6BABD"
};

function getTeamColor(teamName: string): string {
  if (!teamName) return "#E10600";
  for (const [key, color] of Object.entries(teamColorPalette)) {
    if (teamName.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  return "#E10600";
}

export default function TyreStrategyChart({ data, totalLaps = 58, sessionResults = [], className = "" }: Props) {
  // Mapa de pilotos e status a partir de sessionResults
  const driverStatusMap = useMemo(() => {
    const map = new Map<string, { status: string; lapsCompleted: number; finishingPos: number; teamName: string }>();
    sessionResults.forEach((sr) => {
      map.set(sr.driver_full_name, {
        status: sr.status || "Finished",
        lapsCompleted: sr.laps_completed != null ? Number(sr.laps_completed) : 0,
        finishingPos: sr.finishing_position != null ? Number(sr.finishing_position) : 99,
        teamName: sr.team_name || ""
      });
    });
    return map;
  }, [sessionResults]);

  // Agrupamento estrito por EQUIPE
  const teamsGrouped = useMemo(() => {
    const map = new Map<string, {
      teamName: string;
      teamColor: string;
      bestFinishingPos: number;
      drivers: {
        driverName: string;
        driverHeadshotUrl?: string | null;
        stints: TyreStrategy[];
        status: string;
        lapsCompleted: number;
        finishingPos: number;
      }[];
    }>();

    // 1. Mapeia os stints disponíveis por piloto
    const driverStintsMap = new Map<string, TyreStrategy[]>();
    data.forEach((stint) => {
      if (!driverStintsMap.has(stint.driver_full_name)) {
        driverStintsMap.set(stint.driver_full_name, []);
      }
      driverStintsMap.get(stint.driver_full_name)!.push(stint);
    });

    // 2. Se temos sessionResults, usamos ele como base para incluir todos os pilotos da prova
    if (sessionResults && sessionResults.length > 0) {
      sessionResults.forEach((sr) => {
        const team = sr.team_name || "Outros";
        if (!map.has(team)) {
          map.set(team, {
            teamName: team,
            teamColor: getTeamColor(team),
            bestFinishingPos: sr.finishing_position || 99,
            drivers: []
          });
        }

        const teamEntry = map.get(team)!;
        if (sr.finishing_position && sr.finishing_position < teamEntry.bestFinishingPos) {
          teamEntry.bestFinishingPos = sr.finishing_position;
        }

        const stints = driverStintsMap.get(sr.driver_full_name) || [];
        stints.sort((a, b) => a.stint - b.stint);

        teamEntry.drivers.push({
          driverName: sr.driver_full_name,
          driverHeadshotUrl: sr.driver_headshot_url,
          stints,
          status: sr.status || "Finished",
          lapsCompleted: sr.laps_completed != null ? Number(sr.laps_completed) : 0,
          finishingPos: sr.finishing_position != null ? Number(sr.finishing_position) : 99
        });
      });
    } else {
      // Fallback usando apenas os dados de data (TyreStrategy[])
      data.forEach((stint) => {
        const team = stint.team_name || "Outros";
        if (!map.has(team)) {
          map.set(team, {
            teamName: team,
            teamColor: getTeamColor(team),
            bestFinishingPos: 99,
            drivers: []
          });
        }

        const teamEntry = map.get(team)!;
        let driverEntry = teamEntry.drivers.find(d => d.driverName === stint.driver_full_name);
        if (!driverEntry) {
          const statusInfo = driverStatusMap.get(stint.driver_full_name);
          driverEntry = {
            driverName: stint.driver_full_name,
            driverHeadshotUrl: stint.driver_headshot_url,
            stints: [],
            status: statusInfo?.status || "Finished",
            lapsCompleted: statusInfo?.lapsCompleted || 0,
            finishingPos: statusInfo?.finishingPos || 99
          };
          teamEntry.drivers.push(driverEntry);
        }
        driverEntry.stints.push(stint);
      });

      map.forEach(team => {
        team.drivers.forEach(d => {
          d.stints.sort((a, b) => a.stint - b.stint);
        });
      });
    }

    // Ordena os pilotos dentro de cada equipe por melhor posição de chegada
    map.forEach(team => {
      team.drivers.sort((a, b) => a.finishingPos - b.finishingPos);
    });

    // Ordena as equipes pela melhor posição do seu melhor piloto na prova
    return Array.from(map.values()).sort((a, b) => a.bestFinishingPos - b.bestFinishingPos);
  }, [data, sessionResults, driverStatusMap]);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-[#0B0B10] p-6 shadow-xl flex flex-col ${className}`}>
      {/* Header & Legenda Padronizada */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
              <Disc className="h-5 w-5 text-amber-400" />
              Estratégia de Pneus & Paradas
            </h3>
            <span className="text-[10px] font-mono font-bold text-f1-subtle bg-white/5 border border-white/10 px-2 py-0.5 rounded">
              {teamsGrouped.length} equipes
            </span>
          </div>
          <p className="text-xs text-f1-subtle font-medium mt-0.5">
            Duração dos stints, paradas e status de corrida ({totalLaps} voltas)
          </p>
        </div>

        {/* Legenda de Compostos Compacta */}
        <div className="flex flex-wrap items-center gap-2 text-xs bg-white/[0.02] border border-white/5 px-2.5 py-1.5 rounded-xl self-start sm:self-auto">
          {Object.entries(compoundColors).map(([key, style]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full border shadow-sm"
                style={{ backgroundColor: style.bg, borderColor: style.border }}
              />
              <span className="text-gray-300 text-[10px] font-semibold">{style.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-1 border-l border-white/10 pl-2">
            <ShieldAlert className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] text-amber-300 font-semibold">SC/VSC</span>
          </div>
          <div className="flex items-center gap-1 ml-1 border-l border-white/10 pl-2">
            <AlertOctagon className="h-3 w-3 text-red-400" />
            <span className="text-[10px] text-red-300 font-semibold">DNF</span>
          </div>
        </div>
      </div>

      {/* Lista de Equipes Agrupadas com Rolagem Vertical Independente */}
      <div className="space-y-4 overflow-y-auto pr-1.5 flex-1">
        {teamsGrouped.map((team) => (
          <div
            key={team.teamName}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-4 hover:border-white/10 transition-colors"
          >
            {/* Cabeçalho da Equipe Visível */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-4 w-1.5 rounded-full shadow-[0_0_8px]"
                  style={{ backgroundColor: team.teamColor, boxShadow: `0 0 8px ${team.teamColor}80` }}
                />
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  {team.teamName}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-f1-subtle bg-white/5 px-2 py-0.5 rounded">
                {team.drivers.length} {team.drivers.length === 1 ? "piloto" : "pilotos"}
              </span>
            </div>

            {/* Pilotos da Equipe */}
            <div className="space-y-3.5 pl-1 sm:pl-2">
              {team.drivers.map(({ driverName, driverHeadshotUrl, stints, status, lapsCompleted, finishingPos }) => {
                const stopCount = Math.max(stints.length - 1, 0);

                // Identifica se o piloto abandonou (DNF / Retired / etc.) ou não largou (DNS)
                const isDidNotStart = status === "Did not start" || (stints.length === 0 && lapsCompleted === 0);

                // Total de voltas cobertas pelos stints e voltas completadas
                const totalStintLaps = stints.reduce((sum, s) => sum + s.stint_laps_completed, 0);
                const actualLapsDone = Math.max(lapsCompleted, totalStintLaps);
                const remainingLaps = Math.max(totalLaps - actualLapsDone, 0);

                // Um piloto é considerado abandono / não completou (DNF) se:
                // 1. Status explícito de abandono (Retired, DNF, acidente, etc.)
                // 2. OU completou menos de 90% da distância da prova (ex: Stroll com 43 voltas de 58)
                // 3. OU ficou mais de 2 voltas atrás sem status "Finished"
                const isRetired =
                  !isDidNotStart &&
                  (status === "Retired" ||
                    status === "DNF" ||
                    status.toLowerCase().includes("collision") ||
                    status.toLowerCase().includes("accident") ||
                    status.toLowerCase().includes("engine") ||
                    actualLapsDone < Math.floor(totalLaps * 0.9) ||
                    (remainingLaps > 2 && status !== "Finished"));

                // Se o piloto tomou bandeirada na pista com 1 ou 2 voltas de atraso
                const isLappedFinish = !isDidNotStart && !isRetired && remainingLaps > 0 && remainingLaps <= 2;

                return (
                  <div key={driverName} className="space-y-1.5">
                    {/* Linha de Identificação do Piloto e Status */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <DriverLink driverName={driverName}>
                          <div
                            className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 shadow-sm transition-transform hover:scale-105"
                            style={{ borderColor: team.teamColor }}
                          >
                            {driverHeadshotUrl ? (
                              <img
                                src={driverHeadshotUrl}
                                alt={driverName}
                                className="h-full w-full object-cover object-top"
                              />
                            ) : (
                              <span className="font-mono text-[9px] font-black text-white/70">
                                {driverName.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </DriverLink>
                        <DriverLink driverName={driverName}>
                          <span className="font-bold text-white hover:text-white hover:underline decoration-white/30 transition-colors">{driverName}</span>
                        </DriverLink>
                        {isRetired && (
                          <span className="rounded bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                            DNF • Volta {actualLapsDone}
                          </span>
                        )}
                        {isDidNotStart && (
                          <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
                            DNS • Não largou
                          </span>
                        )}
                        {isLappedFinish && (
                          <span className="text-[10px] text-f1-subtle font-mono">
                            ({actualLapsDone}v completadas • +{remainingLaps}v)
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-f1-subtle font-mono">
                        {!isDidNotStart && (
                          stopCount === 0 ? "Sem paradas" : `${stopCount} ${stopCount === 1 ? "parada" : "paradas"}`
                        )}
                      </span>
                    </div>

                    {/* Trilho de Progresso dos Stints (Preenche 100% da largura da prova) */}
                    <div className="relative h-7 w-full rounded-lg bg-[#050508] p-0.5 flex gap-1 border border-white/5 overflow-hidden">
                      {isDidNotStart ? (
                        // Piloto Não Largou (DNS)
                        <div
                          className="flex h-full w-full items-center justify-center rounded bg-zinc-900/80 border border-zinc-800 text-[10px] font-bold text-zinc-400 gap-1.5"
                          title={`${driverName}: Não largou nesta corrida`}
                        >
                          <XCircle className="h-3.5 w-3.5 text-zinc-500" />
                          <span>DNS — Não largou</span>
                        </div>
                      ) : (
                        <>
                          {/* Stints executados pelo piloto - escala absoluta baseada em totalLaps */}
                          {stints.map((stint, idx) => {
                            const style = compoundColors[stint.compound?.toUpperCase()] || {
                              bg: "#555",
                              text: "#FFF",
                              border: "#777",
                              label: stint.compound || "Pneu"
                            };

                            // A largura de cada stint reflete sua duração real relativa ao total de voltas da corrida
                            const widthPercent = totalLaps > 0
                              ? (stint.stint_laps_completed / totalLaps) * 100
                              : 0;

                            return (
                              <div
                                key={`${stint.stint}-${idx}`}
                                className="group relative flex h-full items-center justify-between rounded px-2 text-[10px] font-bold transition-all hover:brightness-110 shadow-sm"
                                style={{
                                  width: `${widthPercent}%`,
                                  backgroundColor: style.bg,
                                  color: style.text
                                }}
                                title={`Stint ${stint.stint}: Voltas ${stint.lap_start} a ${stint.lap_end} (${stint.stint_laps_completed}v) • Composto: ${stint.compound} • Ritmo médio: ${stint.stint_avg_lap_time || '—'}`}
                              >
                                <span className="truncate">{stint.stint_laps_completed}v</span>

                                {/* Indicador de Safety Car */}
                                {(stint.pit_under_safety_car || stint.pit_under_vsc || stint.pit_under_red_flag) && (
                                  <span className="rounded bg-black/60 p-0.5 ml-1 shrink-0" title="Parada de box realizada sob Safety Car ou VSC!">
                                    <ShieldAlert className="h-3 w-3 text-amber-300" />
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {/* Bloco DNF preenchendo o restante da barra até o final da corrida */}
                          {isRetired && remainingLaps > 0 && (
                            <div
                              className="group relative flex h-full items-center justify-center rounded border border-red-500/40 bg-gradient-to-r from-red-950/60 to-red-900/40 px-2 text-[10px] font-black text-red-300 shadow-inner"
                              style={{ width: `${(remainingLaps / totalLaps) * 100}%` }}
                              title={`Abandono (DNF) na volta ${actualLapsDone} • Faltaram ${remainingLaps} voltas para o fim da corrida`}
                            >
                              <div className="flex items-center gap-1 truncate">
                                <AlertOctagon className="h-3 w-3 text-red-400 shrink-0" />
                                <span className="truncate">DNF • V{actualLapsDone}</span>
                              </div>
                            </div>
                          )}

                          {/* Bloco de volta de atraso para quem completou a prova levando 1 ou 2 voltas */}
                          {isLappedFinish && remainingLaps > 0 && (
                            <div
                              className="group relative flex h-full items-center justify-center rounded border border-white/10 bg-white/[0.04] px-1 text-[9px] font-mono text-f1-subtle"
                              style={{ width: `${(remainingLaps / totalLaps) * 100}%` }}
                              title={`Bandeirada a ${remainingLaps} volta(s) do líder`}
                            >
                              <span className="truncate">+{remainingLaps}v</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
