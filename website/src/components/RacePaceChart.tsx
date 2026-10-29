import { RacePace, SessionSummary } from "@/types/f1";
import DriverLink from "@/lib/driverUtils";
import { Gauge, CheckCircle2, Shield } from "lucide-react";

interface Props {
  data: RacePace[];
  sessionResults?: SessionSummary[];
  className?: string;
}

export default function RacePaceChart({ data, sessionResults = [], className = "" }: Props) {
  if ((!data || data.length === 0) && (!sessionResults || sessionResults.length === 0)) return null;

  const sortedPace = [...(data || [])].sort((a, b) => a.avg_lap_time_seconds - b.avg_lap_time_seconds);
  const bestPace = sortedPace[0]?.avg_lap_time_seconds || 1;

  // Identifica pilotos do grid que estão no resultado da sessão mas não possuem voltas limpas (ex: DNS, DNF precoce)
  const paceDriversSet = new Set(sortedPace.map((p) => p.driver_full_name));
  const missingDrivers = sessionResults
    .filter((sr) => !paceDriversSet.has(sr.driver_full_name))
    .sort((a, b) => (a.finishing_position || 99) - (b.finishing_position || 99));

  const totalGridCount = sortedPace.length + missingDrivers.length;

  const headshotMap = new Map<string, string | null | undefined>();
  sessionResults.forEach((sr) => {
    if (sr.driver_headshot_url) headshotMap.set(sr.driver_full_name, sr.driver_headshot_url);
  });

  return (
    <div className={`rounded-2xl border border-white/10 bg-[#0B0B10] p-6 shadow-xl flex flex-col ${className}`}>
      {/* Cabeçalho Fixo */}
      <div className="border-b border-white/10 pb-4 mb-4 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Gauge className="h-5 w-5 text-f1-red" />
            Ritmo Médio em Pista Limpa (Race Pace)
          </h3>
          <span className="text-[10px] font-mono font-bold text-f1-subtle bg-white/5 border border-white/10 px-2 py-0.5 rounded">
            {totalGridCount} pilotos no grid
          </span>
        </div>
        <p className="text-xs text-f1-subtle font-medium mt-1">
          Média calculada apenas em voltas representativas (sem Safety Car, VSC e voltas de box)
        </p>
      </div>

      {/* Lista com Rolagem Vertical Independente */}
      <div className="space-y-3 overflow-y-auto pr-1.5 flex-1">
        {/* Pilotos com Ritmo Aferido */}
        {sortedPace.map((item, index) => {
          const deltaSeconds = item.avg_lap_time_seconds - bestPace;
          const isLeader = index === 0;
          const headshot = item.driver_headshot_url || headshotMap.get(item.driver_full_name);

          return (
            <div
              key={item.driver_full_name}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all gap-2"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                  index === 0 ? "bg-amber-400 text-black shadow-md shadow-amber-400/20" : "bg-white/10 text-white"
                }`}>
                  {index + 1}
                </span>

                <DriverLink driverName={item.driver_full_name}>
                  <div
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 shadow-sm transition-transform hover:scale-105"
                    style={{ borderColor: item.team_color || "#E10600" }}
                  >
                    {headshot ? (
                      <img
                        src={headshot}
                        alt={item.driver_full_name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <span className="font-mono text-[10px] font-black text-white/70">
                        {item.driver_full_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </DriverLink>

                <div>
                  <DriverLink driverName={item.driver_full_name}>
                    <p className="font-bold text-white text-sm hover:text-f1-red transition-colors">{item.driver_full_name}</p>
                  </DriverLink>
                  <p className="text-xs text-f1-subtle font-medium">{item.team_name}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                {/* Consistency Badge */}
                {item.pace_stddev !== null && item.pace_stddev !== undefined && !isNaN(Number(item.pace_stddev)) && (
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-f1-subtle uppercase block">Consistência (σ)</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      ±{Number(item.pace_stddev).toFixed(3)}s
                    </span>
                  </div>
                )}

                {/* Average Lap Time & Delta */}
                <div>
                  <span className="text-base font-black font-mono text-white block">
                    {item.lap_pace}
                  </span>
                  <span className={`text-[11px] font-mono font-bold ${isLeader ? 'text-amber-400' : 'text-f1-subtle'}`}>
                    {isLeader ? 'Líder de Ritmo' : `+${Number(deltaSeconds || 0).toFixed(3)}s/v`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Pilotos sem voltas representativas completas (DNS / DNF precoce) */}
        {missingDrivers.map((item, idx) => {
          const pos = sortedPace.length + idx + 1;
          const statusText = item.status && item.status.toLowerCase().includes("did not start")
            ? "DNS • Não largou"
            : item.status || "Sem voltas limpas";

          const headshot = item.driver_headshot_url || headshotMap.get(item.driver_full_name);

          return (
            <div
              key={item.driver_full_name}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] opacity-60 hover:opacity-100 transition-all gap-2"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs font-mono text-f1-subtle">
                  {pos}
                </span>

                <DriverLink driverName={item.driver_full_name}>
                  <div
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden border bg-white/5 shadow-sm grayscale transition-transform hover:scale-105"
                    style={{ borderColor: item.team_color || "#E10600" }}
                  >
                    {headshot ? (
                      <img
                        src={headshot}
                        alt={item.driver_full_name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <span className="font-mono text-[10px] font-black text-white/50">
                        {item.driver_full_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </DriverLink>

                <div>
                  <DriverLink driverName={item.driver_full_name}>
                    <p className="font-bold text-white text-sm hover:text-f1-red transition-colors">{item.driver_full_name}</p>
                  </DriverLink>
                  <p className="text-xs text-f1-subtle font-medium">{item.team_name}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-f1-subtle uppercase block">Status</span>
                  <span className="text-xs font-mono text-f1-subtle">
                    {item.laps_completed ? `${item.laps_completed} voltas` : "0 voltas"}
                  </span>
                </div>

                <div>
                  <span className="text-base font-black font-mono text-white/40 block">
                    —
                  </span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {statusText}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
