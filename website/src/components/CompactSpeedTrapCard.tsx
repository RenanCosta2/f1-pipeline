"use client";

import React, { useMemo } from "react";
import { MaxSpeed } from "@/types/f1";
import DriverLink from "@/lib/driverUtils";
import { TeamLink } from "@/lib/teamUtils";
import { Zap, Flame, Award, ChevronRight, ArrowUpRight } from "lucide-react";

interface CompactSpeedTrapCardProps {
  data: MaxSpeed[];
  onViewDetails?: () => void;
}

export default function CompactSpeedTrapCard({ data, onViewDetails }: CompactSpeedTrapCardProps) {
  const { topDriver, topList, maxSpeedVal } = useMemo(() => {
    if (!data || data.length === 0) {
      return { topDriver: null, topList: [], maxSpeedVal: 350 };
    }

    // Deduplicate by driver keeping the highest max_speed_trap
    const map = new Map<string, MaxSpeed>();
    data.forEach((item) => {
      const current = map.get(item.driver_full_name);
      if (!current || (item.max_speed_trap || 0) > (current.max_speed_trap || 0)) {
        map.set(item.driver_full_name, item);
      }
    });

    const sorted = Array.from(map.values()).sort(
      (a, b) => (b.max_speed_trap || 0) - (a.max_speed_trap || 0)
    );

    const top = sorted[0] || null;
    const topVal = top?.max_speed_trap || 350;

    return {
      topDriver: top,
      topList: sorted.slice(0, 5),
      maxSpeedVal: topVal
    };
  }, [data]);

  if (!topDriver) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-5 text-center text-xs text-f1-subtle">
        Nenhum dado de velocidade máxima disponível para esta sessão.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#111118] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h3 className="text-sm font-mono font-bold uppercase text-white tracking-wider">
            Speed Trap Oficial
          </h3>
          <p className="text-[10px] text-f1-subtle font-medium">
            Maior velocidade registrada na sessão
          </p>
        </div>

        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
          FIA Telemetria
        </span>
      </div>

      {/* Destaque do #1 Maior Speed Trap */}
      <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-[#14120C] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                #1 Líder de Velocidade
              </span>
              <DriverLink
                driverName={topDriver.driver_full_name}
                className="inline-flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-300 hover:bg-amber-500/20 hover:text-white transition-all group"
                title={`Ver perfil de ${topDriver.driver_full_name}`}
              >
                <span>Perfil</span>
                <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </DriverLink>
            </div>
            <DriverLink driverName={topDriver.driver_full_name}>
              <h4 className="text-base font-black text-white mt-0.5 hover:text-amber-300 transition-colors">
                {topDriver.driver_full_name}
              </h4>
            </DriverLink>
            <TeamLink
              teamName={topDriver.team_name}
              className="text-xs text-f1-subtle font-medium hover:text-white hover:underline decoration-white/30 underline-offset-2 block transition-colors"
              title={`Ver perfil de ${topDriver.team_name}`}
            >
              {topDriver.team_name}
            </TeamLink>
          </div>

          <div className="text-right">
            <div className="font-mono text-2xl font-black text-white tracking-tight">
              {topDriver.max_speed_trap ? Number(topDriver.max_speed_trap).toFixed(1) : "—"}
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
              km/h
            </span>
          </div>
        </div>

        {/* Setores Intermediários do Líder */}
        {(topDriver.max_speed_i1 || topDriver.max_speed_i2 || topDriver.max_speed_fl) && (
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center font-mono text-[10px]">
            <div className="rounded bg-black/40 px-1.5 py-1">
              <span className="text-f1-subtle block text-[9px] uppercase">Setor 1</span>
              <span className="text-white font-bold">{topDriver.max_speed_i1 ? `${topDriver.max_speed_i1}` : "—"}</span>
            </div>
            <div className="rounded bg-black/40 px-1.5 py-1">
              <span className="text-f1-subtle block text-[9px] uppercase">Setor 2</span>
              <span className="text-white font-bold">{topDriver.max_speed_i2 ? `${topDriver.max_speed_i2}` : "—"}</span>
            </div>
            <div className="rounded bg-black/40 px-1.5 py-1">
              <span className="text-f1-subtle block text-[9px] uppercase">Chegada FL</span>
              <span className="text-white font-bold">{topDriver.max_speed_fl ? `${topDriver.max_speed_fl}` : "—"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mini-Ranking Top 5 */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-f1-subtle block">
          Top 5 Picos de Velocidade
        </span>

        {topList.map((item, idx) => {
          const speed = Number(item.max_speed_trap || 0);
          const percent = Math.min(Math.round((speed / maxSpeedVal) * 100), 100);
          const delta = speed - maxSpeedVal;

          return (
            <div key={item.driver_full_name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-mono font-bold ${
                    idx === 0 ? "bg-amber-400 text-black" : "bg-white/10 text-white/70"
                  }`}>
                    {idx + 1}
                  </span>
                  <DriverLink driverName={item.driver_full_name} className="max-w-[140px] truncate">
                    <span className="font-bold text-white text-[11px] hover:text-white hover:underline decoration-white/30 transition-colors truncate">
                      {item.driver_full_name}
                    </span>
                  </DriverLink>
                  <span className="text-[10px] text-f1-subtle truncate hidden sm:inline">
                    (
                    <TeamLink
                      teamName={item.team_name}
                      className="hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                      title={`Ver perfil de ${item.team_name}`}
                    >
                      {item.team_name}
                    </TeamLink>
                    )
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                  <span className="font-black text-white">
                    {speed.toFixed(1)} km/h
                  </span>
                  {idx > 0 && (
                    <span className="text-[10px] text-f1-subtle">
                      {delta.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-f1-red transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
