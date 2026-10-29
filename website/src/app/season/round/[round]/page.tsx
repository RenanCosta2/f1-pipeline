import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getLatestSeasonYear,
  getSeasonRacesSummary,
  getAvailableSessions,
  getSessionSummary,
  getTyreStrategies,
  getRacePace,
  getLapByLap,
  getMaxSpeed,
  getIdealLap
} from "@/lib/db";
import GrandPrixWeekendExplorer from "@/components/GrandPrixWeekendExplorer";
import CircuitLink from "@/lib/circuitUtils";
import { ArrowLeft, Clock3, MapPin, Calendar, ArrowUpRight } from "lucide-react";

interface Props {
  params: {
    round: string;
  };
  searchParams?: {
    year?: string;
    session?: string;
  };
}

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "Data a definir";
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const day = match[3];
    const month = MONTHS_PT[parseInt(match[2], 10) - 1] || match[2];
    const year = match[1];
    return `${day} de ${month} de ${year}`;
  }
  return String(dateStr);
}

export default async function GrandPrixDetailsPage({ params, searchParams }: Props) {
  const roundNumber = parseInt(params.round, 10);
  if (isNaN(roundNumber) || roundNumber <= 0) {
    notFound();
  }

  const defaultYear = await getLatestSeasonYear();
  const year = searchParams?.year ? parseInt(searchParams.year, 10) : defaultYear;

  // Busca metadados dos GPs da temporada
  const seasonRaces = await getSeasonRacesSummary(year);
  const currentRace = seasonRaces.find((r) => Number(r.round_number) === roundNumber);

  if (!currentRace) {
    notFound();
  }

  // Busca sessões disponíveis para esta rodada
  const availableSessions = await getAvailableSessions(year, roundNumber);

  // Se a rodada ainda não tiver nenhuma sessão realizada ou registrada no banco:
  if (availableSessions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl py-6 px-2 space-y-6">
        <div>
          <Link
            href={`/season?year=${year}&tab=races`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-f1-subtle hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Lista de Grandes Prêmios ({year})
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#12121A] to-[#0A0A0F] p-8 sm:p-12 text-center shadow-2xl space-y-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto">
            <Clock3 className="h-8 w-8" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="rounded-md bg-f1-red px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-wider text-white">
                Round {String(roundNumber).padStart(2, "0")}
              </span>
              <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Corrida Agendada
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
              {currentRace.official_event_name || `${currentRace.country} Grand Prix`}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-f1-subtle pt-1">
              <CircuitLink
                circuitId={currentRace.circuit_id}
                circuitName={currentRace.circuit_name || currentRace.location}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
                title={`Ver perfil do circuito ${currentRace.circuit_name || currentRace.location}`}
              >
                <MapPin className="h-3.5 w-3.5 text-f1-red" />
                <span className="hover:underline">{currentRace.location ? `${currentRace.location}, ${currentRace.country}` : currentRace.country}</span>
              </CircuitLink>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                {formatDisplayDate(currentRace.event_date)}
              </span>
            </div>
          </div>

          <div className="max-w-md mx-auto rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-f1-subtle leading-relaxed">
            Esta etapa ainda não foi realizada. Os dados de classificação oficial, ritmo de corrida, telemetria e estratégias de pneus estarão disponíveis aqui assim que as sessões forem finalizadas e processadas pelo pipeline.
          </div>

          <div className="pt-2">
            <CircuitLink
              circuitId={currentRace.circuit_id}
              circuitName={currentRace.circuit_name || currentRace.location}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:border-white/25 transition-all group shadow-sm"
              title={`Ver traçado, histórico e recordes do circuito ${currentRace.circuit_name}`}
            >
              <span>Conhecer Circuito & Histórico</span>
              <ArrowUpRight className="h-4 w-4 text-f1-red group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </CircuitLink>
          </div>
        </div>
      </div>
    );
  }

  // Define sessão ativa (padrão: Race se disponível, senão a última executada ou primeira)
  let activeSession = searchParams?.session;
  if (!activeSession || !availableSessions.includes(activeSession)) {
    activeSession = availableSessions.includes("Race")
      ? "Race"
      : availableSessions[availableSessions.length - 1] || "Practice 1";
  }

  // Busca resultados da sessão ativa
  const isRaceOrSprint = activeSession === "Race" || activeSession === "Sprint";
  const [sessionResults, tyreStrategies, racePace, lapData, maxSpeed, idealLapsRaw] = await Promise.all([
    getSessionSummary(year, roundNumber, activeSession),
    isRaceOrSprint ? getTyreStrategies(year, roundNumber, activeSession) : Promise.resolve([]),
    isRaceOrSprint ? getRacePace(year, roundNumber, activeSession) : Promise.resolve([]),
    isRaceOrSprint ? getLapByLap(year, roundNumber, activeSession) : Promise.resolve([]),
    isRaceOrSprint ? getMaxSpeed(year, roundNumber, activeSession) : Promise.resolve([]),
    !isRaceOrSprint ? getIdealLap(year, roundNumber, activeSession) : Promise.resolve([])
  ]);

  // Enriquecer idealLaps com fotos e cores das equipes a partir dos resultados da sessão
  const driverMetadataMap = new Map<string, { headshot: string | null; teamColor: string | null }>();
  sessionResults.forEach((s) => {
    driverMetadataMap.set(s.driver_full_name, {
      headshot: s.driver_headshot_url || null,
      teamColor: s.team_color || null
    });
  });

  const idealLaps = idealLapsRaw.map((lap) => {
    const meta = driverMetadataMap.get(lap.driver_full_name);
    return {
      ...lap,
      driver_headshot_url: meta?.headshot || null,
      team_color: meta?.teamColor || null
    };
  });

  return (
    <div className="mx-auto max-w-7xl py-2">
      <Suspense fallback={<div className="h-96 rounded-2xl bg-[#0B0B10] border border-white/5 animate-pulse" />}>
        <GrandPrixWeekendExplorer
          year={year}
          round={roundNumber}
          officialEventName={currentRace.official_event_name}
          country={currentRace.country}
          location={currentRace.location}
          eventDate={currentRace.event_date}
          circuitId={currentRace.circuit_id}
          circuitName={currentRace.circuit_name}
          availableSessions={availableSessions}
          activeSession={activeSession}
          sessionResults={sessionResults}
          tyreStrategies={tyreStrategies}
          racePace={racePace}
          lapData={lapData}
          maxSpeed={maxSpeed}
          idealLaps={idealLaps}
          raceStatus={currentRace.race_status}
        />
      </Suspense>
    </div>
  );
}
