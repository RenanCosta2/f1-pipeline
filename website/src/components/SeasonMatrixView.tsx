"use client";

import React, { useMemo, useState } from "react";
import { SeasonMatrixItem } from "@/types/f1";
import { 
  Search, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Zap,
  Info
} from "lucide-react";
import { DriverLink } from "@/lib/driverUtils";
import { TeamLink } from "@/lib/teamUtils";
import { CircuitLink } from "@/lib/circuitUtils";

interface Props {
  matrixData: SeasonMatrixItem[];
  year: number;
}

type PaletteMode = "dark_neon" | "vibrant";

interface CellStyle {
  bg: string;
  text: string;
  border?: string;
  label: string;
  sample: string;
}

const PALETTES: Record<PaletteMode, Record<string, CellStyle>> = {
  // Paleta Neon Dark: Translúcida, elegante, perfeitamente integrada ao tema escuro do portal
  dark_neon: {
    p1: {
      bg: "#F59E0B", // Ouro Dourado de Campeão (Vitória)
      text: "#000000",
      border: "#FDE047",
      label: "1º Lugar (Vitória)",
      sample: "1"
    },
    p2: {
      bg: "#CBD5E1", // Prata / Platina Polida
      text: "#0F172A",
      border: "#FFFFFF",
      label: "2º Lugar",
      sample: "2"
    },
    p3: {
      bg: "#B45309", // Bronze Nobre de Pódio
      text: "#FFFFFF",
      border: "#F59E0B",
      label: "3º Lugar",
      sample: "3"
    },
    points: {
      bg: "rgba(16, 185, 129, 0.18)", // Fundo verde esmeralda translúcido
      text: "#34D399", // Texto Verde Néon luminoso
      border: "rgba(16, 185, 129, 0.35)",
      label: "Zona de Pontos (4º ao 10º / 4º ao 8º CS)",
      sample: "4"
    },
    no_points: {
      bg: "rgba(255, 255, 255, 0.03)", // Grafite escuro e calmo
      text: "#71717A",
      border: "rgba(255, 255, 255, 0.06)",
      label: "Completou s/ Pontos (11º+ / 9º+ CS)",
      sample: "12"
    },
    retired: {
      bg: "rgba(239, 68, 68, 0.18)", // Carmesim translúcido elegante
      text: "#F87171",
      border: "rgba(239, 68, 68, 0.45)",
      label: "Abandono (Ret / DNF)",
      sample: "Ret"
    },
    dns: {
      bg: "rgba(255, 255, 255, 0.02)",
      text: "#52525B",
      border: "rgba(255, 255, 255, 0.04)",
      label: "Não Largou (NL / DNS)",
      sample: "NL"
    },
    dsq: {
      bg: "#000000",
      text: "#EF4444",
      border: "#EF4444",
      label: "Desclassificado (DSQ)",
      sample: "DSQ"
    },
    in_progress: {
      bg: "rgba(16, 185, 129, 0.15)",
      text: "#34D399",
      border: "rgba(16, 185, 129, 0.4)",
      label: "GP em Andamento",
      sample: "●"
    },
    scheduled: {
      bg: "transparent",
      text: "#3F3F46",
      label: "Programado",
      sample: "—"
    },
    not_participated: {
      bg: "transparent",
      text: "#27272A",
      label: "Não Participou",
      sample: "—"
    }
  },
  // Paleta Vibrante: Cores sólidas de alto contraste, refinadas
  vibrant: {
    p1: {
      bg: "#F59E0B",
      text: "#000000",
      border: "#FEF08A",
      label: "1º Lugar (Vitória)",
      sample: "1"
    },
    p2: {
      bg: "#94A3B8",
      text: "#000000",
      border: "#E2E8F0",
      label: "2º Lugar",
      sample: "2"
    },
    p3: {
      bg: "#C2410C",
      text: "#FFFFFF",
      border: "#FDBA74",
      label: "3º Lugar",
      sample: "3"
    },
    points: {
      bg: "#065F46",
      text: "#D1FAE5",
      border: "#10B981",
      label: "Zona de Pontos (4º ao 10º / 4º ao 8º CS)",
      sample: "4"
    },
    no_points: {
      bg: "#181822",
      text: "#94A3B8",
      border: "#27273A",
      label: "Completou s/ Pontos (11º+ / 9º+ CS)",
      sample: "12"
    },
    retired: {
      bg: "#7F1D1D",
      text: "#FECACA",
      border: "#DC2626",
      label: "Abandono (Ret / DNF)",
      sample: "Ret"
    },
    dns: {
      bg: "#27272A",
      text: "#71717A",
      border: "#3F3F46",
      label: "Não Largou (NL / DNS)",
      sample: "NL"
    },
    dsq: {
      bg: "#000000",
      text: "#EF4444",
      border: "#EF4444",
      label: "Desclassificado (DSQ)",
      sample: "DSQ"
    },
    in_progress: {
      bg: "#064E3B",
      text: "#34D399",
      border: "#10B981",
      label: "GP em Andamento",
      sample: "●"
    },
    scheduled: {
      bg: "transparent",
      text: "#3F3F46",
      label: "Programado",
      sample: "—"
    },
    not_participated: {
      bg: "transparent",
      text: "#27272A",
      label: "Não Participou",
      sample: "—"
    }
  }
};

export default function SeasonMatrixView({ matrixData, year }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showLegend, setShowLegend] = useState(false);
  const [paletteMode, setPaletteMode] = useState<PaletteMode>("dark_neon");
  const [hoveredCell, setHoveredCell] = useState<{
    driverId: string;
    roundNumber: number;
    session: "CS" | "CP";
  } | null>(null);

  const activeTheme = PALETTES[paletteMode];

  // 1. Extrair rodadas únicas da temporada
  const rounds = useMemo(() => {
    const roundMap = new Map<
      number,
      {
        round_number: number;
        circuit_short_code: string;
        circuit_id?: string;
        country_flag: string;
        country: string;
        official_event_name: string;
        location: string;
        round_status: "Completed" | "In Progress" | "Scheduled";
        has_sprint: boolean;
      }
    >();

    matrixData.forEach((item) => {
      if (!roundMap.has(item.round_number)) {
        roundMap.set(item.round_number, {
          round_number: item.round_number,
          circuit_short_code: item.circuit_short_code,
          circuit_id: item.circuit_sk || item.location,
          country_flag: item.country_flag,
          country: item.country,
          official_event_name: item.official_event_name,
          location: item.location,
          round_status: item.round_status,
          has_sprint: Boolean(item.has_sprint)
        });
      }
    });

    return Array.from(roundMap.values()).sort((a, b) => a.round_number - b.round_number);
  }, [matrixData]);

  // 2. Extrair linhas de Piloto
  const driverRows = useMemo(() => {
    type DriverTeamKey = string;
    const rowMap = new Map<
      DriverTeamKey,
      {
        driver_id: string;
        driver_full_name: string;
        driver_abbreviation: string;
        driver_number: number | null;
        driver_nationality: string | null;
        driver_headshot_url: string | null;
        team_id: string;
        team_name: string;
        team_color: string | null;
        championship_position: number;
        total_driver_points: number;
        total_driver_wins: number;
        total_driver_podiums: number;
        resultsByRound: Map<number, SeasonMatrixItem>;
      }
    >();

    matrixData.forEach((item) => {
      const key = `${item.driver_id}__${item.team_id}`;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          driver_id: item.driver_id,
          driver_full_name: item.driver_full_name,
          driver_abbreviation: item.driver_abbreviation,
          driver_number: item.driver_number,
          driver_nationality: item.driver_nationality,
          driver_headshot_url: item.driver_headshot_url,
          team_id: item.team_id,
          team_name: item.team_name,
          team_color: item.team_color,
          championship_position: item.championship_position,
          total_driver_points: item.total_driver_points,
          total_driver_wins: item.total_driver_wins,
          total_driver_podiums: item.total_driver_podiums,
          resultsByRound: new Map()
        });
      }
      rowMap.get(key)!.resultsByRound.set(item.round_number, item);
    });

    // Ordenar por classificação do campeonato
    return Array.from(rowMap.values()).sort((a, b) => {
      if (a.championship_position !== b.championship_position) {
        return a.championship_position - b.championship_position;
      }
      return a.driver_full_name.localeCompare(b.driver_full_name);
    });
  }, [matrixData]);

  // 3. Filtrar por busca (nome do piloto ou número)
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return driverRows;
    const q = searchQuery.toLowerCase();
    return driverRows.filter(
      (r) =>
        r.driver_full_name.toLowerCase().includes(q) ||
        r.driver_abbreviation.toLowerCase().includes(q) ||
        r.team_name.toLowerCase().includes(q) ||
        String(r.driver_number || "").includes(q)
    );
  }, [driverRows, searchQuery]);

  // Verifica se há alguma rodada com sprint na temporada para exibir a linha secundária no header
  const hasAnySprint = useMemo(() => rounds.some((r) => r.has_sprint), [rounds]);

  return (
    <div className="space-y-4">
      {/* Barra Superior da Matriz: Busca & Legenda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B0B10] p-3 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-f1-subtle" />
            <input
              type="text"
              placeholder="Buscar piloto ou número..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white placeholder-f1-subtle focus:outline-none focus:border-f1-red transition-colors"
            />
          </div>
          <span className="text-xs text-f1-subtle font-medium hidden sm:inline">
            {filteredRows.length} piloto(s) • {rounds.length} GPs
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Seletor de Paleta de Cores */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setPaletteMode("dark_neon")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                paletteMode === "dark_neon"
                  ? "bg-f1-red text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Paleta moderna com fundo translúcido e números néon de alto contraste"
            >
              Neon Dark
            </button>
            <button
              onClick={() => setPaletteMode("vibrant")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                paletteMode === "vibrant"
                  ? "bg-f1-red text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Paleta sólida clássica com cores esportivas de alto contraste"
            >
              Vibrante
            </button>
          </div>

          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <HelpCircle className="h-3.5 w-3.5 text-white/50" />
            <span>Legenda</span>
            {showLegend ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Painel Expansível de Legenda no Estilo Moderno */}
      {showLegend && (
        <div className="rounded-2xl border border-white/10 bg-[#0E0E15] p-4 text-xs text-gray-300 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="font-black uppercase tracking-wider text-white text-[11px] flex items-center gap-2">
              <Info className="h-4 w-4 text-f1-red" />
              Padrão de Cores & Indicadores ({paletteMode === "dark_neon" ? "Neon Dark" : "Vibrante"})
            </h4>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">CS: Sprint</span>
              <span className="bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/15 font-bold">CP: Corrida Principal</span>
            </div>
          </div>

          {/* Grid de Cores dos Resultados */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(activeTheme).map(([key, style]) => {
              if (key === "scheduled" || key === "not_participated") return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-lg p-2 bg-[#0B0B10] border border-white/5"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center font-black text-xs shrink-0 font-mono shadow-sm"
                    style={{
                      backgroundColor: style.bg,
                      color: style.text,
                      border: style.border ? `1px solid ${style.border}` : "none"
                    }}
                  >
                    {style.sample}
                  </div>
                  <span className="text-[11px] truncate leading-tight font-medium text-gray-300">
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Indicadores Especiais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/10 pt-2.5 text-[11px]">
            <div className="flex items-center gap-2.5 bg-[#0B0B10] p-2.5 rounded-xl border border-white/5">
              <span className="font-black text-white font-mono px-2 py-0.5 rounded bg-white/10 text-xs border border-white/20 underline decoration-purple-400 decoration-2">
                1
              </span>
              <span className="text-gray-300">
                <strong>Sublinhado Roxo</strong>: Largou da <strong>Pole Position</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#0B0B10] p-2.5 rounded-xl border border-white/5">
              <span className="italic font-bold text-pink-300 font-mono px-2 py-0.5 rounded bg-pink-500/10 text-xs border border-pink-500/20">
                1*
              </span>
              <span className="text-gray-300">
                <em>Itálico</em>: Cravou a <em>Volta Mais Rápida</em> da prova.
              </span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#0B0B10] p-2.5 rounded-xl border border-white/5">
              <span className="font-black text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-500/10 text-xs border border-amber-500/20">
                18†
              </span>
              <span className="text-gray-300">
                <strong>Cruz (†)</strong>: Não completou, mas foi classificado (&gt;90% da prova).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Container Principal da Matriz */}
      <div className="relative rounded-2xl border border-white/10 bg-[#0B0B10] shadow-2xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-black/40 rounded-2xl">
          <table className="w-full border-collapse text-left text-xs table-fixed">
            {/* Definição Rígida das Colunas */}
            <colgroup>
              {/* 1. Pos: 36px */}
              <col style={{ width: "36px" }} />
              {/* 2. Nu: 36px */}
              <col style={{ width: "36px" }} />
              {/* 3. Piloto: 170px */}
              <col style={{ width: "170px" }} />

              {/* Colunas dos GPs: 38px para etapa simples, ou 34px para CS e 34px para CP */}
              {rounds.map((round) =>
                round.has_sprint ? (
                  <React.Fragment key={round.round_number}>
                    <col style={{ width: "34px" }} />
                    <col style={{ width: "34px" }} />
                  </React.Fragment>
                ) : (
                  <col key={round.round_number} style={{ width: "38px" }} />
                )
              )}

              {/* Pts: 54px */}
              <col style={{ width: "54px" }} />
            </colgroup>

            {/* Cabeçalho */}
            <thead>
              {/* Linha 1 do Header */}
              <tr className="bg-[#12121A] text-white text-[11px] font-black uppercase tracking-wider border-b border-white/10">
                {/* 1. Pos (Sticky 0px) */}
                <th
                  rowSpan={hasAnySprint ? 2 : 1}
                  className="sticky left-0 z-30 bg-[#12121A] px-1 py-2.5 text-center border-r border-white/10"
                  style={{ width: "36px", minWidth: "36px", maxWidth: "36px" }}
                >
                  Pos.
                </th>

                {/* 2. N.º (Sticky 36px) */}
                <th
                  rowSpan={hasAnySprint ? 2 : 1}
                  className="sticky left-[36px] z-30 bg-[#12121A] px-1 py-2.5 text-center border-r border-white/10"
                  style={{ width: "36px", minWidth: "36px", maxWidth: "36px" }}
                >
                  N.º
                </th>

                {/* 3. Piloto (Sticky 72px = 36 + 36) com Sombra Lateral */}
                <th
                  rowSpan={hasAnySprint ? 2 : 1}
                  className="sticky left-[72px] z-30 bg-[#12121A] px-3 py-2.5 border-r border-white/20 shadow-[6px_0_16px_rgba(0,0,0,0.8)]"
                  style={{ width: "170px", minWidth: "170px", maxWidth: "170px" }}
                >
                  Piloto
                </th>

                {/* Colunas de cada GP */}
                {rounds.map((round) => {
                  const isCurrentOrInProgress = round.round_status === "In Progress";

                  if (round.has_sprint) {
                    return (
                      <th
                        key={round.round_number}
                        colSpan={2}
                        className={`px-1 py-1.5 text-center border-r border-white/10 transition-colors ${
                          isCurrentOrInProgress ? "bg-emerald-950/40 text-emerald-400" : ""
                        }`}
                        title={`${round.round_number}. ${round.official_event_name} (${round.location}, ${round.country})`}
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span className="text-[9px] font-mono text-f1-subtle font-bold leading-none">
                            R{round.round_number}
                          </span>
                          <CircuitLink
                            circuitId={round.circuit_id}
                            circuitName={round.location || round.circuit_short_code}
                            className="text-[10px] font-black font-mono tracking-tight text-white hover:text-white hover:underline decoration-white/30 leading-tight transition-colors"
                            title={`Ver circuito: ${round.official_event_name}`}
                          >
                            {round.circuit_short_code}
                          </CircuitLink>
                        </div>
                      </th>
                    );
                  }

                  return (
                    <th
                      key={round.round_number}
                      rowSpan={hasAnySprint ? 2 : 1}
                      className={`px-1 py-2 text-center border-r border-white/10 transition-colors ${
                        isCurrentOrInProgress ? "bg-emerald-950/40 text-emerald-400" : ""
                      }`}
                      style={{ width: "38px", minWidth: "38px", maxWidth: "38px" }}
                      title={`${round.round_number}. ${round.official_event_name} (${round.location}, ${round.country})`}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[9px] font-mono text-f1-subtle font-bold leading-none">
                          R{round.round_number}
                        </span>
                        <CircuitLink
                          circuitId={round.circuit_id}
                          circuitName={round.location || round.circuit_short_code}
                          className="text-[10px] font-black font-mono tracking-tight text-white hover:text-white hover:underline decoration-white/30 leading-tight transition-colors"
                          title={`Ver circuito: ${round.official_event_name}`}
                        >
                          {round.circuit_short_code}
                        </CircuitLink>
                      </div>
                    </th>
                  );
                })}

                {/* Pontos Totais */}
                <th
                  rowSpan={hasAnySprint ? 2 : 1}
                  className="px-2 py-2.5 text-right font-black text-white bg-[#12121A] border-l border-white/20"
                  style={{ width: "54px", minWidth: "54px", maxWidth: "54px" }}
                >
                  Pts.
                </th>
              </tr>

              {/* Linha 2 do Header (Subcolunas CS e CP com badges modernas) */}
              {hasAnySprint && (
                <tr className="bg-[#0E0E15] text-[10px] font-black font-mono border-b border-white/10">
                  {rounds
                    .filter((r) => r.has_sprint)
                    .map((round) => (
                      <React.Fragment key={`sub_${round.round_number}`}>
                        <th
                          className="px-0.5 py-1 text-center border-r border-white/5 bg-[#0E0E15]"
                          style={{ width: "34px", minWidth: "34px", maxWidth: "34px" }}
                          title="Corrida Sprint"
                        >
                          <span className="inline-block px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px]">
                            CS
                          </span>
                        </th>
                        <th
                          className="px-0.5 py-1 text-center border-r border-white/10 bg-[#0E0E15]"
                          style={{ width: "34px", minWidth: "34px", maxWidth: "34px" }}
                          title="Corrida Principal"
                        >
                          <span className="inline-block px-1 py-0.2 rounded bg-white/10 text-zinc-200 border border-white/15 text-[9px]">
                            CP
                          </span>
                        </th>
                      </React.Fragment>
                    ))}
                </tr>
              )}
            </thead>

            {/* Linhas da Tabela */}
            <tbody className="divide-y divide-white/5">
              {filteredRows.map((row, rowIndex) => {
                const teamColor = row.team_color
                  ? row.team_color.startsWith("#")
                    ? row.team_color
                    : `#${row.team_color}`
                  : "#E10600";
                const isEven = rowIndex % 2 === 0;
                const rowBg = isEven ? "bg-[#0B0B10]" : "bg-[#0E0E15]";

                return (
                  <tr
                    key={`${row.driver_id}__${row.team_id}`}
                    className={`hover:bg-white/[0.04] transition-colors group ${rowBg}`}
                  >
                    {/* 1. Pos (Sticky 0px) */}
                    <td
                      className={`sticky left-0 z-20 px-1 py-2 text-center font-bold font-mono tabular-nums border-r border-white/10 ${rowBg} group-hover:bg-[#161622] transition-colors`}
                      style={{ width: "36px", minWidth: "36px", maxWidth: "36px" }}
                    >
                      <span
                        className={`text-xs font-black font-mono tabular-nums ${
                          row.championship_position === 1
                            ? "text-amber-400"
                            : row.championship_position === 2
                            ? "text-slate-300"
                            : row.championship_position === 3
                            ? "text-amber-600"
                            : "text-zinc-400"
                        }`}
                      >
                        {row.championship_position}
                      </span>
                    </td>

                    {/* 2. N.º (Sticky 36px) */}
                    <td
                      className={`sticky left-[36px] z-20 px-1 py-2 text-center border-r border-white/10 ${rowBg} group-hover:bg-[#161622] transition-colors`}
                      style={{ width: "36px", minWidth: "36px", maxWidth: "36px" }}
                    >
                      {row.driver_number ? (
                        <span className="inline-block rounded bg-white/5 border border-white/10 px-1 py-0.2 text-[10px] font-mono tabular-nums font-bold text-zinc-300">
                          #{row.driver_number}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs font-mono">—</span>
                      )}
                    </td>

                    {/* 3. Piloto (Sticky 72px) - Visual Moderno de Card de Piloto */}
                    <td
                      className={`sticky left-[72px] z-20 px-2.5 py-2 border-r border-white/20 shadow-[6px_0_16px_rgba(0,0,0,0.8)] ${rowBg} group-hover:bg-[#161622] transition-colors`}
                      style={{ width: "170px", minWidth: "170px", maxWidth: "170px" }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Faixa de Cor da Equipe */}
                        <div
                          className="w-1.5 h-7 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: teamColor }}
                          title={row.team_name}
                        />

                        {/* Nome do Piloto & Equipe */}
                        <div className="min-w-0 flex-1 block">
                          <DriverLink
                            driverId={row.driver_id}
                            driverName={row.driver_full_name}
                            driverAbbr={row.driver_abbreviation}
                            className="block truncate font-bold text-white text-xs hover:text-white hover:underline decoration-white/30 transition-colors leading-snug"
                          >
                            {row.driver_full_name}
                          </DriverLink>
                          <TeamLink
                            teamId={row.team_name}
                            teamName={row.team_name}
                            className="block truncate text-[10px] text-f1-subtle hover:text-white font-medium leading-none mt-0.5 transition-colors"
                          >
                            {row.team_name}
                          </TeamLink>
                        </div>
                      </div>
                    </td>

                    {/* Células de Resultados de Cada GP */}
                    {rounds.map((round, roundIndex) => {
                      const item = row.resultsByRound.get(round.round_number);

                      // Função de renderização para uma célula de resultado (CS ou CP)
                      const renderCell = (
                        category: string | null | undefined,
                        code: string | null | undefined,
                        isPole: boolean,
                        isFastestLap: boolean,
                        session: "CS" | "CP",
                        width: string
                      ) => {
                        const theme = category ? activeTheme[category] || activeTheme.not_participated : activeTheme.scheduled;
                        const isHovered =
                          hoveredCell?.driverId === row.driver_id &&
                          hoveredCell?.roundNumber === round.round_number &&
                          hoveredCell?.session === session;

                        const isScheduled = category === "scheduled" || !code || code === "—";

                        // POSICIONAMENTO INTELIGENTE DA TOOLTIP:
                        // Vertical: Para as primeiras 4 linhas (topo), posiciona ABAIXO (top-full mt-2).
                        // Para as demais linhas, posiciona ACIMA (bottom-full mb-2).
                        const verticalPos = rowIndex < 4 ? "top-full mt-2" : "bottom-full mb-2";
                        const horizontalPos =
                          roundIndex <= 2
                            ? "left-0"
                            : roundIndex >= rounds.length - 3
                            ? "right-0"
                            : "left-1/2 -translate-x-1/2";

                        return (
                          <td
                            key={`${round.round_number}_${session}`}
                            onMouseEnter={() =>
                              setHoveredCell({
                                driverId: row.driver_id,
                                roundNumber: round.round_number,
                                session
                              })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                            className="relative p-0.5 border-r border-white/5 text-center select-none"
                            style={{
                              width,
                              minWidth: width,
                              maxWidth: width
                            }}
                          >
                            <div
                              className={`w-full h-7 rounded-[4px] flex items-center justify-center font-bold text-xs leading-none font-mono transition-transform duration-100 ${
                                isHovered && !isScheduled ? "scale-105 z-20 shadow-md ring-1 ring-white/50" : ""
                              }`}
                              style={{
                                backgroundColor: theme.bg,
                                color: theme.text,
                                border: theme.border ? `1px solid ${theme.border}` : "1px solid rgba(255,255,255,0.05)"
                              }}
                            >
                              <span
                                className={`${isPole ? "font-black underline decoration-purple-400 decoration-2" : ""} ${
                                   isFastestLap ? "italic font-black text-pink-200" : ""
                                } ${isScheduled ? "text-zinc-700 font-normal" : ""}`}
                              >
                                {code || "—"}
                              </span>
                            </div>

                            {/* Tooltip Rico com Posicionamento Anti-Corte */}
                            {isHovered && item && !isScheduled && (
                              <div
                                className={`absolute ${verticalPos} ${horizontalPos} w-56 rounded-2xl bg-[#14141E]/95 backdrop-blur-md p-3 text-left shadow-2xl border border-white/20 z-50 pointer-events-none text-white font-sans text-xs animate-in fade-in zoom-in-95 duration-100`}
                              >
                                {/* Header da Tooltip */}
                                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                                  <span className="text-[11px] font-black uppercase text-amber-400">
                                    {round.circuit_short_code} • {session === "CS" ? "Sprint (CS)" : "Corrida (CP)"}
                                  </span>
                                  <span className="text-f1-subtle text-[10px] font-mono">R{round.round_number}</span>
                                </div>

                                {/* Conteúdo da Tooltip */}
                                <div className="space-y-1 text-zinc-300 text-[11px]">
                                  <div className="flex items-center gap-1.5 pb-0.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: teamColor }} />
                                    <span className="text-white font-bold truncate">{row.driver_full_name}</span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-f1-subtle">Posição Final:</span>
                                    <span className="font-black text-white">{code}</span>
                                  </div>

                                  {session === "CP" && item.race_grid_position && (
                                    <div className="flex justify-between">
                                      <span className="text-f1-subtle">Largada:</span>
                                      <span>P{item.race_grid_position}</span>
                                    </div>
                                  )}

                                  {session === "CS" && item.sprint_grid_position && (
                                    <div className="flex justify-between">
                                      <span className="text-f1-subtle">Largada:</span>
                                      <span>P{item.sprint_grid_position}</span>
                                    </div>
                                  )}

                                  {item.race_status && item.race_status !== "Finished" && session === "CP" && (
                                    <div className="flex justify-between">
                                      <span className="text-f1-subtle">Status:</span>
                                      <span className="text-rose-400 font-bold">{item.race_status}</span>
                                    </div>
                                  )}

                                  <div className="flex justify-between pt-1 border-t border-white/10 text-emerald-400 font-bold">
                                    <span>Pontos Obtidos:</span>
                                    <span>+{session === "CS" ? item.sprint_points : item.race_points} pts</span>
                                  </div>

                                  {/* Badges Adicionais */}
                                  {(isPole || isFastestLap) && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {isPole && (
                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                          POLE
                                        </span>
                                      )}
                                      {isFastestLap && (
                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-black bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                          ⚡ VOLTA MAIS RÁPIDA
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      };

                      // Se a rodada tem sprint, renderiza 2 colunas: CS e CP
                      if (round.has_sprint) {
                        return (
                          <React.Fragment key={round.round_number}>
                            {renderCell(
                              item?.sprint_result_category,
                              item?.sprint_result_code,
                              false,
                              false,
                              "CS",
                              "34px"
                            )}
                            {renderCell(
                              item?.result_category,
                              item?.result_code,
                              Boolean(item?.is_pole),
                              Boolean(item?.is_fastest_lap),
                              "CP",
                              "34px"
                            )}
                          </React.Fragment>
                        );
                      }

                      // Rodada convencional: 1 coluna
                      return renderCell(
                        item?.result_category,
                        item?.result_code,
                        Boolean(item?.is_pole),
                        Boolean(item?.is_fastest_lap),
                        "CP",
                        "38px"
                      );
                    })}

                    {/* Pts (Total de Pontos Acumulados) */}
                    <td
                      className="px-2 py-2 text-right font-black font-mono tabular-nums text-xs text-white bg-[#12121A] border-l border-white/20"
                      style={{ width: "54px", minWidth: "54px", maxWidth: "54px" }}
                    >
                      {row.total_driver_points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
