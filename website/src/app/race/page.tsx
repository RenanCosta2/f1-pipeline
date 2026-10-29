import Link from "next/link";
import {
  getSessionSummary,
  getTyreStrategies,
  getLapByLap,
  getRacePace,
  getLatestSeasonYear,
  getLatestCompletedRound,
  getAvailableRounds,
  getAvailableSessions
} from "@/lib/db";
import TyreStrategyChart from "@/components/TyreStrategyChart";
import LapChart from "@/components/LapChart";
import RacePaceChart from "@/components/RacePaceChart";
import DriverLink from "@/lib/driverUtils";
import { TeamLink } from "@/lib/teamUtils";
import { Flag, ArrowUp, ArrowDown, Minus, CheckCircle, Timer } from "lucide-react";

interface Props {
  searchParams?: {
    year?: string;
    round?: string;
    session?: string;
  };
}

export default async function RacePage({ searchParams }: Props) {
  const defaultYear = await getLatestSeasonYear();
  const year = searchParams?.year ? parseInt(searchParams.year) : defaultYear;

  const defaultRound = await getLatestCompletedRound(year);
  const round = searchParams?.round ? parseInt(searchParams.round) : defaultRound;

  const availableSessions = await getAvailableSessions(year, round);
  const session = searchParams?.session && availableSessions.includes(searchParams.session)
    ? searchParams.session
    : "Race";

  const [results, tyreData, lapData, paceData, availableRounds] = await Promise.all([
    getSessionSummary(year, round, session),
    getTyreStrategies(year, round, session),
    getLapByLap(year, round, session),
    getRacePace(year, round, session),
    getAvailableRounds(year)
  ]);

  const raceName = results[0]?.official_event_name || `Grand Prix - Round ${round}`;
  const maxLapsInResults = Math.max(...results.map((r) => r.laps_completed || 0), 0);
  const totalLaps = maxLapsInResults > 0 ? maxLapsInResults : 60;

  // Find driver with the fastest lap in this session
  const validLaps = results.filter((r) => r.best_lap && r.best_lap.trim() !== "");
  const sortedLaps = [...validLaps].sort((a, b) => (a.best_lap! > b.best_lap! ? 1 : -1));
  const fastestLap = sortedLaps[0]?.best_lap;

  return (
    <div className="space-y-10">
      {/* Race Header with Round & Session Selector */}
      <div className="border-b border-f1-border/50 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-f1-red/30 bg-f1-red/10 px-3 py-1 text-xs font-bold text-f1-red uppercase tracking-wider mb-2">
            <Flag className="h-3.5 w-3.5" /> Temporada {year} • Round {round}
            {session === "Sprint" && <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[10px]">SPRINT</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
            {raceName}
          </h1>
          <p className="text-sm text-f1-subtle mt-1 font-medium">
            Classificação oficial, posições ganhas/perdidas, estratégias de pneus e telemetria de ritmo de prova.
          </p>

          {/* Session Switcher (if round has Sprint) */}
          {availableSessions.length > 1 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-bold text-f1-subtle uppercase">Sessão:</span>
              <div className="inline-flex rounded-lg bg-[#14141F] p-1 border border-white/10">
                {availableSessions.map((s) => (
                  <Link
                    key={s}
                    href={`/race?year=${year}&round=${round}&session=${s}`}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      session === s
                        ? "bg-f1-red text-white shadow"
                        : "text-f1-subtle hover:text-white"
                    }`}
                  >
                    {s === "Race" ? "Grande Prêmio (Corrida)" : s === "Sprint" ? "Corrida Sprint" : s === "Qualifying" ? "Qualificação" : s}
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
                href={`/race?year=${year}&round=${rnd.round_number}${session !== "Race" ? `&session=${session}` : ""}`}
                className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all ${
                  rnd.round_number === round
                    ? "bg-f1-red text-white border-f1-red shadow"
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

      {/* Official Results Table */}
      <div className="rounded-2xl border border-f1-border bg-[#14141F] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            Resultado Oficial {session === "Sprint" ? "da Sprint" : "da Corrida"}
          </h3>
          <span className="text-xs font-mono text-f1-subtle font-medium">
            {results.length} pilotos classificados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-f1-border/40 text-[11px] font-bold text-f1-subtle uppercase tracking-wider">
                <th className="pb-3 w-12 text-center">Pos</th>
                <th className="pb-3 w-12 text-center">Grid</th>
                <th className="pb-3 w-14 text-center">+/-</th>
                <th className="pb-3">Piloto</th>
                <th className="pb-3 hidden md:table-cell">Equipe</th>
                <th className="pb-3 text-right">Gap Líder</th>
                <th className="pb-3 text-right hidden lg:table-cell">Intervalo</th>
                <th className="pb-3 text-center">Voltas</th>
                <th className="pb-3 text-center">Stops</th>
                <th className="pb-3 text-center hidden sm:table-cell">Status</th>
                <th className="pb-3 text-right">Melhor Volta</th>
                <th className="pb-3 text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-f1-border/20 text-xs">
              {results.map((r, index) => {
                const delta = r.delta_position || 0;
                const isWinner = index === 0;
                const isRetired = r.status && !["Finished", "+1 Lap", "+2 Laps", "+3 Laps", "+4 Laps", "+5 Laps", "+6 Laps", "Lapped"].includes(r.status);
                const isFastestLap = Boolean(r.best_lap && r.best_lap === fastestLap);

                return (
                  <tr key={r.driver_full_name} className="hover:bg-white/[0.02] transition-colors">
                    {/* Position */}
                    <td className="py-3 text-center font-black">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                        isWinner ? "bg-amber-400 text-black" :
                        index === 1 ? "bg-slate-300 text-black" :
                        index === 2 ? "bg-amber-700 text-white" :
                        isRetired ? "border border-red-500/40 text-red-400 bg-red-500/10 text-[10px]" :
                        "text-white"
                      }`}>
                        {isRetired ? "RET" : (r.finishing_position ?? "—")}
                      </span>
                    </td>

                    {/* Grid */}
                    <td className="py-3 text-center font-mono text-f1-subtle">
                      {r.grid_position ? `P${r.grid_position}` : "PL"}
                    </td>

                    {/* Delta */}
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center gap-0.5 font-bold font-mono text-xs ${
                        delta > 0 ? "text-emerald-400" :
                        delta < 0 ? "text-red-400" :
                        "text-f1-subtle"
                      }`}>
                        {delta > 0 ? <ArrowUp className="h-3 w-3 stroke-[3]" /> :
                         delta < 0 ? <ArrowDown className="h-3 w-3 stroke-[3]" /> :
                         <Minus className="h-3 w-3 text-f1-subtle" />}
                        {Math.abs(delta)}
                      </span>
                    </td>

                    {/* Driver */}
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <DriverLink
                          driverName={r.driver_full_name}
                          driverId={r.driver_id}
                          className="font-bold text-white text-sm hover:text-f1-red transition-colors"
                          title={`Ver perfil de ${r.driver_full_name}`}
                        >
                          {r.driver_full_name}
                        </DriverLink>
                        {r.driver_number && (
                          <span className="text-[10px] font-mono font-bold text-f1-subtle">#{r.driver_number}</span>
                        )}
                      </div>
                      <TeamLink
                        teamName={r.team_name}
                        className="text-[11px] text-f1-subtle md:hidden block hover:underline hover:text-white transition-colors"
                        title={`Ver perfil de ${r.team_name}`}
                      >
                        {r.team_name}
                      </TeamLink>
                    </td>

                    {/* Team */}
                    <td className="py-3 hidden md:table-cell text-f1-subtle font-medium">
                      <TeamLink
                        teamName={r.team_name}
                        className="hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                        title={`Ver perfil de ${r.team_name}`}
                      >
                        {r.team_name}
                      </TeamLink>
                    </td>

                    {/* Gap to Leader */}
                    <td className="py-3 text-right font-mono text-white/90">
                      {r.gap_to_leader || (index === 0 ? "Leader" : "—")}
                    </td>

                    {/* Interval to Car Ahead */}
                    <td className="py-3 text-right font-mono text-f1-subtle hidden lg:table-cell">
                      {r.interval_to_car_ahead || (index === 0 ? "-" : "—")}
                    </td>

                    {/* Laps */}
                    <td className="py-3 text-center font-mono text-white/90">
                      {r.laps_completed ?? "—"}
                    </td>

                    {/* Stops */}
                    <td className="py-3 text-center font-mono text-white/90">
                      {r.stops ?? 0}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 text-center hidden sm:table-cell">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        r.status === "Finished"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : r.status?.includes("Lap") || r.status === "Lapped"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {r.status || "Finished"}
                      </span>
                    </td>

                    {/* Best Lap */}
                    <td className="py-3 text-right font-mono font-bold">
                      {isFastestLap ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span
                            title="Volta Mais Rápida da Sessão (Fastest Lap)"
                            className="inline-flex items-center gap-1 rounded bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-purple-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                          >
                            <Timer className="h-3 w-3 text-purple-400 shrink-0" />
                            <span>{r.best_lap}</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/80">{r.best_lap || "—"}</span>
                      )}
                    </td>

                    {/* Points */}
                    <td className="py-3 text-right font-black text-amber-400 text-sm">
                      {r.points ? `+${r.points}` : "0"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tyre Strategy (Gantt Chart) */}
      <TyreStrategyChart data={tyreData} totalLaps={totalLaps} />

      {/* Lap-by-Lap Position Chart */}
      <LapChart data={lapData} />

      {/* Race Pace Clean Air Ranking */}
      <RacePaceChart data={paceData} />
    </div>
  );
}
