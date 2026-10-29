"use client";

import React, { useState } from "react";
import { Gauge, Radio, History } from "lucide-react";
import {
  DriverStanding,
  ConstructorStanding,
  SessionSummary,
  RaceWeekendInfo
} from "@/types/f1";
import StandingsWidget from "./StandingsWidget";
import RaceWeekendView from "./RaceWeekendView";
import BetweenRacesView from "./BetweenRacesView";
import SessionDetailDrawer from "./SessionDetailDrawer";
import ScheduleModal from "./ScheduleModal";

type Mode = "weekend" | "between";

interface SessionItem {
  code: string;
  name: string;
  session_name?: string;
  date: string;
  time: string;
  completed: boolean;
}

interface Props {
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
  lastRaceResults: SessionSummary[];
  upcomingRace: RaceWeekendInfo;
  weekendRace?: RaceWeekendInfo;
  initialMode?: Mode;
  year: number;
}

export default function ApexF1Hub({
  drivers = [],
  constructors = [],
  lastRaceResults = [],
  upcomingRace,
  weekendRace,
  initialMode = "between",
  year
}: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Active weekend info for "weekend" view (defaults to weekendRace or upcomingRace)
  const activeWeekend = weekendRace || upcomingRace;

  return (
    <div className="space-y-8">
      {/* Interactive Control Header with State Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#12121A]/80 backdrop-blur-md p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-f1-red text-white shadow-lg shadow-f1-red/30">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              Apex <span className="text-f1-red">F1</span>
              <span className="text-xs font-normal text-white/40">| Live Hub & Analytics</span>
            </h1>
            <p className="text-[11px] text-f1-subtle font-medium">
              Temporada Oficial {year} · Dados integrados em tempo real às views analíticas dbt
            </p>
          </div>
        </div>

        {/* State Toggle Switcher */}
        <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-1">
          <button
            onClick={() => setMode("weekend")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              mode === "weekend"
                ? "bg-f1-red text-white shadow-md shadow-f1-red/30"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Fim de Semana</span>
          </button>
          <button
            onClick={() => setMode("between")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              mode === "between"
                ? "bg-white/15 text-white shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Entre Corridas</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Dynamic Race Hub (68% - lg:col-span-8) */}
        {/* ============================================================ */}
        <div className="lg:col-span-8">
          {mode === "weekend" ? (
            <RaceWeekendView
              raceInfo={activeWeekend}
              onSelectSession={(session) => setSelectedSession(session)}
            />
          ) : (
            <BetweenRacesView
              lastRaceResults={lastRaceResults}
              upcomingRace={upcomingRace}
              year={year}
              onOpenSchedule={() => setScheduleModalOpen(true)}
            />
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Standings Top 10 Widget (32% - lg:col-span-4) */}
        {/* ============================================================ */}
        <div className="lg:col-span-4">
          <StandingsWidget
            drivers={drivers}
            constructors={constructors}
            year={year}
          />
        </div>
      </div>

      {/* Dynamic Session Details Drawer */}
      <SessionDetailDrawer
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
        year={year}
        round={activeWeekend?.round_number || 14}
        circuitName={activeWeekend?.circuit_name || "Circuito"}
      />

      {/* Schedule Modal for Upcoming GP */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        upcomingRace={upcomingRace}
        year={year}
      />
    </div>
  );
}
