"use client";

import React from "react";
import DriverLink, { parseDriverNames } from "@/lib/driverUtils";
import {
  useTieCarousel,
  TieCarouselState,
  TieCarouselTrack,
} from "@/components/ui/TieCarousel";

export interface CircuitRecordDriversProps {
  drivers?: string | string[] | null;
  accentColor?: "amber" | "purple" | "emerald" | "blue";
  emptyText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  carousel?: TieCarouselState;
}

const ACCENT_STYLES = {
  amber: {
    hoverText: "hover:text-amber-300",
  },
  purple: {
    hoverText: "hover:text-purple-300",
  },
  emerald: {
    hoverText: "hover:text-emerald-300",
  },
  blue: {
    hoverText: "hover:text-blue-300",
  },
};

export default function CircuitRecordDrivers({
  drivers,
  accentColor = "amber",
  emptyText = "Sem histórico",
  size = "sm",
  className = "",
  carousel: externalCarousel,
}: CircuitRecordDriversProps) {
  const driverList = parseDriverNames(drivers);
  const internalCarousel = useTieCarousel(driverList.length);
  const carousel = externalCarousel || internalCarousel;
  const accent = ACCENT_STYLES[accentColor] || ACCENT_STYLES.amber;

  if (driverList.length === 0) {
    return (
      <span className={`text-zinc-500 text-xs ${className}`}>
        {emptyText}
      </span>
    );
  }

  const textSizeClass =
    size === "lg"
      ? "text-lg font-black text-white"
      : size === "md"
      ? "text-base font-bold text-white"
      : "text-xs sm:text-sm font-bold text-white";

  if (driverList.length === 1) {
    const singleDriver = driverList[0];
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

  return (
    <div className={`w-full min-w-0 ${className}`}>
      <TieCarouselTrack
        carousel={carousel}
        items={driverList}
        keyExtractor={(d) => d}
        renderItem={(driver) => (
          <p className={`${textSizeClass} truncate`} title={driver}>
            <DriverLink
              driverName={driver}
              className={`${accent.hoverText} transition-colors`}
            >
              {driver}
            </DriverLink>
          </p>
        )}
      />
    </div>
  );
}
