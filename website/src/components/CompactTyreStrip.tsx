"use client";

import React, { useMemo } from "react";
import { TyreStrategy, SessionSummary } from "@/types/f1";
import DriverLink from "@/lib/driverUtils";
import { CircleDot, Disc } from "lucide-react";

interface CompactTyreStripProps {
  data: TyreStrategy[];
  sessionResults?: SessionSummary[];
  totalLaps?: number;
  maxDrivers?: number;
}

const compoundStyles: Record<string, { bg: string; text: string; border: string; label: string; short: string }> = {
  SOFT: { bg: "#E10600", text: "#FFFFFF", border: "#FF4D4D", label: "Macio", short: "S" },
  MEDIUM: { bg: "#FFD12E", text: "#000000", border: "#FFE57F", label: "Médio", short: "M" },
  HARD: { bg: "#FFFFFF", text: "#000000", border: "#E0E0E0", label: "Duro", short: "H" },
  INTERMEDIATE: { bg: "#43B02A", text: "#FFFFFF", border: "#68D350", label: "Intermediário", short: "I" },
  WET: { bg: "#0067AD", text: "#FFFFFF", border: "#3399FF", label: "Chuva", short: "W" },
};

export default function CompactTyreStrip({
  data,
  sessionResults = [],
  totalLaps = 58,
  maxDrivers = 6
}: CompactTyreStripProps) {
  // Ordena pilotos pela ordem de chegada do resultado da sessão
  const driversList = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Agrupa stints por piloto
    const stintMap = new Map<string, TyreStrategy[]>();
    data.forEach((stint) => {
      const list = stintMap.get(stint.driver_full_name) || [];
      list.push(stint);
      stintMap.set(stint.driver_full_name, list);
    });

    // Ordena stints de cada piloto por stint number ou lap_start
    stintMap.forEach((stints) => {
      stints.sort((a, b) => a.stint - b.stint || a.lap_start - b.lap_start);
    });

    // Monta lista com metadados de sessionResults
    const resultOrder = new Map<string, number>();
    const headshotMap = new Map<string, string | null | undefined>();
    const teamColorMap = new Map<string, string>();

    sessionResults.forEach((sr, idx) => {
      resultOrder.set(sr.driver_full_name, sr.finishing_position ?? idx + 1);
      headshotMap.set(sr.driver_full_name, sr.driver_headshot_url);
      if (sr.team_color) teamColorMap.set(sr.driver_full_name, sr.team_color);
    });

    const drivers = Array.from(stintMap.entries()).map(([driverName, stints]) => {
      const pos = resultOrder.get(driverName) ?? 99;
      const headshot = headshotMap.get(driverName);
      const teamColor = teamColorMap.get(driverName) || "#E10600";
      const teamName = stints[0]?.team_name || "";
      const totalStints = stints.length;
      const pitStops = Math.max(0, totalStints - 1);

      return {
        driverName,
        pos,
        headshot,
        teamColor,
        teamName,
        stints,
        pitStops
      };
    });

    // Ordena pelos que terminaram na frente
    return drivers.sort((a, b) => a.pos - b.pos).slice(0, maxDrivers);
  }, [data, sessionResults, maxDrivers]);

  if (driversList.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-5 text-center text-xs text-f1-subtle">
        Nenhum dado de estratégia de pneus disponível para esta sessão.
      </div>
    );
  }

  const raceLaps = Math.max(totalLaps, 1);

  return (
    <div className="rounded-xl border border-white/10 bg-[#111118] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h3 className="text-sm font-mono font-bold uppercase text-white tracking-wider">
            Estratégia de Pneus (Top {driversList.length})
          </h3>
          <p className="text-[10px] text-f1-subtle font-medium">
            Compostos utilizados e voltas de cada stint
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-white">
            <span className="h-2 w-2 rounded-full bg-white" /> H
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <span className="h-2 w-2 rounded-full bg-yellow-400" /> M
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <span className="h-2 w-2 rounded-full bg-red-500" /> S
          </span>
        </div>
      </div>

      {/* Lista de Faixas dos Pilotos */}
      <div className="space-y-3">
        {driversList.map((d) => {
          return (
            <div key={d.driverName} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-mono font-bold ${
                    d.pos === 1
                      ? "bg-amber-400 text-black"
                      : d.pos === 2
                      ? "bg-slate-300 text-black"
                      : d.pos === 3
                      ? "bg-amber-700 text-white"
                      : "bg-white/10 text-white/70"
                  }`}>
                    {d.pos}
                  </span>
                  <DriverLink driverName={d.driverName} className="max-w-[130px] truncate">
                    <span className="font-bold text-white text-[11px] truncate hover:text-white hover:underline decoration-white/30 transition-colors">
                      {d.driverName}
                    </span>
                  </DriverLink>
                </div>

                <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                  {d.pitStops === 1 ? "1 pit" : `${d.pitStops} pits`}
                </span>
              </div>

              {/* Faixa Horizontal de Stints */}
              <div className="h-5 w-full rounded-md bg-white/5 border border-white/10 flex overflow-hidden p-0.5 gap-0.5">
                {d.stints.map((stint, sIdx) => {
                  const lapsInStint = Math.max(1, stint.stint_laps_completed || (stint.lap_end - stint.lap_start + 1) || 1);
                  const widthPct = Math.max(8, (lapsInStint / raceLaps) * 100);
                  const comp = (stint.compound || "HARD").toUpperCase();
                  const style = compoundStyles[comp] || compoundStyles.HARD;

                  return (
                    <div
                      key={sIdx}
                      className="h-full rounded-sm flex items-center justify-center font-mono font-black text-[9px] transition-all hover:brightness-110 relative group"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: style.bg,
                        color: style.text
                      }}
                      title={`Stint ${stint.stint}: ${style.label} (Voltas ${stint.lap_start}-${stint.lap_end || '?'} | ${lapsInStint}v)`}
                    >
                      <span className="truncate px-0.5">
                        {style.short} <span className="text-[8px] font-normal opacity-90 hidden sm:inline">{lapsInStint}v</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
