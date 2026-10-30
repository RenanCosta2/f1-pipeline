import { Suspense } from "react";
import {
  getCircuitsCatalog,
  getSeasonRacesSummary,
  getLatestCompletedRound,
  getLatestSeasonYear
} from "@/lib/db";
import CircuitsCatalogView from "@/components/circuits/CircuitsCatalogView";
import CircuitsSpotlightStrip from "@/components/circuits/CircuitsSpotlightStrip";
import { MapPin, Flag, Trophy } from "lucide-react";

export const revalidate = 120; // Cache de 2 minutos no Edge da Vercel (ISR)

export default async function CircuitsPage() {
  const latestYear = await getLatestSeasonYear();
  const [circuits, seasonRaces, latestCompleted] = await Promise.all([
    getCircuitsCatalog(),
    getSeasonRacesSummary(latestYear),
    getLatestCompletedRound(latestYear)
  ]);

  const lastRace =
    seasonRaces.find((r) => r.round_number === latestCompleted) ||
    seasonRaces[seasonRaces.length - 1] ||
    null;

  const nextRace =
    seasonRaces.find((r) => r.round_number === latestCompleted + 1) ||
    seasonRaces[0] ||
    null;

  const totalCircuits = circuits.length;
  const totalCountries = new Set(circuits.map((c) => c.country).filter(Boolean)).size;
  const active2026Count = circuits.filter((c) => {
    if (c.years_held && Array.isArray(c.years_held)) {
      return c.years_held.includes(2026);
    }
    if (c.seasons_list) {
      return c.seasons_list.includes("2026");
    }
    return c.last_gp_year === 2026;
  }).length;
  const totalGps = circuits.reduce((acc, c) => acc + (c.total_gps_completed || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header Executivo da Página de Circuitos */}
      <div className="border-b border-f1-border/50 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-f1-red/30 bg-f1-red/10 px-3 py-1 text-xs font-bold text-f1-red uppercase tracking-wider mb-2">
              <MapPin className="h-3.5 w-3.5" /> Central de Circuitos • F1 Analytics
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
              Autódromos & Circuitos da F1
            </h1>
            <p className="text-sm text-f1-subtle mt-1.5 max-w-3xl font-medium">
              Explore o histórico de autódromos, recordes de volta oficiais, histórico de edições dos Grandes Prêmios e estatísticas completas de cada piloto em cada pista.
            </p>
          </div>

          {/* Badges Rápidas com Totais Consolidados (4 Badges) */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            <div className="rounded-xl border border-white/10 bg-[#12121A] px-3 py-2 text-center min-w-[70px]">
              <span className="block text-[10px] font-bold uppercase text-f1-subtle">Circuitos</span>
              <span className="text-base font-black text-white font-mono">{totalCircuits}</span>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-center min-w-[70px]">
              <span className="block text-[10px] font-bold uppercase text-blue-400">Países</span>
              <span className="text-base font-black text-blue-400 font-mono">{totalCountries}</span>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center min-w-[70px]">
              <span className="block text-[10px] font-bold uppercase text-emerald-400">Ativos 2026</span>
              <span className="text-base font-black text-emerald-400 font-mono">{active2026Count}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#12121A] px-3 py-2 text-center min-w-[70px]">
              <span className="block text-[10px] font-bold uppercase text-f1-subtle">GPs</span>
              <span className="text-base font-black text-white font-mono">{totalGps}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Régua Spotlight: Próximo GP vs Último GP Concluído */}
      <CircuitsSpotlightStrip
        upcomingRace={nextRace}
        lastRace={lastRace}
      />

      {/* Catálogo Interativo com Busca e Filtros */}
      <Suspense fallback={<div className="h-96 rounded-2xl bg-[#0B0B10] border border-white/5 animate-pulse" />}>
        <CircuitsCatalogView circuits={circuits} />
      </Suspense>
    </div>
  );
}
