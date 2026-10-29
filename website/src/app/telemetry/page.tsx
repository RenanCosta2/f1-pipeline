import Link from "next/link";
import {
  getMaxSpeed,
  getIdealLap,
  getLatestSeasonYear,
  getLatestCompletedRound,
  getAvailableRounds,
  getTelemetrySessions
} from "@/lib/db";
import SpeedTrapChart from "@/components/SpeedTrapChart";
import IdealLapCard from "@/components/IdealLapCard";
import DriverLink from "@/lib/driverUtils";
import { TeamLink } from "@/lib/teamUtils";
import { Gauge, Zap, Timer, Target, Sparkles, ArrowUpRight } from "lucide-react";

interface Props {
  searchParams?: {
    year?: string;
    round?: string;
    session?: string;
  };
}

export default async function TelemetryPage({ searchParams }: Props) {
  const defaultYear = await getLatestSeasonYear();
  const year = searchParams?.year ? parseInt(searchParams.year) : defaultYear;

  const defaultRound = await getLatestCompletedRound(year);
  const round = searchParams?.round ? parseInt(searchParams.round) : defaultRound;

  const availableSessions = await getTelemetrySessions(year, round);
  // Default to Qualifying if available, as telemetry (ideal laps) is most meaningful there; otherwise first session or Race
  const defaultSession = availableSessions.includes("Qualifying")
    ? "Qualifying"
    : availableSessions.includes("Race")
    ? "Race"
    : availableSessions[0] || "Qualifying";

  const session = searchParams?.session && availableSessions.includes(searchParams.session)
    ? searchParams.session
    : defaultSession;

  const [speedData, idealLapData, availableRounds] = await Promise.all([
    getMaxSpeed(year, round, session),
    getIdealLap(year, round, session),
    getAvailableRounds(year)
  ]);

  const topSpeedEntry = speedData[0];
  const fastestLapEntry = [...idealLapData].sort((a, b) => (a.lap_time || "9:99") > (b.lap_time || "9:99") ? 1 : -1)[0];
  const mostEfficientEntry = idealLapData.find((d) => d.delta_ideal_lap === "0:00.000" || d.delta_ideal_lap === "0:00:000") || idealLapData[0];

  const sessionDisplayMap: { [key: string]: string } = {
    Qualifying: "Classificação Oficial",
    Race: "Corrida (Grand Prix)",
    "Practice 1": "Treino Livre 1 (FP1)",
    "Practice 2": "Treino Livre 2 (FP2)",
    "Practice 3": "Treino Livre 3 (FP3)",
    Sprint: "Sprint Race",
    "Sprint Qualifying": "Sprint Qualifying",
    "Sprint Shootout": "Sprint Shootout"
  };

  return (
    <div className="space-y-10">
      {/* Header with Round & Session Selectors */}
      <div className="border-b border-f1-border/50 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
            <Gauge className="h-3.5 w-3.5" /> Performance & Telemetria • {year} • Round {round}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
            Telemetria e Velocidades Máximas
          </h1>
          <p className="text-sm text-f1-subtle mt-1 font-medium">
            Velocidades de ponta nos sensores oficiais de radar e análise da volta ideal teórica (S1 + S2 + S3).
          </p>

          {/* Session Switcher */}
          {availableSessions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-xs font-bold text-f1-subtle uppercase">Sessão:</span>
              <div className="inline-flex flex-wrap rounded-lg bg-[#14141F] p-1 border border-white/10 gap-1">
                {availableSessions.map((s) => (
                  <Link
                    key={s}
                    href={`/telemetry?year=${year}&round=${round}&session=${s}`}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      session === s
                        ? "bg-purple-600 text-white shadow"
                        : "text-f1-subtle hover:text-white"
                    }`}
                  >
                    {sessionDisplayMap[s] || s}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Round Selector Chips */}
        {availableRounds && availableRounds.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 max-w-md">
            {availableRounds.map((rnd) => (
              <Link
                key={rnd.round_number}
                href={`/telemetry?year=${year}&round=${rnd.round_number}${session ? `&session=${session}` : ""}`}
                className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all ${
                  rnd.round_number === round
                    ? "bg-purple-600 text-white border-purple-600 shadow"
                    : "bg-[#14141F] text-f1-subtle border-f1-border hover:text-white hover:border-white/20"
                }`}
                title={rnd.official_event_name}
              >
                R{rnd.round_number}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* KPI Cards Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Speed Card */}
        <div className="rounded-xl border border-f1-border bg-[#14141F] p-5">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rei da Velocidade (Top Speed)</span>
            <div className="flex items-center gap-1.5">
              {topSpeedEntry && (
                <DriverLink
                  driverName={topSpeedEntry.driver_full_name}
                  className="inline-flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20 hover:text-white transition-all group"
                  title={`Ver perfil de ${topSpeedEntry.driver_full_name}`}
                >
                  Perfil
                  <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </DriverLink>
              )}
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {topSpeedEntry?.max_speed_trap ? `${Number(topSpeedEntry.max_speed_trap).toFixed(1)} km/h` : "—"}
          </div>
          <div className="text-xs text-f1-subtle font-medium mt-1">
            {topSpeedEntry ? (
              <span className="inline-flex items-center gap-1 flex-wrap">
                <DriverLink
                  driverName={topSpeedEntry.driver_full_name}
                  className="font-bold text-white hover:text-f1-red transition-colors"
                  title={`Ver perfil de ${topSpeedEntry.driver_full_name}`}
                >
                  {topSpeedEntry.driver_full_name}
                </DriverLink>
                <span>(</span>
                <TeamLink
                  teamName={topSpeedEntry.team_name}
                  className="hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                  title={`Ver perfil de ${topSpeedEntry.team_name}`}
                >
                  {topSpeedEntry.team_name}
                </TeamLink>
                <span>)</span>
              </span>
            ) : (
              "Aguardando dados"
            )}
          </div>
        </div>

        {/* Fastest Real Lap Card */}
        <div className="rounded-xl border border-f1-border bg-[#14141F] p-5">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Volta Mais Rápida da Sessão</span>
            <div className="flex items-center gap-1.5">
              {fastestLapEntry && (
                <DriverLink
                  driverName={fastestLapEntry.driver_full_name}
                  className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all group"
                  title={`Ver perfil de ${fastestLapEntry.driver_full_name}`}
                >
                  Perfil
                  <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </DriverLink>
              )}
              <Timer className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {fastestLapEntry?.lap_time || "—"}
          </div>
          <div className="text-xs text-f1-subtle font-medium mt-1">
            {fastestLapEntry ? (
              <span className="inline-flex items-center gap-1 flex-wrap">
                <DriverLink
                  driverName={fastestLapEntry.driver_full_name}
                  className="font-bold text-white hover:text-f1-red transition-colors"
                  title={`Ver perfil de ${fastestLapEntry.driver_full_name}`}
                >
                  {fastestLapEntry.driver_full_name}
                </DriverLink>
                <span>(</span>
                <TeamLink
                  teamName={fastestLapEntry.team_name}
                  className="hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                  title={`Ver perfil de ${fastestLapEntry.team_name}`}
                >
                  {fastestLapEntry.team_name}
                </TeamLink>
                <span>)</span>
              </span>
            ) : (
              "Aguardando dados"
            )}
          </div>
        </div>

        {/* Most Efficient Lap Card */}
        <div className="rounded-xl border border-f1-border bg-[#14141F] p-5">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Volta Mais Eficiente (100%)</span>
            <div className="flex items-center gap-1.5">
              {mostEfficientEntry && (
                <DriverLink
                  driverName={mostEfficientEntry.driver_full_name}
                  className="inline-flex items-center gap-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all group"
                  title={`Ver perfil de ${mostEfficientEntry.driver_full_name}`}
                >
                  Perfil
                  <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </DriverLink>
              )}
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {mostEfficientEntry?.delta_ideal_lap === "0:00:000" || mostEfficientEntry?.delta_ideal_lap === "0:00.000"
              ? "0.000s"
              : `+${mostEfficientEntry?.delta_ideal_lap || "0.000s"}`}
          </div>
          <div className="text-xs text-f1-subtle font-medium mt-1">
            {mostEfficientEntry ? (
              <span className="inline-flex items-center gap-1 flex-wrap">
                <DriverLink
                  driverName={mostEfficientEntry.driver_full_name}
                  className="font-bold text-white hover:text-f1-red transition-colors"
                  title={`Ver perfil de ${mostEfficientEntry.driver_full_name}`}
                >
                  {mostEfficientEntry.driver_full_name}
                </DriverLink>
                <span>(</span>
                <TeamLink
                  teamName={mostEfficientEntry.team_name}
                  className="hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                  title={`Ver perfil de ${mostEfficientEntry.team_name}`}
                >
                  {mostEfficientEntry.team_name}
                </TeamLink>
                <span>)</span>
              </span>
            ) : (
              "Aguardando dados"
            )}
          </div>
        </div>
      </div>

      {/* Speed Trap Radar Chart */}
      <SpeedTrapChart data={speedData} />

      {/* Theoretical Best Lap Card */}
      <IdealLapCard data={idealLapData} />
    </div>
  );
}
