import { Suspense } from "react";
import { getConstructorsCatalog, getConstructorStandings, getLatestSeasonYear } from "@/lib/db";
import ConstructorsCatalogView from "@/components/constructors/ConstructorsCatalogView";
import ConstructorsSpotlightStrip from "@/components/constructors/ConstructorsSpotlightStrip";
import { Shield, Trophy, Flag } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamsPage() {
  const latestYear = await getLatestSeasonYear();
  const [constructors, standings] = await Promise.all([
    getConstructorsCatalog(),
    getConstructorStandings(latestYear)
  ]);

  const currentLeader = standings && standings.length > 0 ? standings[0] : null;
  const historicLeader =
    [...constructors]
      .filter((c) => c.total_world_championships > 0)
      .sort((a, b) => b.total_world_championships - a.total_world_championships || b.total_wins - a.total_wins)[0] || null;

  const totalTeams = constructors.length;
  const worldChampionsCount = constructors.filter((c) => c.total_world_championships > 0).length;
  const totalVictories = constructors.reduce((acc, c) => acc + c.total_wins, 0);

  return (
    <div className="space-y-5">
      {/* Header Executivo da Página de Construtores / Equipes */}
      <div className="border-b border-f1-border/50 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-f1-red/30 bg-f1-red/10 px-3 py-1 text-xs font-bold text-f1-red uppercase tracking-wider mb-2">
              <Shield className="h-3.5 w-3.5" /> Central de Construtores • F1 Analytics
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
              Galeria de Equipes da Fórmula 1
            </h1>
            <p className="text-sm text-f1-subtle mt-1.5 max-w-3xl font-medium">
              Explore o legado histórico, títulos mundiais de construtores, vitórias, dobradinhas e os pilotos lendários de cada escuderia da Fórmula 1 moderna.
            </p>
          </div>

          {/* Badges Rápidas com Totais Consolidados */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <div className="rounded-xl border border-white/10 bg-[#12121A] px-3.5 py-2 text-center">
              <span className="block text-[10px] font-bold uppercase text-f1-subtle">Equipes</span>
              <span className="text-base font-black text-white font-mono">{totalTeams}</span>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-center">
              <span className="block text-[10px] font-bold uppercase text-amber-400">Campeãs</span>
              <span className="text-base font-black text-amber-400 font-mono">{worldChampionsCount}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#12121A] px-3.5 py-2 text-center">
              <span className="block text-[10px] font-bold uppercase text-f1-subtle">Vitórias</span>
              <span className="text-base font-black text-white font-mono">{totalVictories}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Régua Spotlight: Líder de Construtores (2026) vs Maior Campeã da História */}
      <ConstructorsSpotlightStrip
        currentLeader={currentLeader}
        historicLeader={historicLeader}
        seasonYear={latestYear}
      />

      {/* Catálogo Interativo com Busca e Filtros */}
      <Suspense fallback={<div className="h-96 rounded-2xl bg-[#0B0B10] border border-white/5 animate-pulse" />}>
        <ConstructorsCatalogView constructors={constructors} />
      </Suspense>
    </div>
  );
}
