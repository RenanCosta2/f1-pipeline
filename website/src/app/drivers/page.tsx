import { Suspense } from "react";
import { getDriversCatalog, getDriverStandings, getLatestSeasonYear } from "@/lib/db";
import DriversCatalogView from "@/components/drivers/DriversCatalogView";
import DriversSpotlightStrip from "@/components/drivers/DriversSpotlightStrip";
import { Users, Trophy, Flag, Sparkles } from "lucide-react";

export const revalidate = 120; // Cache de 2 minutos no Edge da Vercel (ISR)

export default async function DriversPage() {
  const latestYear = await getLatestSeasonYear();
  const [drivers, standings] = await Promise.all([
    getDriversCatalog(),
    getDriverStandings(latestYear)
  ]);

  const currentLeader = standings && standings.length > 0 ? standings[0] : null;
  const historicLeader =
    [...drivers]
      .filter((d) => d.total_world_championships > 0)
      .sort((a, b) => b.total_world_championships - a.total_world_championships || b.total_wins - a.total_wins)[0] || null;

  const totalDrivers = drivers.length;
  const worldChampionsCount = drivers.filter((d) => d.total_world_championships > 0).length;
  const totalVictories = drivers.reduce((acc, d) => acc + d.total_wins, 0);

  return (
    <div className="space-y-5">
      {/* Header Executivo da Página de Pilotos */}
      <div className="border-b border-f1-border/50 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-f1-red/30 bg-f1-red/10 px-3 py-1 text-xs font-bold text-f1-red uppercase tracking-wider mb-2">
              <Users className="h-3.5 w-3.5" /> Central de Pilotos • F1 Analytics
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
              Galeria de Pilotos da Fórmula 1
            </h1>
            <p className="text-sm text-f1-subtle mt-1.5 max-w-3xl font-medium">
              Explore o histórico de carreira, títulos mundiais, vitórias, pódios e métricas detalhadas de cada piloto da era moderna da Fórmula 1 (2013–2026).
            </p>
          </div>

          {/* Badges Rápidas com Totais Consolidados */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <div className="rounded-xl border border-white/10 bg-[#12121A] px-3.5 py-2 text-center">
              <span className="block text-[10px] font-bold uppercase text-f1-subtle">Pilotos</span>
              <span className="text-base font-black text-white font-mono">{totalDrivers}</span>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-center">
              <span className="block text-[10px] font-bold uppercase text-amber-400">Campeões</span>
              <span className="text-base font-black text-amber-400 font-mono">{worldChampionsCount}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#12121A] px-3.5 py-2 text-center">
              <span className="block text-[10px] font-bold uppercase text-f1-subtle">Vitórias</span>
              <span className="text-base font-black text-white font-mono">{totalVictories}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Régua Spotlight: Líder Atual (2026) vs Maior Campeão da História */}
      <DriversSpotlightStrip
        currentLeader={currentLeader}
        historicLeader={historicLeader}
        seasonYear={latestYear}
      />

      {/* Catálogo Interativo com Busca e Filtros */}
      <Suspense fallback={<div className="h-96 rounded-2xl bg-[#0B0B10] border border-white/5 animate-pulse" />}>
        <DriversCatalogView drivers={drivers} />
      </Suspense>
    </div>
  );
}
