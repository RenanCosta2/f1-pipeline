"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import {
  DriverStanding,
  ConstructorStanding,
  CumulativeDriverPoint,
  CumulativeTeamPoint
} from "@/types/f1";
import {
  Trophy,
  TrendingUp,
  SlidersHorizontal,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Rows
} from "lucide-react";
import { DriverLink } from "@/lib/driverUtils";
import { TeamLink } from "@/lib/teamUtils";

function formatHexColor(rawColor: string | null | undefined): string {
  if (rawColor && rawColor.trim() !== "") {
    const clean = rawColor.trim();
    return clean.startsWith("#") ? clean : `#${clean}`;
  }
  return "#E10600";
}

interface Props {
  year: number;
  availableYears?: number[];
  initialDrivers: DriverStanding[];
  initialConstructors: ConstructorStanding[];
  cumulativeDrivers: CumulativeDriverPoint[];
  cumulativeTeams: CumulativeTeamPoint[];
}

export default function SeasonStandingsExplorer({
  year,
  availableYears = [],
  initialDrivers = [],
  initialConstructors = [],
  cumulativeDrivers = [],
  cumulativeTeams = []
}: Props) {
  const [activeTab, setActiveTab] = useState<"drivers" | "constructors">("drivers");
  const [layoutMode, setLayoutMode] = useState<"side" | "full">("side");
  const [chartMetric, setChartMetric] = useState<"championship" | "period">("championship");
  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);

  // 1. Extrai todas as rodadas disponíveis nos dados cumulativos diretamente das colunas do banco (location, country)
  const roundsList = useMemo(() => {
    const map = new Map<number, { location?: string; country?: string; official_event_name?: string }>();

    cumulativeDrivers.forEach((r) => {
      const existing = map.get(r.round_number) || {};
      map.set(r.round_number, {
        location: r.location || existing.location,
        country: r.country || existing.country,
        official_event_name: r.official_event_name || existing.official_event_name
      });
    });

    cumulativeTeams.forEach((r) => {
      const existing = map.get(r.round_number) || {};
      map.set(r.round_number, {
        location: r.location || existing.location,
        country: r.country || existing.country,
        official_event_name: r.official_event_name || existing.official_event_name
      });
    });

    const sorted = Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round_number, data]) => {
        const city = data.location?.trim() || "";
        const country = data.country?.trim() || "";
        const cleanName = data.official_event_name
          ? data.official_event_name.replace(/^FORMULA 1\s+/i, "").replace(/\s+\d{4}$/, "").trim()
          : "";

        let displayName = cleanName || `Etapa ${round_number}`;
        if (city && country) {
          displayName = `${city}, ${country}`;
        } else if (city || country) {
          displayName = city || country;
        }

        return {
          round_number,
          city,
          country,
          name: cleanName || `Etapa ${round_number}`,
          displayName
        };
      });

    return sorted;
  }, [cumulativeDrivers, cumulativeTeams]);

  // Se não houver rodadas carregadas, fallback para range 1 a 24
  const minPossibleRound = roundsList.length > 0 ? roundsList[0].round_number : 1;
  const maxPossibleRound = roundsList.length > 0 ? roundsList[roundsList.length - 1].round_number : 24;

  const [minRound, setMinRound] = useState<number>(minPossibleRound);
  const [maxRound, setMaxRound] = useState<number>(maxPossibleRound);

  // Sincroniza os limites quando as rodadas terminarem de carregar do banco
  useEffect(() => {
    if (roundsList.length > 0) {
      setMinRound(roundsList[0].round_number);
      setMaxRound(roundsList[roundsList.length - 1].round_number);
    }
  }, [roundsList]);

  // Helper para buscar pontos acumulados de um piloto até uma rodada específica
  const getDriverPointsUpToRound = (driverName: string, roundLimit: number): number => {
    const driverRounds = cumulativeDrivers.filter(
      (d) => d.driver_full_name === driverName && d.round_number <= roundLimit
    );
    if (driverRounds.length === 0) return 0;
    return Math.max(...driverRounds.map((d) => d.cumulative_driver_points || 0));
  };

  // Helper para buscar pontos acumulados de um construtor até uma rodada específica
  const getTeamPointsUpToRound = (teamName: string, roundLimit: number): number => {
    const teamRounds = cumulativeTeams.filter(
      (t) => t.team_name === teamName && t.round_number <= roundLimit
    );
    if (teamRounds.length === 0) return 0;
    return Math.max(...teamRounds.map((t) => t.cumulative_team_points || 0));
  };

  // 2. Filtra e recalcula dados da tabela com base no recorte [minRound, maxRound]
  const filteredDrivers = useMemo(() => {
    if (initialDrivers.length === 0) return [];
    const isFullSeason = minRound === minPossibleRound && maxRound === maxPossibleRound;

    // Mapeamento dos pilotos com as métricas recalculadas dinamicamente
    const list = initialDrivers.map((driver) => {
      // 1. Pontuação acumulada oficial do campeonato até a etapa maxRound selecionada
      const totalPointsAtMax = isFullSeason ? driver.total_points : getDriverPointsUpToRound(driver.driver_full_name, maxRound);

      // 2. Pontos obtidos estritamente na última rodada selecionada (maxRound)
      const ptsInLastRound = cumulativeDrivers
        .filter((d) => d.driver_full_name === driver.driver_full_name && d.round_number === maxRound)
        .reduce((sum, d) => sum + (d.points || 0), 0);

      // 3. Pontos conquistados estritamente dentro do período [minRound, maxRound]
      const ptsInPeriod = cumulativeDrivers
        .filter(
          (d) =>
            d.driver_full_name === driver.driver_full_name &&
            d.round_number >= minRound &&
            d.round_number <= maxRound
        )
        .reduce((sum, d) => sum + (d.points || 0), 0);

      // 4. Vitórias e Pódios no período divididos por GP e Sprint
      const periodSessions = cumulativeDrivers.filter(
        (d) =>
          d.driver_full_name === driver.driver_full_name &&
          d.round_number >= minRound &&
          d.round_number <= maxRound
      );

      const raceWinsInPeriod = isFullSeason ? (driver.race_wins || 0) : periodSessions.filter((d) => Number(d.is_race_win) === 1).length;
      const sprintWinsInPeriod = isFullSeason ? (driver.sprint_wins || 0) : periodSessions.filter((d) => Number(d.is_sprint_win) === 1).length;
      const racePodiumsInPeriod = isFullSeason ? (driver.race_podiums || 0) : periodSessions.filter((d) => Number(d.is_race_podium) === 1).length;
      const sprintPodiumsInPeriod = isFullSeason ? (driver.sprint_podiums || 0) : periodSessions.filter((d) => Number(d.is_sprint_podium) === 1).length;

      // 5. Variação de posição (+/-) em relação à rodada anterior (maxRound - 1)
      const pointsAtPrevious = maxRound > minPossibleRound
        ? getDriverPointsUpToRound(driver.driver_full_name, maxRound - 1)
        : totalPointsAtMax;

      return {
        ...driver,
        total_points: totalPointsAtMax,
        pts_in_last_round: ptsInLastRound,
        pts_in_period: ptsInPeriod,
        race_wins_in_period: raceWinsInPeriod,
        sprint_wins_in_period: sprintWinsInPeriod,
        race_podiums_in_period: racePodiumsInPeriod,
        sprint_podiums_in_period: sprintPodiumsInPeriod,
        temp_prev_points: pointsAtPrevious
      };
    });

    // Ordenação e cálculo da posição no campeonato na rodada maxRound
    list.sort((a, b) => b.total_points - a.total_points);

    // Calcula também a ordem na rodada anterior para extrair o delta exato (+/-)
    const prevOrder = [...list].sort((a, b) => b.temp_prev_points - a.temp_prev_points);
    const prevPositionMap = new Map<string, number>();
    prevOrder.forEach((item, idx) => {
      prevPositionMap.set(item.driver_full_name, idx + 1);
    });

    return list.map((driver, idx) => {
      const currentPos = idx + 1;
      const prevPos = prevPositionMap.get(driver.driver_full_name) || currentPos;
      // delta positivo = subiu posições (ex: era 3º e virou 1º -> 3 - 1 = +2)
      const positionDelta = maxRound > minPossibleRound ? prevPos - currentPos : 0;

      return {
        ...driver,
        championship_position: currentPos,
        position_delta: positionDelta
      };
    });
  }, [initialDrivers, cumulativeDrivers, minRound, maxRound, minPossibleRound]);

  // Recalcula dados de construtores com base no recorte [minRound, maxRound]
  const filteredConstructors = useMemo(() => {
    if (initialConstructors.length === 0) return [];
    const isFullSeason = minRound === minPossibleRound && maxRound === maxPossibleRound;

    const list = initialConstructors.map((c) => {
      const totalPointsAtMax = isFullSeason ? c.total_points : getTeamPointsUpToRound(c.team_name, maxRound);

      const ptsInLastRound = cumulativeTeams
        .filter((t) => t.team_name === c.team_name && t.round_number === maxRound)
        .reduce((sum, t) => sum + (t.points || 0), 0);

      const ptsInPeriod = cumulativeTeams
        .filter(
          (t) =>
            t.team_name === c.team_name &&
            t.round_number >= minRound &&
            t.round_number <= maxRound
        )
        .reduce((sum, t) => sum + (t.points || 0), 0);

      const periodTeamRounds = cumulativeTeams.filter(
        (t) =>
          t.team_name === c.team_name &&
          t.round_number >= minRound &&
          t.round_number <= maxRound
      );

      const raceWinsInPeriod = isFullSeason ? (c.race_wins || 0) : periodTeamRounds.reduce((sum, t) => sum + (Number(t.race_wins) || 0), 0);
      const sprintWinsInPeriod = isFullSeason ? (c.sprint_wins || 0) : periodTeamRounds.reduce((sum, t) => sum + (Number(t.sprint_wins) || 0), 0);
      const racePodiumsInPeriod = isFullSeason ? (c.race_podiums || 0) : periodTeamRounds.reduce((sum, t) => sum + (Number(t.race_podiums) || 0), 0);
      const sprintPodiumsInPeriod = isFullSeason ? (c.sprint_podiums || 0) : periodTeamRounds.reduce((sum, t) => sum + (Number(t.sprint_podiums) || 0), 0);

      const pointsAtPrevious = maxRound > minPossibleRound
        ? getTeamPointsUpToRound(c.team_name, maxRound - 1)
        : totalPointsAtMax;

      return {
        ...c,
        total_points: totalPointsAtMax,
        pts_in_last_round: ptsInLastRound,
        pts_in_period: ptsInPeriod,
        race_wins_in_period: raceWinsInPeriod,
        sprint_wins_in_period: sprintWinsInPeriod,
        race_podiums_in_period: racePodiumsInPeriod,
        sprint_podiums_in_period: sprintPodiumsInPeriod,
        temp_prev_points: pointsAtPrevious
      };
    });

    list.sort((a, b) => b.total_points - a.total_points);

    const prevOrder = [...list].sort((a, b) => b.temp_prev_points - a.temp_prev_points);
    const prevPositionMap = new Map<string, number>();
    prevOrder.forEach((item, idx) => {
      prevPositionMap.set(item.team_name, idx + 1);
    });

    return list.map((c, idx) => {
      const currentPos = idx + 1;
      const prevPos = prevPositionMap.get(c.team_name) || currentPos;
      const positionDelta = maxRound > minPossibleRound ? prevPos - currentPos : 0;

      return {
        ...c,
        championship_position: currentPos,
        position_delta: positionDelta
      };
    });
  }, [initialConstructors, cumulativeTeams, minRound, maxRound, minPossibleRound]);

  // Presets Rápidos
  const applyPreset = (start: number, end: number) => {
    setMinRound(Math.max(minPossibleRound, start));
    setMaxRound(Math.min(maxPossibleRound, end));
  };

  // Trata alterações manuais do slider prevenindo cruzamento de ponteiros
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val <= maxRound) {
      setMinRound(val);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val >= minRound) {
      setMaxRound(val);
    }
  };

  // Top 5 Pilotos e Equipes para o gráfico
  const top5Drivers = useMemo(() => filteredDrivers.slice(0, 5), [filteredDrivers]);
  const top5Constructors = useMemo(() => filteredConstructors.slice(0, 5), [filteredConstructors]);

  // 3. Montagem dos dados de evolução para o Recharts
  const chartDriversData = useMemo(() => {
    const roundsInRange = roundsList.filter(
      (r) => r.round_number >= minRound && r.round_number <= maxRound
    );

    const topNames = top5Drivers.map((d) => d.driver_full_name);

    return roundsInRange.map((r) => {
      const pointObj: Record<string, any> = {
        round: `R${r.round_number}`,
        eventName: r.displayName || r.name
      };

      topNames.forEach((driverName) => {
        const champTotal = getDriverPointsUpToRound(driverName, r.round_number);
        if (chartMetric === "championship") {
          pointObj[driverName] = champTotal;
        } else {
          const baseAtStart = minRound > 1 ? getDriverPointsUpToRound(driverName, minRound - 1) : 0;
          pointObj[driverName] = champTotal - baseAtStart;
        }
      });

      return pointObj;
    });
  }, [top5Drivers, roundsList, minRound, maxRound, chartMetric, cumulativeDrivers]);

  const chartTeamsData = useMemo(() => {
    const roundsInRange = roundsList.filter(
      (r) => r.round_number >= minRound && r.round_number <= maxRound
    );

    const topNames = top5Constructors.map((c) => c.team_name);

    return roundsInRange.map((r) => {
      const pointObj: Record<string, any> = {
        round: `R${r.round_number}`,
        eventName: r.displayName || r.name
      };

      topNames.forEach((teamName) => {
        const champTotal = getTeamPointsUpToRound(teamName, r.round_number);
        if (chartMetric === "championship") {
          pointObj[teamName] = champTotal;
        } else {
          const baseAtStart = minRound > 1 ? getTeamPointsUpToRound(teamName, minRound - 1) : 0;
          pointObj[teamName] = champTotal - baseAtStart;
        }
      });

      return pointObj;
    });
  }, [top5Constructors, roundsList, minRound, maxRound, chartMetric, cumulativeTeams]);

  // Diferenciação de companheiros de equipe na mesma cor
  const driverLineConfigs = useMemo(() => {
    const colorUsageCount = new Map<string, number>();
    return top5Drivers.map((d) => {
      const color = d.team_color ? formatHexColor(d.team_color) : "#E10600";
      const used = colorUsageCount.get(color) || 0;
      colorUsageCount.set(color, used + 1);

      return {
        name: d.driver_full_name,
        color: color,
        dash: used > 0 ? "6 3" : undefined,
        team: d.team_name
      };
    });
  }, [top5Drivers]);

  const maxDriverPoints = filteredDrivers[0]?.total_points || 1;
  const maxConstructorPoints = filteredConstructors[0]?.total_points || 1;

  const totalSpan = maxPossibleRound - minPossibleRound || 1;
  const sliderLeftPercent = ((minRound - minPossibleRound) / totalSpan) * 100;
  const sliderRightPercent = 100 - ((maxRound - minPossibleRound) / totalSpan) * 100;

  const currentMinEvent = roundsList.find((r) => r.round_number === minRound);
  const currentMaxEvent = roundsList.find((r) => r.round_number === maxRound);

  // =========================================================================
  // SUB-COMPONENTES VISUAIS
  // =========================================================================

  // 1. Barra de Controle Superior (Switcher de Abas, Status e Toggle de Layout)
  const topControlBar = (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111118] border border-white/10 rounded-xl p-4">
      {/* Abas Pilotos / Construtores + Badge de Etapa */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center rounded-lg bg-black/50 p-0.5 border border-white/10 font-mono text-xs font-bold uppercase">
          <button
            onClick={() => setActiveTab("drivers")}
            className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${activeTab === "drivers"
              ? "bg-f1-red text-white"
              : "text-white/60 hover:text-white"
              }`}
          >
            Pilotos
          </button>
          <button
            onClick={() => setActiveTab("constructors")}
            className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${activeTab === "constructors"
              ? "bg-f1-red text-white"
              : "text-white/60 hover:text-white"
              }`}
          >
            Construtores
          </button>
        </div>

        <span className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-mono font-bold text-white/80">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          R{maxRound} {currentMaxEvent ? `(${currentMaxEvent.displayName})` : ""}
        </span>
      </div>

      {/* Alternância de Disposição (Lado a Lado vs Expandido) + Reset */}
      <div className="flex items-center gap-2">
        {(minRound > minPossibleRound || maxRound < maxPossibleRound) && (
          <button
            onClick={() => applyPreset(minPossibleRound, maxPossibleRound)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide bg-white/5 text-f1-subtle hover:text-white hover:bg-white/10 transition-colors border border-white/10"
            title="Resetar para a temporada completa"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Resetar Filtro</span>
          </button>
        )}

        <div className="flex items-center rounded-lg bg-black/50 p-0.5 border border-white/10 text-xs font-mono">
          <button
            onClick={() => setLayoutMode("side")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${layoutMode === "side"
              ? "bg-white/20 text-white"
              : "text-white/50 hover:text-white"
              }`}
            title="Visualização lado a lado (Tabela + Painel de Análise)"
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Lado a Lado</span>
          </button>
          <button
            onClick={() => setLayoutMode("full")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${layoutMode === "full"
              ? "bg-white/20 text-white"
              : "text-white/50 hover:text-white"
              }`}
            title="Tabela de classificação em largura total"
          >
            <Rows className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Tabela Completa</span>
          </button>
        </div>
      </div>
    </div>
  );

  // 2. Card de Filtro de Rodadas (Compacto, Modular e Funcional)
  const filterCard = (
    <div className="rounded-xl border border-white/10 bg-[#111118] p-5 space-y-4">
      {/* Header do Filtro */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-f1-red" />
          <div>
            <h3 className="text-sm font-mono font-bold uppercase text-white tracking-wider">
              Recorte de Rodadas
            </h3>
            <p className="text-[11px] text-f1-subtle font-medium">
              R{minRound} a R{maxRound} ({maxRound - minRound + 1} de {roundsList.length} GPs)
            </p>
          </div>
        </div>

        {minRound === minPossibleRound && maxRound === maxPossibleRound ? (
          <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider">
            Ano Completo
          </span>
        ) : (
          <span className="font-mono text-[10px] text-amber-300 uppercase tracking-wider">
            Filtrado
          </span>
        )}
      </div>

      {/* Presets Rápidos em Linha */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => applyPreset(minPossibleRound, maxPossibleRound)}
          className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-wide transition-colors cursor-pointer ${minRound === minPossibleRound && maxRound === maxPossibleRound
            ? "bg-white/20 text-white border border-white/20"
            : "bg-white/5 text-f1-subtle hover:text-white hover:bg-white/10 border border-white/5"
            }`}
        >
          Temporada
        </button>
        <button
          onClick={() => applyPreset(1, Math.max(1, Math.floor(maxPossibleRound / 2)))}
          className="px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-wide bg-white/5 text-f1-subtle hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
        >
          1ª Metade
        </button>
        <button
          onClick={() => applyPreset(Math.floor(maxPossibleRound / 2) + 1, maxPossibleRound)}
          className="px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-wide bg-white/5 text-f1-subtle hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
        >
          2ª Metade
        </button>
        <button
          onClick={() => applyPreset(Math.max(minPossibleRound, maxPossibleRound - 4), maxPossibleRound)}
          className="px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-wide bg-white/5 text-f1-subtle hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
        >
          Últimos 5
        </button>
      </div>

      {/* Steppers de Início e Fim organizados em Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {/* Min Stepper Card */}
        <div className="flex items-center gap-2 rounded-xl bg-black/60 border border-white/10 p-1.5 shadow-inner min-w-0">
          <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5 flex-shrink-0">
            <button
              onClick={() => setMinRound(Math.max(minPossibleRound, minRound - 1))}
              disabled={minRound <= minPossibleRound}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="GP Anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono tabular-nums text-xs font-black text-white w-8 text-center select-none">
              R{minRound}
            </span>
            <button
              onClick={() => setMinRound(Math.min(maxRound, minRound + 1))}
              disabled={minRound >= maxRound}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Próximo GP"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="min-w-0 flex-1 pr-1">
            <p className="text-[9px] uppercase font-black text-f1-subtle leading-none">Início</p>
            <p className="text-xs font-bold text-white truncate mt-0.5" title={currentMinEvent?.displayName || `GP ${minRound}`}>
              {currentMinEvent?.displayName || `GP ${minRound}`}
            </p>
          </div>
        </div>

        {/* Max Stepper Card */}
        <div className="flex items-center gap-2 rounded-xl bg-black/60 border border-white/10 p-1.5 shadow-inner min-w-0">
          <div className="flex items-center bg-f1-red/10 rounded-lg border border-f1-red/20 p-0.5 flex-shrink-0">
            <button
              onClick={() => setMaxRound(Math.max(minRound, maxRound - 1))}
              disabled={maxRound <= minRound}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-f1-red/20 text-white/70 hover:text-white disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="GP Anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono tabular-nums text-xs font-black text-f1-red w-8 text-center select-none">
              R{maxRound}
            </span>
            <button
              onClick={() => setMaxRound(Math.min(maxPossibleRound, maxRound + 1))}
              disabled={maxRound >= maxPossibleRound}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-f1-red/20 text-white/70 hover:text-white disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Próximo GP"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="min-w-0 flex-1 pr-1">
            <p className="text-[9px] uppercase font-black text-f1-red/80 leading-none">Final</p>
            <p className="text-xs font-bold text-white truncate mt-0.5" title={currentMaxEvent?.displayName || `GP ${maxRound}`}>
              {currentMaxEvent?.displayName || `GP ${maxRound}`}
            </p>
          </div>
        </div>
      </div>

      {/* Dual-Thumb Range Slider */}
      <div className="relative pt-2 pb-2">
        {/* Track e Barra Colorida Ativa */}
        <div className="relative h-7 flex items-center">
          <div className="absolute left-[7px] right-[7px] h-2 rounded-full bg-white/10" />
          <div
            className="absolute h-2 bg-gradient-to-r from-f1-red via-red-500 to-amber-500 rounded-full transition-all"
            style={{
              left: `calc(7px + (100% - 14px) * ${(minRound - minPossibleRound) / totalSpan})`,
              width: `calc((100% - 14px) * ${(maxRound - minRound) / totalSpan})`
            }}
          />

          <input
            type="range"
            min={minPossibleRound}
            max={maxPossibleRound}
            value={minRound}
            onMouseDown={() => setActiveThumb("min")}
            onTouchStart={() => setActiveThumb("min")}
            onChange={handleMinChange}
            className="range-slider-input absolute inset-0 w-full h-full cursor-pointer"
            style={{
              zIndex: activeThumb === "min" ? 30 : minRound > maxPossibleRound * 0.6 ? 26 : 22
            }}
          />

          <input
            type="range"
            min={minPossibleRound}
            max={maxPossibleRound}
            value={maxRound}
            onMouseDown={() => setActiveThumb("max")}
            onTouchStart={() => setActiveThumb("max")}
            onChange={handleMaxChange}
            className="range-slider-input absolute inset-0 w-full h-full cursor-pointer"
            style={{
              zIndex: activeThumb === "max" ? 30 : 24
            }}
          />
        </div>

        {/* Marcadores de Etapas perfeitamente alinhados ao centro de cada etapa */}
        <div className="relative w-full h-8 mt-2 select-none">
          {roundsList.map((r) => {
            const inRange = r.round_number >= minRound && r.round_number <= maxRound;
            const isBoundary = r.round_number === minRound || r.round_number === maxRound;
            const fraction = (r.round_number - minPossibleRound) / totalSpan;

            return (
              <button
                key={r.round_number}
                onClick={() => {
                  if (Math.abs(r.round_number - minRound) < Math.abs(r.round_number - maxRound)) {
                    setMinRound(r.round_number);
                  } else {
                    setMaxRound(r.round_number);
                  }
                }}
                style={{
                  left: `calc(7px + (100% - 14px) * ${fraction})`
                }}
                className={`absolute -translate-x-1/2 flex flex-col items-center group transition-colors cursor-pointer ${isBoundary
                    ? "text-f1-red font-black"
                    : inRange
                      ? "text-white"
                      : "text-f1-subtle hover:text-white"
                  }`}
                title={`R${r.round_number}: ${r.displayName}`}
              >
                <span
                  className={`h-1 w-1 rounded-full mb-1 transition-transform group-hover:scale-150 ${isBoundary
                      ? "bg-f1-red ring-2 ring-f1-red/40 scale-125"
                      : inRange
                        ? "bg-white/50"
                        : "bg-white/10"
                    }`}
                />
                <span className="text-[9px] font-mono tabular-nums">R{r.round_number}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // 3. Card do Gráfico de Evolução do Top 5
  const chartCard = (
    <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-f1-red" />
          <h3 className="text-sm font-black uppercase text-white tracking-tight">
            Evolução do Top 5 {activeTab === "drivers" ? "Pilotos" : "Construtores"}
          </h3>
        </div>

        {/* Toggle de Visualização: Pontos do Campeonato vs Apenas Período */}
        <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/10 text-[11px]">
          <button
            onClick={() => setChartMetric("championship")}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${chartMetric === "championship" ? "bg-white/15 text-white" : "text-white/50 hover:text-white"
              }`}
          >
            Campeonato
          </button>
          <button
            onClick={() => setChartMetric("period")}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${chartMetric === "period" ? "bg-white/15 text-white" : "text-white/50 hover:text-white"
              }`}
          >
            No Período
          </button>
        </div>
      </div>

      {/* Gráfico Recharts Top 5 */}
      <div className={layoutMode === "side" ? "h-[280px] w-full pt-1" : "h-[330px] w-full pt-1"}>
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "drivers" ? (
            <LineChart data={chartDriversData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252538" />
              <XAxis dataKey="round" stroke="#8E8EA0" fontSize={10} tickMargin={6} />
              <YAxis stroke="#8E8EA0" fontSize={10} domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#171723",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  fontSize: 11,
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"
                }}
                labelFormatter={(value, payload) => payload[0]?.payload?.eventName || value}
                formatter={(val: any, name: any) => [`${val} pts`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                formatter={(value) => <span className="text-white/80 font-semibold">{value}</span>}
              />
              {driverLineConfigs.map((cfg) => (
                <Line
                  key={cfg.name}
                  type="monotone"
                  dataKey={cfg.name}
                  name={cfg.name}
                  stroke={cfg.color}
                  strokeWidth={2.5}
                  strokeDasharray={cfg.dash}
                  dot={{ r: 3, strokeWidth: 1.5, stroke: "#14141F", fill: cfg.color }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2, fill: cfg.color }}
                />
              ))}
            </LineChart>
          ) : (
            <LineChart data={chartTeamsData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252538" />
              <XAxis dataKey="round" stroke="#8E8EA0" fontSize={10} tickMargin={6} />
              <YAxis stroke="#8E8EA0" fontSize={10} domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#171723",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  fontSize: 11,
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"
                }}
                labelFormatter={(value, payload) => payload[0]?.payload?.eventName || value}
                formatter={(val: any, name: any) => [`${val} pts`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                formatter={(value) => <span className="text-white/80 font-semibold">{value}</span>}
              />
              {top5Constructors.map((c) => {
                const color = formatHexColor(c.team_color);
                return (
                  <Line
                    key={c.team_name}
                    type="monotone"
                    dataKey={c.team_name}
                    name={c.team_name}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1.5, stroke: "#14141F", fill: color }}
                    activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2, fill: color }}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );

  // 5. Tabela de Classificação Mundial (Pilotos / Construtores)
  const standingsTable = (
    <div className="rounded-2xl border border-white/10 bg-[#0B0B10] p-5 sm:p-6 shadow-xl space-y-4">
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-lg font-black uppercase text-white tracking-tight">
          Classificação Mundial {activeTab === "drivers" ? "de Pilotos" : "de Construtores"}
        </h2>
        <p className="text-xs text-f1-subtle font-medium">
          {minRound === minPossibleRound && maxRound === maxPossibleRound
            ? "Pontuação acumulada, vitórias, pódios e classificação oficial da temporada."
            : `Pontuação acumulada até a R${maxRound}. Vitórias, pódios e pontos refletem o recorte (R${minRound} a R${maxRound}).`}
        </p>
      </div>

      {/* Tabela de Pilotos */}
      {activeTab === "drivers" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold text-f1-subtle uppercase tracking-wider">
                <th rowSpan={2} className="pb-3 w-8 text-center align-bottom border-b border-white/10">Pos</th>
                <th rowSpan={2} className="pb-3 w-8 text-center align-bottom border-b border-white/10">+/-</th>
                <th rowSpan={2} className="pb-3 pr-4 align-bottom border-b border-white/10 min-w-[160px]">Piloto</th>
                <th rowSpan={2} className="pb-3 px-4 hidden sm:table-cell align-bottom border-b border-white/10 text-center">Nac</th>
                <th rowSpan={2} className="pb-3 px-4 hidden md:table-cell align-bottom border-b border-white/10 min-w-[130px]">Equipe</th>
                <th rowSpan={2} className="pb-3 px-2 text-center align-bottom border-b border-white/10 whitespace-nowrap">Última (R{maxRound})</th>
                {minRound > 1 && (
                  <th rowSpan={2} className="pb-2.5 px-2 text-center text-amber-400/90 hidden sm:table-cell align-bottom border-b border-white/10 leading-tight">
                    <span className="block text-[11px] font-bold">No Período</span>
                    <span className="block text-[10px] font-mono text-amber-400/70 font-semibold mt-0.5">
                      (R{minRound}-R{maxRound})
                    </span>
                  </th>
                )}
                <th colSpan={2} className="pb-1.5 px-2 text-center hidden md:table-cell border-b border-white/10 text-white/90">
                  Vitórias
                </th>
                <th colSpan={2} className="pb-1.5 px-2 text-center hidden md:table-cell border-b border-l border-white/10 text-white/90">
                  Pódios
                </th>
                <th rowSpan={2} className="pb-3 pl-3 text-right align-bottom border-b border-white/10 min-w-[90px]">Total Acumulado</th>
              </tr>
              <tr className="border-b border-white/10 text-[10px] font-bold tracking-wider uppercase">
                <th className="pt-1 pb-2 text-center hidden md:table-cell text-white/70 w-14 min-w-[52px]">GP</th>
                <th className="pt-1 pb-2 text-center hidden md:table-cell text-purple-400 w-14 min-w-[52px]">Sprint</th>
                <th className="pt-1 pb-2 text-center hidden md:table-cell text-white/70 w-14 min-w-[52px] border-l border-white/10">GP</th>
                <th className="pt-1 pb-2 text-center hidden md:table-cell text-purple-400 w-14 min-w-[52px]">Sprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDrivers.map((d, index) => {
                const pointsPercent = maxDriverPoints > 0 ? Math.round((d.total_points / maxDriverPoints) * 100) : 0;
                const isLeader = index === 0;

                return (
                  <tr key={d.driver_full_name} className="group hover:bg-white/[0.02] transition-colors">
                    {/* Posição no Campeonato */}
                    <td className="py-2.5 text-center">
                      <span className={`font-mono tabular-nums text-xs font-black ${isLeader
                          ? "text-amber-400"
                          : index === 1
                            ? "text-slate-300"
                            : index === 2
                              ? "text-amber-600/90"
                              : "text-white/40"
                        }`}>
                        {d.championship_position}
                      </span>
                    </td>

                    {/* Variação de Posição */}
                    <td className="py-2.5 text-center">
                      {d.position_delta > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-mono tabular-nums font-bold text-emerald-400">
                          <ArrowUp className="h-3 w-3" />
                          {d.position_delta}
                        </span>
                      ) : d.position_delta < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-mono tabular-nums font-bold text-rose-400">
                          <ArrowDown className="h-3 w-3" />
                          {Math.abs(d.position_delta)}
                        </span>
                      ) : (
                        <span className="text-xs text-white/30 font-mono tabular-nums">
                          <Minus className="h-3 w-3 inline" />
                        </span>
                      )}
                    </td>

                    {/* Piloto e Foto */}
                    <td className="py-2.5 pr-4 min-w-[160px]">
                      <div className="flex items-center gap-2.5">
                        <DriverLink
                          driverId={d.driver_id}
                          driverName={d.driver_full_name}
                          className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 transition-transform hover:scale-105"
                          title={`Ver perfil de ${d.driver_full_name}`}
                        >
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
                            <div className="flex h-full w-full items-center justify-center font-black text-[10px] text-f1-subtle">
                              {d.driver_full_name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </DriverLink>
                        <div className="min-w-0">
                          <DriverLink
                            driverId={d.driver_id}
                            driverName={d.driver_full_name}
                            className="font-bold text-white text-xs sm:text-sm hover:text-white hover:underline decoration-white/30 transition-colors flex items-center gap-1.5 truncate"
                            title={`Ver perfil de ${d.driver_full_name}`}
                          >
                            <span>{d.driver_full_name}</span>
                            {index < 5 && (
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: formatHexColor(d.team_color) }} />
                            )}
                          </DriverLink>
                          <TeamLink teamName={d.team_name} className="block md:hidden">
                            <span className="text-[11px] text-f1-subtle block truncate hover:underline hover:text-white transition-colors">{d.team_name || "F1 Team"}</span>
                          </TeamLink>
                        </div>
                      </div>
                    </td>

                    {/* Nacionalidade */}
                    <td className="py-2.5 px-4 text-center hidden sm:table-cell text-xs font-mono text-f1-subtle whitespace-nowrap">
                      {d.driver_nationality || "INT"}
                    </td>

                    {/* Equipe com indicador de cor */}
                    <td className="py-2.5 px-4 hidden md:table-cell min-w-[130px]">
                      <TeamLink teamName={d.team_name} className="flex items-center gap-2 whitespace-nowrap group/team">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: formatHexColor(d.team_color) }}
                        />
                        <span className="text-xs font-semibold text-white/90 truncate max-w-[130px] group-hover/team:text-white group-hover/team:underline">
                          {d.team_name || "—"}
                        </span>
                      </TeamLink>
                    </td>

                    {/* Pontos Conquistados na Última Etapa */}
                    <td className="py-2.5 px-2 text-center font-mono tabular-nums font-bold text-xs whitespace-nowrap">
                      {d.pts_in_last_round > 0 ? (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          +{d.pts_in_last_round}
                        </span>
                      ) : (
                        <span className="text-white/30">0</span>
                      )}
                    </td>

                    {/* Pontos no Período Selecionado */}
                    {minRound > 1 && (
                      <td className="py-2.5 px-2 text-center font-mono tabular-nums font-bold text-xs text-amber-300 hidden sm:table-cell whitespace-nowrap">
                        +{d.pts_in_period}
                      </td>
                    )}

                    {/* Vitórias no período - GP */}
                    <td className="py-2.5 text-center hidden md:table-cell font-mono tabular-nums text-xs font-bold text-white w-14 min-w-[52px]">
                      {d.race_wins_in_period > 0 ? d.race_wins_in_period : <span className="text-white/20">0</span>}
                    </td>

                    {/* Vitórias no período - Sprint */}
                    <td className="py-2.5 text-center hidden md:table-cell font-mono tabular-nums text-xs font-bold text-purple-300 w-14 min-w-[52px]">
                      {d.sprint_wins_in_period > 0 ? d.sprint_wins_in_period : <span className="text-white/20">0</span>}
                    </td>

                    {/* Pódios no período - GP */}
                    <td className="py-2.5 text-center hidden md:table-cell font-mono tabular-nums text-xs font-bold text-white w-14 min-w-[52px] border-l border-white/5">
                      {d.race_podiums_in_period > 0 ? d.race_podiums_in_period : <span className="text-white/20">0</span>}
                    </td>

                    {/* Pódios no período - Sprint */}
                    <td className="py-2.5 text-center hidden md:table-cell font-mono tabular-nums text-xs font-bold text-purple-300 w-14 min-w-[52px]">
                      {d.sprint_podiums_in_period > 0 ? d.sprint_podiums_in_period : <span className="text-white/20">0</span>}
                    </td>

                    {/* Pontos Totais Acumulados no Campeonato */}
                    <td className="py-2.5 pl-3 text-right">
                      <span className="font-black text-white text-sm font-mono tabular-nums">{d.total_points}</span>
                      <div className="mt-1 w-18 ml-auto h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pointsPercent}%`,
                            backgroundColor: formatHexColor(d.team_color)
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

      {/* Tabela de Construtores */}
      {activeTab === "constructors" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold text-f1-subtle uppercase tracking-wider">
                <th rowSpan={2} className="pb-3 w-8 text-center align-bottom border-b border-white/10">Pos</th>
                <th rowSpan={2} className="pb-3 w-8 text-center align-bottom border-b border-white/10">+/-</th>
                <th rowSpan={2} className="pb-3 px-3 align-bottom border-b border-white/10 min-w-[160px]">Equipe / Construtor</th>
                <th rowSpan={2} className="pb-3 px-2 text-center align-bottom border-b border-white/10 whitespace-nowrap">Última (R{maxRound})</th>
                {minRound > 1 && (
                  <th rowSpan={2} className="pb-2.5 px-2 text-center text-amber-400/90 hidden sm:table-cell align-bottom border-b border-white/10 leading-tight">
                    <span className="block text-[11px] font-bold">No Período</span>
                    <span className="block text-[10px] font-mono text-amber-400/70 font-semibold mt-0.5">
                      (R{minRound}-R{maxRound})
                    </span>
                  </th>
                )}
                <th colSpan={2} className="pb-1.5 px-2 text-center hidden md:table-cell border-b border-white/10 text-white/90">
                  Vitórias
                </th>
                <th colSpan={2} className="pb-1.5 px-2 text-center hidden md:table-cell border-b border-l border-white/10 text-white/90">
                  Pódios
                </th>
                <th rowSpan={2} className="pb-3 pl-3 text-right align-bottom border-b border-white/10 min-w-[90px]">Total Acumulado</th>
              </tr>
              <tr className="border-b border-white/10 text-[10px] font-bold tracking-wider uppercase">
                <th className="pt-1 pb-2 text-center hidden md:table-cell text-white/70 w-14 min-w-[52px]">GP</th>
                <th className="pt-1 pb-2 text-center hidden md:table-cell text-purple-400 w-14 min-w-[52px]">Sprint</th>
                <th className="pt-1 pb-2 text-center hidden md:table-cell text-white/70 w-14 min-w-[52px] border-l border-white/10">GP</th>
                <th className="pt-1 pb-2 text-center hidden md:table-cell text-purple-400 w-14 min-w-[52px]">Sprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredConstructors.map((c, index) => {
                const pointsPercent = maxConstructorPoints > 0 ? Math.round((c.total_points / maxConstructorPoints) * 100) : 0;
                const isLeader = index === 0;

                return (
                  <tr key={c.team_name} className="group hover:bg-white/[0.02] transition-colors">
                    {/* Posição */}
                    <td className="py-2.5 text-center">
                      <span className={`font-mono tabular-nums text-xs font-black ${isLeader
                          ? "text-amber-400"
                          : index === 1
                            ? "text-slate-300"
                            : index === 2
                              ? "text-amber-600/90"
                              : "text-white/40"
                        }`}>
                        {c.championship_position}
                      </span>
                    </td>

                    {/* Variação de Posição */}
                    <td className="py-2.5 text-center">
                      {c.position_delta > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-mono tabular-nums font-bold text-emerald-400">
                          <ArrowUp className="h-3 w-3" />
                          {c.position_delta}
                        </span>
                      ) : c.position_delta < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-mono tabular-nums font-bold text-rose-400">
                          <ArrowDown className="h-3 w-3" />
                          {Math.abs(c.position_delta)}
                        </span>
                      ) : (
                        <span className="text-xs text-white/30 font-mono tabular-nums">
                          <Minus className="h-3 w-3 inline" />
                        </span>
                      )}
                    </td>

                    {/* Nome com Pill da Cor */}
                    <td className="py-2.5 px-3 min-w-[160px]">
                      <TeamLink teamName={c.team_name} className="flex items-center gap-3 group/constructor">
                        <div
                          className="h-6 w-1.5 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: formatHexColor(c.team_color) }}
                        />
                        <span className="font-bold text-white text-xs sm:text-sm group-hover/constructor:text-white group-hover/constructor:underline transition-colors truncate">
                          {c.team_name}
                        </span>
                      </TeamLink>
                    </td>

                    {/* Pontos Conquistados na Última Etapa */}
                    <td className="py-2.5 px-2 text-center font-mono tabular-nums font-bold text-xs whitespace-nowrap">
                      {c.pts_in_last_round > 0 ? (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          +{c.pts_in_last_round}
                        </span>
                      ) : (
                        <span className="text-white/30">0</span>
                      )}
                    </td>

                    {/* Pontos no Período Selecionado */}
                    {minRound > 1 && (
                      <td className="py-2.5 px-2 text-center font-mono tabular-nums font-bold text-xs text-amber-300 hidden sm:table-cell whitespace-nowrap">
                        +{c.pts_in_period}
                      </td>
                    )}

                    {/* Vitórias no período - GP */}
                    <td className="py-2.5 text-center hidden md:table-cell font-mono tabular-nums text-xs font-bold text-white w-14 min-w-[52px]">
                      {c.race_wins_in_period > 0 ? c.race_wins_in_period : <span className="text-white/20">0</span>}
                    </td>

                    {/* Vitórias no período - Sprint */}
                    <td className="py-2.5 text-center hidden md:table-cell font-mono tabular-nums text-xs font-bold text-purple-300 w-14 min-w-[52px]">
                      {c.sprint_wins_in_period > 0 ? c.sprint_wins_in_period : <span className="text-white/20">0</span>}
                    </td>

                    {/* Pódios no período - GP */}
                    <td className="py-2.5 text-center hidden md:table-cell font-mono tabular-nums text-xs font-bold text-white w-14 min-w-[52px] border-l border-white/5">
                      {c.race_podiums_in_period > 0 ? c.race_podiums_in_period : <span className="text-white/20">0</span>}
                    </td>

                    {/* Pódios no período - Sprint */}
                    <td className="py-2.5 text-center hidden md:table-cell font-mono tabular-nums text-xs font-bold text-purple-300 w-14 min-w-[52px]">
                      {c.sprint_podiums_in_period > 0 ? c.sprint_podiums_in_period : <span className="text-white/20">0</span>}
                    </td>

                    {/* Pontos Totais Acumulados no Campeonato */}
                    <td className="py-2.5 pl-3 text-right">
                      <span className="font-black text-white text-sm font-mono tabular-nums">{c.total_points}</span>
                      <div className="mt-1 w-18 ml-auto h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pointsPercent}%`,
                            backgroundColor: formatHexColor(c.team_color)
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

  // =========================================================================
  // RENDERIZAÇÃO FINAL: DISPOSIÇÃO MODULAR
  // =========================================================================
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Barra de Controles Superiores */}
      {topControlBar}

      {/* 2. Grid de Conteúdo */}
      {layoutMode === "side" ? (
        /* VISÃO LADO A LADO: Tabela ampliada à esquerda + Painel de Análise à direita */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Tabela de Classificação como Visão Primária (8 colunas) */}
          <div className="xl:col-span-8 2xl:col-span-8">
            {standingsTable}
          </div>

          {/* Painel Lateral: Filtro de Rodadas + Gráfico Top 5 (4 colunas) */}
          <div className="xl:col-span-4 2xl:col-span-4 space-y-6 xl:sticky xl:top-6">
            {filterCard}
            {chartCard}
          </div>
        </div>
      ) : (
        /* VISÃO EXPANDIDA: Tabela em largura total no topo, Filtro e Gráfico lado a lado abaixo */
        <div className="space-y-6">
          <div>
            {standingsTable}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-5 space-y-6">
              {filterCard}
            </div>
            <div className="xl:col-span-7">
              {chartCard}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
