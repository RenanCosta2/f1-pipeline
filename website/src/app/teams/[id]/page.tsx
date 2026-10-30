import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getConstructorProfile,
  getConstructorSeasons,
  getConstructorDrivers,
  getConstructorRaceLog
} from "@/lib/db";
import ConstructorProfileHero from "@/components/constructors/ConstructorProfileHero";
import ConstructorProfileTabs from "@/components/constructors/ConstructorProfileTabs";

export const revalidate = 120; // Cache de 2 minutos no Edge da Vercel (ISR)

interface Props {
  params: {
    id: string;
  };
}

export default async function TeamProfilePage({ params }: Props) {
  const requestedId = params.id;

  // Busca o perfil da equipe primeiro para obter o team_id canônico e o team_name
  const profile = await getConstructorProfile(requestedId);

  if (!profile) {
    notFound();
  }

  const teamId = profile.team_id;
  const teamName = profile.team_name;

  // Busca todos os dados analíticos históricos da equipe em paralelo
  const [seasons, drivers, raceLog] = await Promise.all([
    getConstructorSeasons(teamId),
    getConstructorDrivers(teamId),
    getConstructorRaceLog(teamName)
  ]);

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Hero Card Unificado da Equipe: Identificação, Cor, Títulos de Construtores e Raio-X de KPIs */}
      <ConstructorProfileHero profile={profile} />

      {/* 2. Abas Analíticas: Pilotos da História / Temporada a Temporada / Registro Corrida a Corrida */}
      <Suspense fallback={<div className="h-96 rounded-2xl bg-[#0B0B10] border border-white/5 animate-pulse" />}>
        <ConstructorProfileTabs
          profile={profile}
          seasons={seasons}
          drivers={drivers}
          raceLog={raceLog}
        />
      </Suspense>
    </div>
  );
}
