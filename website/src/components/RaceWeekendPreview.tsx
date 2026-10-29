import { Calendar, Clock, Trophy, MapPin, Gauge, Flag, Zap, Award } from "lucide-react";
import { RaceWeekendInfo } from "@/types/f1";
import DriverLink, { parseDriverNames } from "@/lib/driverUtils";
import CircuitLink from "@/lib/circuitUtils";
import CircuitRecordDrivers from "@/components/CircuitRecordDrivers";

interface Props {
  data: RaceWeekendInfo;
}

export default function RaceWeekendPreview({ data }: Props) {
  const winsDrivers = parseDriverNames(data.circuit_records.most_wins_drivers || data.circuit_records.most_wins_driver);
  const polesDrivers = parseDriverNames(data.circuit_records.most_poles_drivers || data.circuit_records.most_poles_driver);
  const isWinsTied = winsDrivers.length > 1;
  const isPolesTied = polesDrivers.length > 1;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-f1-border bg-gradient-to-br from-[#181824] via-[#12121C] to-[#0A0A0F] p-6 lg:p-8 shadow-2xl">
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-f1-red/10 blur-3xl pointer-events-none"></div>

      {/* Header Tag */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-f1-border/50 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-f1-red/20 px-3 py-1 text-xs font-black tracking-wide text-f1-red uppercase">
            <Flag className="h-3.5 w-3.5" /> Próxima Etapa • Round {data.round_number}
          </span>
          <span className="text-xs text-f1-subtle flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {data.event_date}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-white/80 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
          <MapPin className="h-3.5 w-3.5 text-f1-red" />
          <span>{data.location}, {data.country}</span>
        </div>
      </div>

      {/* Event Title */}
      <div className="mt-5">
        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
          {data.official_event_name}
        </h2>
        <p className="text-sm text-f1-subtle mt-1 font-medium flex items-center gap-2">
          <CircuitLink
            circuitName={data.circuit_name}
            circuitId={data.circuit_id}
            className="hover:text-f1-red transition-colors underline decoration-white/20 underline-offset-2"
            title={`Ver perfil e estatísticas do circuito ${data.circuit_name}`}
          >
            {data.circuit_name}
          </CircuitLink>
        </p>
      </div>

      {/* Grid: Weekend Schedule & Historical Context */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Weekend Schedule (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="text-xs font-black tracking-wider text-f1-subtle uppercase flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-f1-red" />
            Programação do Final de Semana
          </h3>

          <div className="space-y-3">
            {data.sessions.map((sess, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-sm transition-all ${
                  sess.completed
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                    : "border-white/5 bg-black/20 text-white hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    sess.completed 
                      ? "bg-emerald-500/20 text-emerald-300" 
                      : sess.waiting_data
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-white/10 text-f1-subtle"
                  }`}>
                    {sess.completed ? "CONCLUÍDO" : sess.waiting_data ? "AGUARDANDO DADOS" : "A SEGUIR"}
                  </span>
                  <span className="font-semibold">{sess.name}</span>
                </div>
                <div className="text-xs font-mono text-f1-subtle flex items-center gap-2">
                  <span>{sess.date}</span>
                  <span className="text-white font-bold">{sess.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Historical Context & Circuit Records (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="text-xs font-black tracking-wider text-f1-subtle uppercase flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-f1-red" />
            Retrospecto Histórico & Raio-X do Circuito
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Record 1: Most Wins */}
            <div className="rounded-lg border border-f1-border/50 bg-[#161622] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-f1-subtle uppercase flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  {isWinsTied ? "Maiores Vencedores no Circuito" : "Maior Vencedor no Circuito"}
                </span>
                {isWinsTied && (
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 shrink-0">
                    <span className="w-1 h-1 rounded-full bg-amber-400/80" />
                    Empate ({winsDrivers.length})
                  </span>
                )}
              </div>
              <div className="mt-2">
                <CircuitRecordDrivers
                  drivers={data.circuit_records.most_wins_drivers || data.circuit_records.most_wins_driver}
                  accentColor="amber"
                  size="lg"
                  emptyText="Sem histórico registrado"
                />
                <p className="mt-1.5 text-xs text-amber-400 font-bold">
                  {data.circuit_records.most_wins_count > 0 ? `${data.circuit_records.most_wins_count} vitórias` : "0 vitórias registradas"}
                </p>
              </div>
            </div>

            {/* Record 2: Most Poles */}
            <div className="rounded-lg border border-f1-border/50 bg-[#161622] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-f1-subtle uppercase flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-purple-400" />
                  {isPolesTied ? "Recordistas de Poles" : "Recordista de Poles"}
                </span>
                {isPolesTied && (
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 shrink-0">
                    <span className="w-1 h-1 rounded-full bg-purple-400/80" />
                    Empate ({polesDrivers.length})
                  </span>
                )}
              </div>
              <div className="mt-2">
                <CircuitRecordDrivers
                  drivers={data.circuit_records.most_poles_drivers || data.circuit_records.most_poles_driver}
                  accentColor="purple"
                  size="lg"
                  emptyText="Sem histórico registrado"
                />
                <p className="mt-1.5 text-xs text-purple-400 font-bold">
                  {data.circuit_records.most_poles_count > 0 ? `${data.circuit_records.most_poles_count} pole positions` : "0 poles registradas"}
                </p>
              </div>
            </div>

            {/* Record 3: Official Lap Record */}
            <div className="rounded-lg border border-f1-border/50 bg-[#161622] p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-f1-subtle uppercase flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-emerald-400" /> Volta Mais Rápida da História
              </span>
              <div className="mt-2">
                <p className="text-lg font-black font-mono text-emerald-400">{data.circuit_records.lap_record}</p>
                <p className="text-xs text-f1-subtle font-medium">
                  {data.circuit_records.lap_record_year > 0 ? (
                    <DriverLink driverName={data.circuit_records.lap_record_holder} className="hover:text-emerald-300">
                      {data.circuit_records.lap_record_holder} ({data.circuit_records.lap_record_year})
                    </DriverLink>
                  ) : (
                    "Aguardando dados"
                  )}
                </p>
              </div>
            </div>

            {/* Record 4: Typical Tyre Strategy */}
            <div className="rounded-lg border border-f1-border/50 bg-[#161622] p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-f1-subtle uppercase flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5 text-blue-400" /> Estratégia Típica
              </span>
              <div className="mt-2">
                <p className="text-xs text-white font-medium leading-relaxed">{data.circuit_records.typical_strategy}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
