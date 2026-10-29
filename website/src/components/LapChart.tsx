"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Brush
} from "recharts";
import { LapByLap, SessionSummary } from "@/types/f1";
import DriverLink from "@/lib/driverUtils";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
  Info,
  Maximize2,
  Filter,
  Check,
  RotateCcw
} from "lucide-react";

interface Props {
  data: LapByLap[];
  sessionResults?: SessionSummary[];
}

interface DriverMeta {
  abbr: string;
  fullName: string;
  teamName: string;
  teamColor: string;
  headshotUrl?: string | null;
  finishPos: number;
  startPos: number;
  bestPos: number;
  worstPos: number;
  isDashed: boolean;
}

export default function LapChart({ data, sessionResults = [] }: Props) {
  // Multiple driver selection state (controlled exclusively via click)
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [brushRange, setBrushRange] = useState<{ startIndex?: number; endIndex?: number }>({});

  const hasSelection = selectedDrivers.length > 0;

  // Process data: extract laps, positions, driver metadata, teammate line patterns
  const { chartData, driversList, totalLaps, maxPosition } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], driversList: [], totalLaps: 0, maxPosition: 20 };
    }

    // Map of session results for headshot lookup and final positions
    const sessionMap = new Map<string, SessionSummary>();
    sessionResults.forEach((sr) => {
      if (sr.driver_abbreviation) sessionMap.set(sr.driver_abbreviation.toUpperCase(), sr);
      if (sr.driver_full_name) sessionMap.set(sr.driver_full_name.toLowerCase(), sr);
    });

    // 1. Pivot data by lap_number
    const lapMap: { [lap: number]: any } = {};
    const driverLapsMap: { [abbr: string]: { [lap: number]: { pos: number; compound?: string | null; tyreLife?: number | null } } } = {};
    const driverInfoMap: { [abbr: string]: { fullName: string; teamName: string; teamColor: string } } = {};

    let maxLap = 0;
    let maxPos = 20;

    data.forEach((row) => {
      const lap = Number(row.lap_number);
      const pos = row.position != null ? Number(row.position) : null;
      const abbr = (row.driver_abbreviation || row.driver_full_name || "UNK").toUpperCase();

      if (lap > maxLap) maxLap = lap;
      if (pos && pos > maxPos) maxPos = pos;

      if (!lapMap[lap]) {
        lapMap[lap] = { lap, _details: {} };
      }

      if (pos !== null) {
        lapMap[lap][abbr] = pos;
        lapMap[lap]._details[abbr] = {
          position: pos,
          compound: row.compound,
          tyreLife: row.tyre_life
        };

        if (!driverLapsMap[abbr]) {
          driverLapsMap[abbr] = {};
        }
        driverLapsMap[abbr][lap] = {
          pos,
          compound: row.compound,
          tyreLife: row.tyre_life
        };
      }

      if (!driverInfoMap[abbr]) {
        const teamColor = row.team_color
          ? (row.team_color.startsWith("#") ? row.team_color : `#${row.team_color}`)
          : "#FFFFFF";
        driverInfoMap[abbr] = {
          fullName: row.driver_full_name || abbr,
          teamName: row.team_name || "Equipe",
          teamColor
        };
      }
    });

    const sortedLaps = Object.values(lapMap).sort((a, b) => a.lap - b.lap);

    // 2. Identify teammates & assign dashed pattern to 2nd driver
    const teamGroups: { [team: string]: string[] } = {};
    Object.keys(driverInfoMap).forEach((abbr) => {
      const team = driverInfoMap[abbr].teamName || "Outros";
      if (!teamGroups[team]) teamGroups[team] = [];
      teamGroups[team].push(abbr);
    });

    const dashedDrivers = new Set<string>();
    Object.values(teamGroups).forEach((abbrs) => {
      if (abbrs.length >= 2) {
        // Sort drivers by final position or alphabetically
        abbrs.sort((a, b) => {
          const posA = sessionMap.get(a)?.finishing_position ?? 99;
          const posB = sessionMap.get(b)?.finishing_position ?? 99;
          return posA - posB;
        });
        // 2nd driver gets dashed line
        dashedDrivers.add(abbrs[1]);
        if (abbrs.length > 2) {
          // If 3+ drivers (subs, etc.), alternate
          dashedDrivers.add(abbrs[2]);
        }
      }
    });

    // 3. Build comprehensive DriverMeta list
    const driversList: DriverMeta[] = Object.keys(driverInfoMap).map((abbr) => {
      const info = driverInfoMap[abbr];
      const sessionItem = sessionMap.get(abbr) || sessionMap.get(info.fullName.toLowerCase());
      const laps = driverLapsMap[abbr] || {};
      const lapNumbers = Object.keys(laps).map(Number).sort((a, b) => a - b);

      const startPos = lapNumbers.length > 0 ? laps[lapNumbers[0]].pos : (sessionItem?.starting_grid_position ?? 20);
      const finishPos = sessionItem?.finishing_position ?? (lapNumbers.length > 0 ? laps[lapNumbers[lapNumbers.length - 1]].pos : 20);

      const allPositions = lapNumbers.map((l) => laps[l].pos);
      const bestPos = allPositions.length > 0 ? Math.min(...allPositions) : finishPos;
      const worstPos = allPositions.length > 0 ? Math.max(...allPositions) : finishPos;

      return {
        abbr,
        fullName: info.fullName,
        teamName: info.teamName,
        teamColor: info.teamColor,
        headshotUrl: sessionItem?.driver_headshot_url || null,
        finishPos: Number(finishPos) || 20,
        startPos: Number(startPos) || 20,
        bestPos,
        worstPos,
        isDashed: dashedDrivers.has(abbr)
      };
    });

    // Sort drivers by finishing position
    driversList.sort((a, b) => a.finishPos - b.finishPos);

    return {
      chartData: sortedLaps,
      driversList,
      totalLaps: maxLap,
      maxPosition: Math.max(maxPos, 20)
    };
  }, [data, sessionResults]);

  // Toggle individual driver selection on click
  const toggleDriver = (abbr: string) => {
    setSelectedDrivers((prev) =>
      prev.includes(abbr) ? prev.filter((d) => d !== abbr) : [...prev, abbr]
    );
  };

  // Preset actions
  const handleSelectPreset = (preset: "all" | "top10" | "top5" | "podium") => {
    if (preset === "all") {
      setSelectedDrivers([]);
    } else if (preset === "top10") {
      setSelectedDrivers(driversList.slice(0, 10).map((d) => d.abbr));
    } else if (preset === "top5") {
      setSelectedDrivers(driversList.slice(0, 5).map((d) => d.abbr));
    } else if (preset === "podium") {
      setSelectedDrivers(driversList.slice(0, 3).map((d) => d.abbr));
    }
  };

  // Quick zoom buttons helper
  const handleZoom = (range: "all" | "start" | "mid" | "end") => {
    if (totalLaps === 0) return;
    if (range === "all") {
      setBrushRange({ startIndex: 0, endIndex: chartData.length - 1 });
    } else if (range === "start") {
      setBrushRange({ startIndex: 0, endIndex: Math.min(14, chartData.length - 1) });
    } else if (range === "mid") {
      const midStart = Math.max(0, Math.floor(chartData.length * 0.25));
      const midEnd = Math.min(chartData.length - 1, Math.floor(chartData.length * 0.7));
      setBrushRange({ startIndex: midStart, endIndex: midEnd });
    } else if (range === "end") {
      setBrushRange({ startIndex: Math.max(0, chartData.length - 16), endIndex: chartData.length - 1 });
    }
  };

  // SVG rendering order: Selected drivers are rendered LAST so their lines appear on top of dimmed ones!
  const orderedRenderLines = useMemo(() => {
    if (!hasSelection) return driversList;
    return [...driversList].sort((a, b) => {
      const aSelected = selectedDrivers.includes(a.abbr);
      const bSelected = selectedDrivers.includes(b.abbr);
      if (aSelected && !bSelected) return 1;
      if (!aSelected && bSelected) return -1;
      return 0;
    });
  }, [driversList, selectedDrivers, hasSelection]);

  // Selected driver metadata objects
  const selectedDriverMetas = useMemo(() => {
    return selectedDrivers
      .map((abbr) => driversList.find((d) => d.abbr === abbr))
      .filter((d): d is DriverMeta => d !== undefined);
  }, [selectedDrivers, driversList]);

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-12 text-center shadow-xl">
        <Activity className="h-10 w-10 text-f1-subtle/40 mx-auto mb-3" />
        <h4 className="text-base font-bold text-white">Dados de voltas indisponíveis</h4>
        <p className="text-xs text-f1-subtle mt-1">
          Não há registros de posições volta a volta disponíveis para esta sessão.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Container Principal */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-5 lg:p-6 shadow-2xl">
        {/* Header do Gráfico */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-f1-red/15 text-f1-red">
                <Activity className="h-4 w-4" />
              </span>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Evolução Volta a Volta (Lap Chart)
              </h3>
            </div>
            <p className="text-xs text-f1-subtle mt-1">
              Trajetória e trocas de posições de todos os {driversList.length} pilotos ao longo de {totalLaps} voltas.
            </p>
          </div>

          {/* Filtros de Preset e Zoom Rápido */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Presets de Seleção Rápida */}
            <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10">
              <span className="text-[10px] font-bold uppercase text-f1-subtle px-2 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Selecionar:
              </span>
              <button
                onClick={() => handleSelectPreset("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  !hasSelection
                    ? "bg-f1-red text-white shadow-md shadow-f1-red/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Todos ({driversList.length})
              </button>
              <button
                onClick={() => handleSelectPreset("top10")}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-gray-400 hover:text-white transition-all"
              >
                Top 10
              </button>
              <button
                onClick={() => handleSelectPreset("top5")}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-gray-400 hover:text-white transition-all"
              >
                Top 5
              </button>
              <button
                onClick={() => handleSelectPreset("podium")}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-gray-400 hover:text-white transition-all"
              >
                Pódio
              </button>
            </div>

            {/* Quick Zoom Buttons */}
            <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10">
              <span className="text-[10px] font-bold uppercase text-f1-subtle px-2 flex items-center gap-1">
                <Maximize2 className="h-3 w-3" /> Zoom:
              </span>
              <button
                onClick={() => handleZoom("all")}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-400 hover:bg-white/10 hover:text-white"
              >
                Tudo
              </button>
              <button
                onClick={() => handleZoom("start")}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-400 hover:bg-white/10 hover:text-white"
              >
                V1–15
              </button>
              <button
                onClick={() => handleZoom("mid")}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-400 hover:bg-white/10 hover:text-white"
              >
                Meio
              </button>
              <button
                onClick={() => handleZoom("end")}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-400 hover:bg-white/10 hover:text-white"
              >
                Fim
              </button>
            </div>
          </div>
        </div>

        {/* Dica de Usabilidade e Legenda do Padrão de Equipe */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-f1-subtle bg-white/[0.02] border border-white/5 px-3 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span>
              Clique nos pilotos abaixo para <strong className="text-white">selecionar múltiplos pilotos</strong> e comparar suas disputas.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="inline-block w-4 h-0.5 bg-gray-300 rounded-full" />
              1º Piloto da equipe (Linha contínua)
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="inline-block w-4 h-0.5 border-t border-dashed border-gray-300" />
              2º Piloto da equipe (Linha tracejada)
            </span>
          </div>
        </div>

        {/* Ribbon de Pilotos Interativa (Clique para selecionar múltiplos pilotos) */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {driversList.map((driver) => {
            const isSelected = selectedDrivers.includes(driver.abbr);

            return (
              <button
                key={driver.abbr}
                type="button"
                onClick={() => toggleDriver(driver.abbr)}
                className={`group shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? "bg-white/20 text-white border-white scale-105 shadow-md shadow-white/15"
                    : hasSelection
                    ? "bg-[#0E0E16] text-gray-400 border-white/5 opacity-60 hover:opacity-100 hover:text-white"
                    : "bg-[#11111A] text-gray-300 border-white/10 hover:border-white/30 hover:text-white"
                }`}
                style={{
                  borderLeftColor: driver.teamColor,
                  borderLeftWidth: "4px"
                }}
              >
                {/* Indicador de Seleção */}
                {isSelected ? (
                  <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                ) : (
                  <span className="text-[10px] font-mono text-f1-subtle group-hover:text-white">
                    P{driver.finishPos}
                  </span>
                )}
                <span>{driver.abbr}</span>
                <span
                  className="text-[9px] font-mono"
                  title={driver.isDashed ? "2º Piloto (Linha Tracejada)" : "1º Piloto (Linha Contínua)"}
                >
                  {driver.isDashed ? "┄" : "━"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Banner de Resumo da Seleção */}
        {hasSelection && (
          <div className="mt-3 rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.07] to-transparent p-3 transition-all duration-200">
            {selectedDrivers.length === 1 ? (
              // Visualização Detalhada para 1 piloto selecionado
              (() => {
                const driver = selectedDriverMetas[0];
                if (!driver) return null;
                const delta = driver.startPos - driver.finishPos;

                return (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <DriverLink driverName={driver.fullName} driverAbbr={driver.abbr}>
                        {driver.headshotUrl ? (
                          <img
                            src={driver.headshotUrl}
                            alt={driver.fullName}
                            className="h-10 w-10 rounded-full object-cover border border-white/20 bg-white/5 transition-transform hover:scale-105"
                          />
                        ) : (
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center font-black text-xs border border-white/20 transition-transform hover:scale-105"
                            style={{ backgroundColor: `${driver.teamColor}20`, color: driver.teamColor }}
                          >
                            {driver.abbr}
                          </div>
                        )}
                      </DriverLink>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: driver.teamColor }}
                          />
                          <DriverLink driverName={driver.fullName} driverAbbr={driver.abbr}>
                            <h4 className="text-sm font-black text-white hover:text-f1-red transition-colors">{driver.fullName}</h4>
                          </DriverLink>
                          <span className="text-xs font-mono font-bold text-f1-subtle">({driver.abbr})</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              driver.isDashed
                                ? "bg-white/10 text-gray-300 border border-dashed border-white/30"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            {driver.isDashed ? "Tracejado ┅" : "Contínuo ━"}
                          </span>
                        </div>
                        <p className="text-[11px] text-f1-subtle font-medium">{driver.teamName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-f1-subtle uppercase font-bold">Largada ➔ Chegada</span>
                        <span className="font-black text-white">
                          P{driver.startPos} ➔ P{driver.finishPos}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-f1-subtle uppercase font-bold">Saldo</span>
                        <div className="flex items-center gap-1 font-black">
                          {delta > 0 ? (
                            <span className="text-emerald-400 flex items-center">
                              <ArrowUpRight className="h-3.5 w-3.5" />+{delta}
                            </span>
                          ) : delta < 0 ? (
                            <span className="text-red-400 flex items-center">
                              <ArrowDownRight className="h-3.5 w-3.5" />{delta}
                            </span>
                          ) : (
                            <span className="text-gray-400 flex items-center">
                              <Minus className="h-3 w-3" /> 0
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-f1-subtle uppercase font-bold">Melhor / Pior</span>
                        <span className="font-black text-gray-300">
                          P{driver.bestPos} / P{driver.worstPos}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedDrivers([])}
                        className="rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1.5 font-bold flex items-center gap-1 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Limpar seleção
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              // Visualização de Comparação Multi-Pilotos
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-f1-subtle mr-1">
                    Comparando {selectedDrivers.length} pilotos:
                  </span>
                  {selectedDriverMetas.map((driver) => {
                    const delta = driver.startPos - driver.finishPos;
                    return (
                      <div
                        key={driver.abbr}
                        className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-white border border-white/10"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: driver.teamColor }}
                        />
                        <span>{driver.abbr}</span>
                        <span className="text-[10px] text-f1-subtle font-mono">
                          (P{driver.finishPos})
                        </span>
                        {delta > 0 ? (
                          <span className="text-[10px] text-emerald-400 font-mono">+{delta}</span>
                        ) : delta < 0 ? (
                          <span className="text-[10px] text-red-400 font-mono">{delta}</span>
                        ) : null}
                        <button
                          onClick={() => toggleDriver(driver.abbr)}
                          className="ml-1 hover:text-red-400 text-gray-400 transition-colors"
                          title="Remover piloto da comparação"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setSelectedDrivers([])}
                  className="rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1.5 font-bold flex items-center gap-1 transition-colors shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar ({selectedDrivers.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Gráfico Recharts Interativo */}
        <div className="mt-4 h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: -10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1D1D2B" vertical={false} />

              <XAxis
                dataKey="lap"
                stroke="#6B7280"
                fontSize={11}
                tickFormatter={(val) => `V${val}`}
                dy={5}
                label={{
                  value: "Volta da Corrida",
                  position: "insideBottomRight",
                  offset: -5,
                  fill: "#6B7280",
                  fontSize: 10
                }}
              />

              <YAxis
                stroke="#6B7280"
                fontSize={11}
                reversed={true}
                domain={[1, maxPosition]}
                ticks={[1, 3, 5, 10, 15, 20]}
                tickFormatter={(val) => `P${val}`}
                dx={-5}
              />

              {/* Linha de Referência da Zona de Pontos (Top 10) */}
              <ReferenceLine
                y={10.5}
                stroke="#E10600"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: "Zona de Pontos (Top 10)",
                  position: "right",
                  fill: "#E10600",
                  fontSize: 10,
                  opacity: 0.8
                }}
              />

              {/* Linha de Referência de Pódio (Top 3) */}
              <ReferenceLine
                y={3.5}
                stroke="#FBBF24"
                strokeDasharray="2 4"
                strokeOpacity={0.4}
                label={{
                  value: "Pódio",
                  position: "right",
                  fill: "#FBBF24",
                  fontSize: 9,
                  opacity: 0.7
                }}
              />

              <Tooltip
                content={
                  <CustomLapTooltip
                    selectedDrivers={selectedDrivers}
                    driversList={driversList}
                    totalLaps={totalLaps}
                  />
                }
              />

              {/* Linhas dos Pilotos - Sem hover acidental nas linhas, apenas destaque visual conforme seleção */}
              {orderedRenderLines.map((driver) => {
                const isSelected = selectedDrivers.includes(driver.abbr);

                let strokeOpacity = 0.75;
                let strokeWidth = 2;

                if (hasSelection) {
                  if (isSelected) {
                    strokeOpacity = 1;
                    strokeWidth = 3.8;
                  } else {
                    strokeOpacity = 0.10;
                    strokeWidth = 1.2;
                  }
                }

                return (
                  <Line
                    key={driver.abbr}
                    type="monotone"
                    dataKey={driver.abbr}
                    name={driver.fullName}
                    stroke={driver.teamColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeDasharray={driver.isDashed ? "5 4" : undefined}
                    dot={false}
                    activeDot={
                      isSelected
                        ? { r: 5, fill: driver.teamColor, stroke: "#FFFFFF", strokeWidth: 2 }
                        : hasSelection
                        ? false
                        : { r: 3.5, fill: driver.teamColor, stroke: "#FFFFFF", strokeWidth: 1.5 }
                    }
                    connectNulls={false}
                    style={{
                      transition: "stroke-opacity 150ms ease, stroke-width 150ms ease"
                    }}
                  />
                );
              })}

              {/* Slider de Zoom por Volta (Brush) */}
              <Brush
                dataKey="lap"
                height={28}
                stroke="#374151"
                fill="#0E0E17"
                travellerWidth={10}
                tickFormatter={(val) => `V${val}`}
                startIndex={brushRange.startIndex}
                endIndex={brushRange.endIndex}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Tooltip Personalizado Adaptado para Múltiplos Pilotos
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: number;
  selectedDrivers: string[];
  driversList: DriverMeta[];
  totalLaps: number;
}

function CustomLapTooltip({
  active,
  payload,
  label,
  selectedDrivers,
  driversList,
  totalLaps
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || label === undefined) {
    return null;
  }

  const driverMetaMap = new Map<string, DriverMeta>();
  driversList.forEach((d) => driverMetaMap.set(d.abbr, d));

  const runningOrder: {
    abbr: string;
    position: number;
    color: string;
    meta?: DriverMeta;
    compound?: string | null;
    tyreLife?: number | null;
  }[] = [];

  const rawDetails = payload[0]?.payload?._details || {};

  payload.forEach((item) => {
    const abbr = item.dataKey as string;
    const pos = item.value;
    if (abbr && typeof pos === "number" && !isNaN(pos)) {
      const meta = driverMetaMap.get(abbr);
      const detail = rawDetails[abbr];
      runningOrder.push({
        abbr,
        position: pos,
        color: meta?.teamColor || item.stroke || "#FFFFFF",
        meta,
        compound: detail?.compound,
        tyreLife: detail?.tyreLife
      });
    }
  });

  runningOrder.sort((a, b) => a.position - b.position);

  // Filtra itens selecionados presentes nesta volta
  const selectedItems = runningOrder.filter((r) => selectedDrivers.includes(r.abbr));
  const hasSelectedInTooltip = selectedItems.length > 0;

  return (
    <div className="w-72 rounded-xl border border-white/15 bg-[#12121D]/95 p-3.5 shadow-2xl backdrop-blur-md">
      {/* Cabeçalho da Volta */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
        <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-f1-red" />
          Volta {label} {totalLaps > 0 ? `de ${totalLaps}` : ""}
        </span>
        <span className="text-[10px] font-mono text-f1-subtle">
          {runningOrder.length} carros na pista
        </span>
      </div>

      {/* Destaque dos Pilotos Selecionados nesta volta */}
      {hasSelectedInTooltip && (
        <div className="mb-3 space-y-1.5 rounded-lg border border-white/15 bg-white/[0.06] p-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-f1-subtle">
            Pilotos Selecionados:
          </div>
          {selectedItems.map((item) => (
            <div
              key={item.abbr}
              className="flex items-center justify-between rounded px-1.5 py-0.5 text-xs font-bold text-white"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.meta?.fullName || item.abbr}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.compound && (
                  <span className="text-[10px] font-normal text-f1-subtle capitalize">
                    {item.compound.toLowerCase()}
                  </span>
                )}
                <span
                  className="px-1.5 py-0.2 rounded font-mono"
                  style={{ backgroundColor: `${item.color}25`, color: item.color }}
                >
                  P{item.position}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela do Grid na Volta */}
      <div className="space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-f1-subtle mb-1">
          {hasSelectedInTooltip ? "Demais Líderes da Volta:" : "Líderes nesta volta:"}
        </div>
        {(hasSelectedInTooltip ? runningOrder.slice(0, 5) : runningOrder.slice(0, 7)).map((driver) => {
          const isThisSelected = selectedDrivers.includes(driver.abbr);
          return (
            <div
              key={driver.abbr}
              className={`flex items-center justify-between rounded px-2 py-1 text-xs transition-colors ${
                isThisSelected
                  ? "bg-white/15 font-bold text-white border-l-2 border-f1-red"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-[11px] font-mono font-bold text-f1-subtle">
                  P{driver.position}
                </span>
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: driver.color }}
                />
                <span className="font-bold text-white">{driver.abbr}</span>
                <span className="text-[10px] text-f1-subtle truncate max-w-[90px]">
                  {driver.meta?.fullName || ""}
                </span>
              </div>
              {driver.compound && (
                <span className="text-[9px] font-mono text-f1-subtle bg-white/5 px-1 rounded">
                  {driver.compound.slice(0, 1)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
