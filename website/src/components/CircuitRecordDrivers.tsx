import React from "react";
import DriverLink, { parseDriverNames } from "@/lib/driverUtils";

export interface CircuitRecordDriversProps {
  drivers?: string | string[] | null;
  accentColor?: "amber" | "purple" | "emerald" | "blue";
  emptyText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ACCENT_STYLES = {
  amber: {
    dot: "bg-amber-400/80",
    hoverBorder: "hover:border-amber-400/40",
    hoverText: "hover:text-amber-300",
  },
  purple: {
    dot: "bg-purple-400/80",
    hoverBorder: "hover:border-purple-400/40",
    hoverText: "hover:text-purple-300",
  },
  emerald: {
    dot: "bg-emerald-400/80",
    hoverBorder: "hover:border-emerald-400/40",
    hoverText: "hover:text-emerald-300",
  },
  blue: {
    dot: "bg-blue-400/80",
    hoverBorder: "hover:border-blue-400/40",
    hoverText: "hover:text-blue-300",
  },
};

export default function CircuitRecordDrivers({
  drivers,
  accentColor = "amber",
  emptyText = "Sem histórico",
  size = "sm",
  className = "",
}: CircuitRecordDriversProps) {
  const driverList = parseDriverNames(drivers);
  const accent = ACCENT_STYLES[accentColor] || ACCENT_STYLES.amber;

  if (driverList.length === 0) {
    return (
      <span className={`text-zinc-500 text-xs ${className}`}>
        {emptyText}
      </span>
    );
  }

  // Quando é apenas 1 piloto: exibição direta e sóbria
  if (driverList.length === 1) {
    const singleDriver = driverList[0];
    const textSizeClass =
      size === "lg"
        ? "text-lg font-black text-white"
        : size === "md"
        ? "text-base font-bold text-white"
        : "text-sm font-bold text-white";

    return (
      <p className={`${textSizeClass} truncate ${className}`} title={singleDriver}>
        <DriverLink
          driverName={singleDriver}
          className={`${accent.hoverText} transition-colors`}
        >
          {singleDriver}
        </DriverLink>
      </p>
    );
  }

  // Quando há múltiplos pilotos (empate nos recordes da pista):
  // Exibição técnica em tags discretas sem brilho neon ou sombras artificiais
  return (
    <div className={`flex flex-wrap items-center gap-1.5 pt-0.5 ${className}`}>
      {driverList.map((driver) => (
        <DriverLink
          key={driver}
          driverName={driver}
          className={`inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] ${accent.hoverBorder} ${accent.hoverText} transition-colors`}
          title={`Ver perfil de ${driver}`}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${accent.dot}`} />
          <span className="truncate max-w-[130px] sm:max-w-none">{driver}</span>
        </DriverLink>
      ))}
    </div>
  );
}
