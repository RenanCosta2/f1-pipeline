import {
  getDriverStandings,
  getConstructorStandings,
  getSessionSummary,
  getUpcomingRaceInfo,
  getLatestSeasonYear,
  getLatestCompletedRound,
  getActiveWeekendInfo
} from "@/lib/db";
import ApexF1Hub from "@/components/hub/ApexF1Hub";

interface Props {
  searchParams?: {
    year?: string;
    mode?: "weekend" | "between";
    round?: string;
    test_waiting?: string;
  };
}
export default async function HomePage({ searchParams }: Props) {
  // A visão geral exibe sempre os dados da temporada mais recente ativa
  const year = await getLatestSeasonYear();

  // Executa a busca da última rodada e do fim de semana ativo em paralelo
  const [latestCompleted, activeWeekendInfo] = await Promise.all([
    getLatestCompletedRound(year),
    getActiveWeekendInfo(year)
  ]);

  // Permite override de rodada via query param ou usa a rodada ativa do fim de semana
  const weekendRound = searchParams?.round ? parseInt(searchParams.round) : activeWeekendInfo.round;
  const nextRound = latestCompleted + 1;

  // Evita requisições duplicadas caso a rodada ativa seja a mesma da próxima corrida
  const upcomingRacePromise = getUpcomingRaceInfo(year, nextRound);
  const weekendRacePromise = weekendRound === nextRound ? upcomingRacePromise : getUpcomingRaceInfo(year, weekendRound);

  // Fetch real data in parallel directly from Supabase / dbt views
  const [drivers, constructors, lastRaceResults, upcomingRace, weekendRace] = await Promise.all([
    getDriverStandings(year),
    getConstructorStandings(year),
    getSessionSummary(year, latestCompleted, "Race"),
    upcomingRacePromise,
    weekendRacePromise
  ]);

  // Permite testar visualmente o estado "Aguardando dados" via ?test_waiting=true
  if (searchParams?.test_waiting === "true" && weekendRace?.sessions) {
    weekendRace.sessions = weekendRace.sessions.map((sess, idx) => {
      if (idx === 1) {
        return { ...sess, completed: false, waiting_data: true, leader: undefined };
      }
      return sess;
    });
  }

  // Se o fim de semana estiver ativo (a partir de 3 dias antes do TL1 até o término do GP),
  // o Hub abre por padrão na aba "Fim de Semana", caso o usuário não tenha forçado outro modo.
  const initialMode = searchParams?.mode || (activeWeekendInfo.isLiveWeekend ? "weekend" : "between");

  return (
    <ApexF1Hub
      drivers={drivers}
      constructors={constructors}
      lastRaceResults={lastRaceResults}
      upcomingRace={upcomingRace}
      weekendRace={weekendRace}
      initialMode={initialMode}
      year={year}
    />
  );
}
