"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { CumulativeDriverPoint, CumulativeTeamPoint } from "@/types/f1";
import { TrendingUp } from "lucide-react";

interface Props {
  driversData: CumulativeDriverPoint[];
  teamsData: CumulativeTeamPoint[];
}

export default function CumulativeChart({ driversData, teamsData }: Props) {
  const [mode, setMode] = useState<"drivers" | "teams">("drivers");

  // Transform driversData for Recharts (Pivot by round_number)
  const roundMap: { [key: number]: any } = {};
  const driversList: { [name: string]: string } = {};

  driversData.forEach((row) => {
    if (!roundMap[row.round_number]) {
      roundMap[row.round_number] = {
        round: `R${row.round_number}`,
        eventName: row.official_event_name
      };
    }
    roundMap[row.round_number][row.driver_full_name] = row.cumulative_driver_points;
    if (row.team_color && !driversList[row.driver_full_name]) {
      driversList[row.driver_full_name] = row.team_color;
    }
  });

  const chartDriverData = Object.values(roundMap).sort((a, b) => {
    const rA = parseInt(a.round.replace("R", ""));
    const rB = parseInt(b.round.replace("R", ""));
    return rA - rB;
  });

  // Transform teamsData for Recharts
  const teamRoundMap: { [key: number]: any } = {};
  const teamsList: { [name: string]: string } = {};

  teamsData.forEach((row) => {
    if (!teamRoundMap[row.round_number]) {
      teamRoundMap[row.round_number] = {
        round: `R${row.round_number}`,
        eventName: row.official_event_name
      };
    }
    teamRoundMap[row.round_number][row.team_name] = row.cumulative_team_points;
    if (row.team_color && !teamsList[row.team_name]) {
      teamsList[row.team_name] = row.team_color;
    }
  });

  const chartTeamData = Object.values(teamRoundMap).sort((a, b) => {
    const rA = parseInt(a.round.replace("R", ""));
    const rB = parseInt(b.round.replace("R", ""));
    return rA - rB;
  });

  const topDrivers = Object.keys(driversList).slice(0, 6);
  const topTeams = Object.keys(teamsList).slice(0, 5);

  return (
    <div className="rounded-2xl border border-f1-border bg-[#14141F] p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-f1-border/50 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-f1-red" />
          <div>
            <h3 className="text-lg font-black uppercase text-white tracking-tight">
              Evolução do Campeonato (Rodada a Rodada)
            </h3>
            <p className="text-xs text-f1-subtle font-medium">Pontos acumulados ao longo das etapas</p>
          </div>
        </div>

        <div className="flex items-center rounded-lg bg-[#0C0C12] p-1 border border-white/5">
          <button
            onClick={() => setMode("drivers")}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              mode === "drivers"
                ? "bg-f1-red text-white"
                : "text-f1-subtle hover:text-white"
            }`}
          >
            Top Pilotos
          </button>
          <button
            onClick={() => setMode("teams")}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              mode === "teams"
                ? "bg-f1-red text-white"
                : "text-f1-subtle hover:text-white"
            }`}
          >
            Construtores
          </button>
        </div>
      </div>

      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "drivers" ? (
            <LineChart data={chartDriverData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252538" />
              <XAxis dataKey="round" stroke="#8E8EA0" fontSize={11} />
              <YAxis stroke="#8E8EA0" fontSize={11} domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#171723", borderColor: "#2F2F44", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(value, payload) => payload[0]?.payload?.eventName || value}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              {topDrivers.map((driver) => (
                <Line
                  key={driver}
                  type="monotone"
                  dataKey={driver}
                  name={driver}
                  stroke={driversList[driver] || "#E10600"}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : (
            <LineChart data={chartTeamData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252538" />
              <XAxis dataKey="round" stroke="#8E8EA0" fontSize={11} />
              <YAxis stroke="#8E8EA0" fontSize={11} domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#171723", borderColor: "#2F2F44", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(value, payload) => payload[0]?.payload?.eventName || value}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              {topTeams.map((team) => (
                <Line
                  key={team}
                  type="monotone"
                  dataKey={team}
                  name={team}
                  stroke={teamsList[team] || "#E10600"}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
