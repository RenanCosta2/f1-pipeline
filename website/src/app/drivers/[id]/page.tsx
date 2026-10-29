import { Suspense } from "react";
import { notFound } from "next/navigation";
import { 
  getDriverProfile, 
  getDriverSeasons, 
  getDriverCircuits, 
  getDriverRaceLog 
} from "@/lib/db";
import DriverProfileHero from "@/components/drivers/DriverProfileHero";
import DriverProfileTabs from "@/components/drivers/DriverProfileTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: {
    id: string;
  };
}

export default async function DriverProfilePage({ params }: Props) {
  const requestedId = params.id;

  // Busca o perfil do piloto primeiro para obter seu ID canônico
  const profile = await getDriverProfile(requestedId);

  if (!profile) {
    notFound();
  }

  const driverId = profile.driver_id;

  // Busca todos os dados analíticos do piloto em paralelo usando o ID canônico
  const [seasons, circuits, raceLog] = await Promise.all([
    getDriverSeasons(driverId),
    getDriverCircuits(driverId),
    getDriverRaceLog(driverId)
  ]);

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Hero Card Unificado: Identificação, Foto, Equipe, Títulos e Raio-X de Carreira */}
      <DriverProfileHero profile={profile} />

      {/* 2. Abas Analíticas: Temporadas / Circuitos / Race Log Corrida a Corrida */}
      <Suspense fallback={<div className="h-96 rounded-2xl bg-[#0B0B10] border border-white/5 animate-pulse" />}>
        <DriverProfileTabs 
          profile={profile} 
          seasons={seasons} 
          circuits={circuits} 
          raceLog={raceLog} 
        />
      </Suspense>
    </div>
  );
}
