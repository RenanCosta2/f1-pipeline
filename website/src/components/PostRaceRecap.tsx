import Link from "next/link";
import { Trophy, ArrowUpRight, Gauge, ArrowRight, ShieldAlert, Award } from "lucide-react";
import DriverLink from "@/lib/driverUtils";
import { TeamLink } from "@/lib/teamUtils";
import { CircuitLink } from "@/lib/circuitUtils";
import { SessionSummary } from "@/types/f1";

interface Props {
  results: SessionSummary[];
}

export default function PostRaceRecap({ results }: Props) {
  if (!results || results.length === 0) return null;

  const podium = results.slice(0, 3);
  const winner = podium[0];
  const fastestLapDriver = [...results].sort((a, b) => {
    if (!a.best_lap) return 1;
    if (!b.best_lap) return -1;
    return a.best_lap.localeCompare(b.best_lap);
  })[0];

  const biggestClimber = [...results]
    .filter((r) => (r.delta_position ?? 0) > 0)
    .sort((a, b) => (b.delta_position || 0) - (a.delta_position || 0))[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-f1-border bg-gradient-to-br from-[#181824] via-[#12121C] to-[#0A0A0F] p-6 lg:p-8 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-f1-border/50 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black tracking-wide text-emerald-400 uppercase">
            <Trophy className="h-3.5 w-3.5" /> Último GP Concluído • Round {winner.round_number}
          </span>
          <CircuitLink
            circuitName={winner.location || winner.country}
            className="text-xs text-white/70 hover:text-white font-semibold inline-flex items-center gap-1 group transition-colors"
            title={`Ver perfil do circuito em ${winner.location || winner.country}`}
          >
            <span>{winner.location}, {winner.country}</span>
            <ArrowUpRight className="h-3 w-3 text-white/40 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </CircuitLink>
        </div>

        <Link
          href={`/season/round/${winner.round_number}?year=${winner.year}`}
          className="flex items-center gap-1.5 text-xs font-bold text-f1-red hover:text-white transition-colors group"
        >
          <span>Ver análise detalhada da corrida</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="mt-5">
        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
          {winner.official_event_name}
        </h2>
      </div>

      {/* Podium Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* P1 Winner Card */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-black font-black text-sm">
                1
              </span>
              <DriverLink driverId={winner.driver_id} driverName={winner.driver_full_name}>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-amber-400/50 bg-black/40 transition-transform hover:scale-105">
                  {winner.driver_headshot_url ? (
                    <img
                      src={winner.driver_headshot_url}
                      alt={winner.driver_full_name}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-mono text-xs font-black text-amber-300">
                      {winner.driver_full_name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </DriverLink>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest hidden sm:inline">Vencedor</span>
              <DriverLink
                driverId={winner.driver_id}
                driverName={winner.driver_full_name}
                className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-400/20 hover:text-white transition-all group"
                title={`Ver perfil de ${winner.driver_full_name}`}
              >
                Perfil
                <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </DriverLink>
            </div>
          </div>
          <div className="mt-4">
            <DriverLink driverId={winner.driver_id} driverName={winner.driver_full_name}>
              <h3 className="text-xl font-black text-white hover:text-amber-300 transition-colors">{winner.driver_full_name}</h3>
            </DriverLink>
            <div className="text-xs text-f1-subtle font-medium mt-0.5">
              <TeamLink
                teamName={winner.team_name}
                className="hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                title={`Ver perfil de ${winner.team_name}`}
              >
                {winner.team_name}
              </TeamLink>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-f1-subtle">Pontos</span>
            <span className="font-black text-amber-400 text-base">+{winner.points} pts</span>
          </div>
        </div>

        {/* P2 */}
        {podium[1] && (
          <div className="rounded-xl border border-white/10 bg-[#14141F] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-black font-black text-sm">
                  2
                </span>
                <DriverLink driverId={podium[1].driver_id} driverName={podium[1].driver_full_name}>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-400/30 bg-black/40 transition-transform hover:scale-105">
                    {podium[1].driver_headshot_url ? (
                      <img
                        src={podium[1].driver_headshot_url}
                        alt={podium[1].driver_full_name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-mono text-xs font-black text-white/70">
                        {podium[1].driver_full_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </DriverLink>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest hidden sm:inline">Pódio</span>
                <DriverLink
                  driverId={podium[1].driver_id}
                  driverName={podium[1].driver_full_name}
                  className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all group"
                  title={`Ver perfil de ${podium[1].driver_full_name}`}
                >
                  Perfil
                  <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </DriverLink>
              </div>
            </div>
            <div className="mt-4">
              <DriverLink driverId={podium[1].driver_id} driverName={podium[1].driver_full_name}>
                <h3 className="text-lg font-black text-white hover:text-white hover:underline decoration-white/40 transition-colors">{podium[1].driver_full_name}</h3>
              </DriverLink>
              <div className="text-xs text-f1-subtle font-medium mt-0.5">
                <TeamLink
                  teamName={podium[1].team_name}
                  className="hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                  title={`Ver perfil de ${podium[1].team_name}`}
                >
                  {podium[1].team_name}
                </TeamLink>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-f1-subtle">Pontos</span>
              <span className="font-bold text-white text-base">+{podium[1].points} pts</span>
            </div>
          </div>
        )}

        {/* P3 */}
        {podium[2] && (
          <div className="rounded-xl border border-white/10 bg-[#14141F] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 text-white font-black text-sm">
                  3
                </span>
                <DriverLink driverId={podium[2].driver_id} driverName={podium[2].driver_full_name}>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-amber-700/50 bg-black/40 transition-transform hover:scale-105">
                    {podium[2].driver_headshot_url ? (
                      <img
                        src={podium[2].driver_headshot_url}
                        alt={podium[2].driver_full_name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-mono text-xs font-black text-white/70">
                        {podium[2].driver_full_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </DriverLink>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest hidden sm:inline">Pódio</span>
                <DriverLink
                  driverId={podium[2].driver_id}
                  driverName={podium[2].driver_full_name}
                  className="inline-flex items-center gap-0.5 rounded-full border border-amber-700/30 bg-amber-700/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 hover:bg-amber-700/20 hover:text-white transition-all group"
                  title={`Ver perfil de ${podium[2].driver_full_name}`}
                >
                  Perfil
                  <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </DriverLink>
              </div>
            </div>
            <div className="mt-4">
              <DriverLink driverId={podium[2].driver_id} driverName={podium[2].driver_full_name}>
                <h3 className="text-lg font-black text-white hover:text-white hover:underline decoration-white/40 transition-colors">{podium[2].driver_full_name}</h3>
              </DriverLink>
              <div className="text-xs text-f1-subtle font-medium mt-0.5">
                <TeamLink
                  teamName={podium[2].team_name}
                  className="hover:text-white hover:underline decoration-white/30 underline-offset-2 transition-colors"
                  title={`Ver perfil de ${podium[2].team_name}`}
                >
                  {podium[2].team_name}
                </TeamLink>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-f1-subtle">Pontos</span>
              <span className="font-bold text-white text-base">+{podium[2].points} pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Highlights Bar */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Biggest Climber */}
        {biggestClimber && (
          <div className="rounded-xl border border-f1-border/50 bg-[#14141F] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DriverLink driverId={biggestClimber.driver_id} driverName={biggestClimber.driver_full_name}>
                {biggestClimber.driver_headshot_url ? (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-emerald-500/30 bg-black/40 transition-transform hover:scale-105">
                    <img
                      src={biggestClimber.driver_headshot_url}
                      alt={biggestClimber.driver_full_name}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                )}
              </DriverLink>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-f1-subtle">Maior Escalador</span>
                  <DriverLink
                    driverId={biggestClimber.driver_id}
                    driverName={biggestClimber.driver_full_name}
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 hover:text-white transition-colors group"
                    title={`Ver perfil de ${biggestClimber.driver_full_name}`}
                  >
                    <span>Perfil</span>
                    <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </DriverLink>
                </div>
                <DriverLink driverId={biggestClimber.driver_id} driverName={biggestClimber.driver_full_name}>
                  <p className="text-sm font-black text-white hover:text-emerald-300 transition-colors">{biggestClimber.driver_full_name}</p>
                </DriverLink>
              </div>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 font-black text-lg">+{biggestClimber.delta_position}</span>
              <span className="block text-[10px] text-f1-subtle">P{biggestClimber.grid_position} ➔ P{biggestClimber.finishing_position}</span>
            </div>
          </div>
        )}

        {/* Fastest Lap */}
        {fastestLapDriver && (
          <div className="rounded-xl border border-f1-border/50 bg-[#14141F] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DriverLink driverId={fastestLapDriver.driver_id} driverName={fastestLapDriver.driver_full_name}>
                {fastestLapDriver.driver_headshot_url ? (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-purple-500/30 bg-black/40 transition-transform hover:scale-105">
                    <img
                      src={fastestLapDriver.driver_headshot_url}
                      alt={fastestLapDriver.driver_full_name}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                    <Gauge className="h-5 w-5" />
                  </div>
                )}
              </DriverLink>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-f1-subtle">Volta Mais Rápida</span>
                  <DriverLink
                    driverId={fastestLapDriver.driver_id}
                    driverName={fastestLapDriver.driver_full_name}
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-purple-400 hover:text-white transition-colors group"
                    title={`Ver perfil de ${fastestLapDriver.driver_full_name}`}
                  >
                    <span>Perfil</span>
                    <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </DriverLink>
                </div>
                <DriverLink driverId={fastestLapDriver.driver_id} driverName={fastestLapDriver.driver_full_name}>
                  <p className="text-sm font-black text-white hover:text-purple-300 transition-colors">{fastestLapDriver.driver_full_name}</p>
                </DriverLink>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-purple-400 font-bold text-base">{fastestLapDriver.best_lap}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
