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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Seletor de Abas da Temporada: Classificação, Matriz, GPs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0B0B10] p-1.5 shadow-lg overflow-x-auto">
          <button
            onClick={() => setTab("standings")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 shrink-0 ${
              currentTab === "standings"
                ? "bg-f1-red text-white shadow-md shadow-f1-red/30"
                : "text-f1-subtle hover:bg-white/5 hover:text-white"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Classificação & Evolução</span>
          </button>

          <button
            onClick={() => setTab("matrix")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 shrink-0 ${
              currentTab === "matrix"
                ? "bg-f1-red text-white shadow-md shadow-f1-red/30"
                : "text-f1-subtle hover:bg-white/5 hover:text-white"
            }`}
          >
            <Table2 className="h-4 w-4" />
            <span>Matriz de Resultados</span>
          </button>

          <button
            onClick={() => setTab("races")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 shrink-0 ${
              currentTab === "races"
                ? "bg-f1-red text-white shadow-md shadow-f1-red/30"
                : "text-f1-subtle hover:bg-white/5 hover:text-white"
            }`}
          >
            <Flag className="h-4 w-4" />
            <span>Grandes Prêmios</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                currentTab === "races"
                  ? "bg-black/30 text-white"
                  : "bg-white/10 text-f1-subtle"
              }`}
            >
              {races.length}
            </span>
          </button>
        </div>

        {/* Seletor de Temporada (Ano) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Calendar className="h-4 w-4 text-f1-subtle" />
          <span className="text-xs font-semibold text-f1-subtle">Temporada:</span>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="rounded-lg border border-white/15 bg-[#12121A] px-3 py-1.5 text-xs font-bold text-white shadow-inner outline-none transition-colors hover:border-white/30 focus:border-f1-red"
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
