"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Calendar, ArrowUpRight } from "lucide-react";
import { RaceWeekendInfo } from "@/types/f1";
import CircuitLink from "@/lib/circuitUtils";
import { getCanonicalSessionName } from "./SessionDetailDrawer";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  upcomingRace: RaceWeekendInfo;
  year: number;
}

export default function ScheduleModal({ isOpen, onClose, upcomingRace, year }: Props) {
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const sessions = upcomingRace?.sessions || [];

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] !m-0 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border-t sm:border border-white/15 bg-[#12121A] p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl max-h-[88dvh] overflow-y-auto animate-slideUpSheet sm:animate-none"
      >
        {/* Mobile Bottom Sheet Pill Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between border-b border-white/10 pb-4 gap-3">
          <div className="min-w-0">
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
            <p className="text-xs text-f1-subtle mt-0.5 truncate">
              {upcomingRace?.official_event_name || `Temporada ${year}`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar programação"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white active:scale-95 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {sessions.map((sess, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3.5 text-xs hover:border-white/15 transition-all min-h-[54px]"
            >
              <div className="min-w-0 pr-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${sess.completed
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : sess.waiting_data
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/35"
                          : "bg-white/10 text-f1-subtle"
                      }`}
                  >
                    {sess.completed ? (
                      "Finalizado"
                    ) : sess.waiting_data ? (
                      <>
                        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                        </span>
                        <span>Aguardando Dados</span>
                      </>
                    ) : (
                      "Programado"
                    )}
                  </span>
                  <p className="font-bold text-white truncate">{sess.name}</p>
                  {sess.completed && (
                    <Link
                      href={`/season/round/${upcomingRace?.round_number || 1}?year=${year}&session=${encodeURIComponent(getCanonicalSessionName(sess.session_name || sess.name, sess.session_code))}`}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-f1-red hover:underline"
                      title={`Ir para aba de ${sess.name}`}
                    >
                      <span>Aba</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
                <p className="text-[11px] text-f1-subtle mt-1">
                  {sess.date} {year}
                </p>
              </div>
              <span className="font-mono font-bold text-white text-xs sm:text-sm shrink-0 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                {sess.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
