import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getCircuitOverview,
  getCircuitSeasons,
  getCircuitDrivers,
  getCircuitTeams
} from "@/lib/db";
import CircuitProfileHero from "@/components/circuits/CircuitProfileHero";
import CircuitProfileTabs from "@/components/circuits/CircuitProfileTabs";

export const revalidate = 1800; // ISR: HTML em cache no Edge por 30 min (stale-while-revalidate)

// Nada é pré-renderizado no build: cada perfil é gerado no primeiro acesso e depois servido do cache (ISR).
export async function generateStaticParams() {
  return [];
}

interface Props {
  params: {
    id: string;
  };
}

export default async function CircuitProfilePage({ params }: Props) {
  const requestedId = params.id;

  const overview = await getCircuitOverview(requestedId);

  if (!overview) {
    notFound();
  }

  const circuitId = overview.circuit_id;

  // Busca dados de edições, pilotos e equipes em paralelo
  const [seasons, drivers, teams] = await Promise.all([
    getCircuitSeasons(circuitId),
    getCircuitDrivers(circuitId),
    getCircuitTeams(circuitId)
  ]);

  return (
    <div className="space-y-5 pb-12">
      {/* Hero com Identificação, Bandeira, KPIs e Recordes de Pista */}
      <CircuitProfileHero overview={overview} />

      {/* Abas: Visão Geral / Edições de Temporada / Histórico de Pilotos */}
      <Suspense fallback={<div className="h-96 rounded-2xl bg-[#0B0B10] border border-white/5 animate-pulse" />}>
        <CircuitProfileTabs
          overview={overview}
          seasons={seasons}
          drivers={drivers}
          teams={teams}
        />
      </Suspense>
    </div>
  );
}
