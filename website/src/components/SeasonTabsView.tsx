"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trophy, Flag, Calendar, Table2 } from "lucide-react";
import SeasonStandingsExplorer from "@/components/SeasonStandingsExplorer";
import SeasonRacesList from "@/components/SeasonRacesList";
import SeasonMatrixView from "@/components/SeasonMatrixView";
import {
  DriverStanding,
  ConstructorStanding,
  CumulativeDriverPoint,
  CumulativeTeamPoint,
  SeasonRaceSummary,
  SeasonMatrixItem
} from "@/types/f1";

interface SeasonTabsViewProps {
  year: number;
  availableYears: number[];
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
  cumulativeDrivers: CumulativeDriverPoint[];
  cumulativeTeams: CumulativeTeamPoint[];
  races: SeasonRaceSummary[];
  matrixData: SeasonMatrixItem[];
  initialTab?: "standings" | "matrix" | "races";
}

export default function SeasonTabsView({
  year,
  availableYears,
  drivers,
  constructors,
  cumulativeDrivers,
  cumulativeTeams,
  races,
  matrixData,
  initialTab = "standings"
}: SeasonTabsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState<"standings" | "matrix" | "races">(initialTab);

  React.useEffect(() => {
    const tabParam = searchParams?.get("tab") as "standings" | "matrix" | "races" | null;
    if (tabParam && ["standings", "matrix", "races"].includes(tabParam)) {
      setCurrentTab(tabParam);
    } else {
      setCurrentTab("standings");
    }
  }, [searchParams]);

  const setTab = (tab: "standings" | "matrix" | "races") => {
    setCurrentTab(tab);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", tab);
    router.replace(`/season?${params.toString()}`, { scroll: false });
  };

  const setYear = (newYear: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("year", newYear.toString());
    router.push(`/season?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior de Controles: Seletor de Abas & Seletor de Ano */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/10 pb-3 sm:pb-4">
        {/* Seletor de Abas da Temporada: Classificação, Matriz, GPs */}
        {/* No mobile: grid de 3 colunas compactas com min-h-[44px] para ergonomia de toque; sm+: inline flex */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 rounded-xl border border-white/10 bg-[#0B0B10] p-1 sm:p-1.5 shadow-lg w-full sm:w-auto">
          <button
            onClick={() => setTab("standings")}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 rounded-lg px-2 sm:px-3.5 py-2.5 sm:py-2 min-h-[44px] text-[11px] sm:text-sm font-bold tracking-tight transition-all duration-200 text-center active:scale-95 ${currentTab === "standings"
                ? "bg-f1-red text-white shadow-md shadow-f1-red/30"
                : "text-f1-subtle hover:bg-white/5 hover:text-white"
              }`}
          >
            <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="sm:hidden">Classif.</span>
            <span className="hidden sm:inline">Classificação & Evolução</span>
          </button>

          <button
            onClick={() => setTab("matrix")}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 rounded-lg px-2 sm:px-3.5 py-2.5 sm:py-2 min-h-[44px] text-[11px] sm:text-sm font-bold tracking-tight transition-all duration-200 text-center active:scale-95 ${currentTab === "matrix"
                ? "bg-f1-red text-white shadow-md shadow-f1-red/30"
                : "text-f1-subtle hover:bg-white/5 hover:text-white"
              }`}
          >
            <Table2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="sm:hidden">Matriz</span>
            <span className="hidden sm:inline">Matriz de Resultados</span>
          </button>

          <button
            onClick={() => setTab("races")}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 rounded-lg px-2 sm:px-3.5 py-2.5 sm:py-2 min-h-[44px] text-[11px] sm:text-sm font-bold tracking-tight transition-all duration-200 text-center active:scale-95 ${currentTab === "races"
                ? "bg-f1-red text-white shadow-md shadow-f1-red/30"
                : "text-f1-subtle hover:bg-white/5 hover:text-white"
              }`}
          >
            <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="sm:hidden">GPs</span>
            <span className="hidden sm:inline">Grandes Prêmios</span>
            <span
              className={`rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[9px] sm:text-[10px] font-black ${currentTab === "races"
                  ? "bg-black/30 text-white"
                  : "bg-white/10 text-f1-subtle"
                }`}
            >
              {races.length}
            </span>
          </button>
        </div>

        {/* Seletor de Temporada (Ano) */}
        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-f1-subtle" />
            <span className="text-xs font-semibold text-f1-subtle">Temporada:</span>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="rounded-lg border border-white/15 bg-[#12121A] px-3.5 py-2 min-h-[44px] text-base sm:text-xs font-bold text-white shadow-inner outline-none transition-colors hover:border-white/30 focus:border-f1-red"
          >
            {availableYears.map((y) => (
              <option key={y} value={y} className="bg-[#12121A] text-white">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {currentTab === "matrix" ? (
        <SeasonMatrixView matrixData={matrixData} year={year} />
      ) : currentTab === "races" ? (
        <SeasonRacesList races={races} selectedYear={year} />
      ) : (
        <SeasonStandingsExplorer
          year={year}
          availableYears={availableYears}
          initialDrivers={drivers}
          initialConstructors={constructors}
          cumulativeDrivers={cumulativeDrivers}
          cumulativeTeams={cumulativeTeams}
        />
      )}
    </div>
  );
}
