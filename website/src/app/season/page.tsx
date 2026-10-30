import { Suspense } from "react";
import {
  getDriverStandings,
  getConstructorStandings,
  getCumulativeDrivers,
  getCumulativeTeams,
  getSeasonRacesSummary,
  getSeasonMatrix,
  getLatestSeasonYear,
  getAvailableYears
} from "@/lib/db";
import SeasonTabsView from "@/components/SeasonTabsView";
import { Trophy } from "lucide-react";

interface Props {
  searchParams?: {
    year?: string;
    tab?: "standings" | "matrix" | "races";
  };
}

export const revalidate = 60; // Cache de 1 minuto no Edge da Vercel (ISR)

export default async function SeasonPage({ searchParams }: Props) {
  const [defaultYear, availableYears] = await Promise.all([
    getLatestSeasonYear(),
    getAvailableYears()
  ]);
  const year = searchParams?.year ? parseInt(searchParams.year) : defaultYear;
  const initialTab = searchParams?.tab || "standings";

  const [drivers, constructors, cumulativeDrivers, cumulativeTeams, races, matrixData] = await Promise.all([
    getDriverStandings(year),
    getConstructorStandings(year),
    getCumulativeDrivers(year),
    getCumulativeTeams(year),
    getSeasonRacesSummary(year),
    getSeasonMatrix(year)
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-f1-border/50 pb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
          <Trophy className="h-3.5 w-3.5" /> Temporada Oficial {year}
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">
          Campeonato Mundial de Fórmula 1 ({year})
        </h1>
        <p className="text-sm text-f1-subtle mt-1 font-medium">
          Central oficial da temporada: acompanhe a classificação, a matriz completa de resultados de cada etapa e os Grandes Prêmios.
        </p>
      </div>

      {/* Navegador de Abas da Temporada (Classificação & Evolução / Matriz de Resultados / Grandes Prêmios) */}
      <Suspense fallback={<div className="h-96 rounded-2xl bg-[#0B0B10] border border-white/5 animate-pulse" />}>
        <SeasonTabsView
          year={year}
          availableYears={availableYears}
          drivers={drivers}
          constructors={constructors}
          cumulativeDrivers={cumulativeDrivers}
          cumulativeTeams={cumulativeTeams}
          races={races}
          matrixData={matrixData}
          initialTab={initialTab}
        />
      </Suspense>
    </div>
  );
}
