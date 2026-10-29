"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X, Calendar } from "lucide-react";
import { RaceWeekendInfo } from "@/types/f1";
import CircuitLink from "@/lib/circuitUtils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  upcomingRace: RaceWeekendInfo;
  year: number;
}

export default function ScheduleModal({ isOpen, onClose, upcomingRace, year }: Props) {
  if (!isOpen || typeof document === "undefined") return null;

  const sessions = upcomingRace?.sessions || [];

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] !m-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121A] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-f1-red text-xs font-bold uppercase mb-1">
              <Calendar className="h-3.5 w-3.5" /> Programação Oficial
            </div>
            <CircuitLink
              circuitName={upcomingRace?.circuit_name}
              circuitId={upcomingRace?.circuit_id}
              className="inline-block group"
              title={`Ver perfil do circuito ${upcomingRace?.circuit_name}`}
            >
              <h3 className="text-xl font-black uppercase text-white group-hover:underline transition-colors leading-tight">
                {upcomingRace?.circuit_name || "Circuito"}
              </h3>
            </CircuitLink>
            <p className="text-xs text-f1-subtle mt-0.5">
              {upcomingRace?.official_event_name || `Temporada ${year}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {sessions.map((sess, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3.5 text-xs hover:border-white/15 transition-all"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                    sess.completed 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : sess.waiting_data
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/35"
                      : "bg-white/10 text-f1-subtle"
                  }`}>
                    {sess.completed ? (
                      "Finalizado"
                    ) : sess.waiting_data ? (
                      <>
                        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                        </span>
                        <span>Aguardando Dados</span>
                      </>
                    ) : (
                      "Programado"
                    )}
                  </span>
                  <p className="font-bold text-white">{sess.name}</p>
                </div>
                <p className="text-[10px] text-f1-subtle mt-1">{sess.date} {year}</p>
              </div>
              <span className="font-mono font-bold text-white text-xs">{sess.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
