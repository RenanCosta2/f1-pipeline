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
  items?: { driver: string; driver_id?: string | null; headshot_url?: string | null }[];
  accentColor?: "amber" | "purple" | "emerald" | "blue";
  emptyText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  carousel?: TieCarouselState;
  showAvatar?: boolean;
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
  items,
  accentColor = "amber",
  emptyText = "Sem histórico",
  size = "sm",
  className = "",
  carousel: externalCarousel,
  showAvatar = true,
}: CircuitRecordDriversProps) {
  const driverList = React.useMemo(() => {
    if (items && items.length > 0) {
      return items;
    }
    const names = parseDriverNames(drivers);
    return names.map((name) => ({
      driver: name,
      driver_id: null as string | null,
      headshot_url: null as string | null
    }));
  }, [items, drivers]);

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

  const renderDriverAvatar = (item: { driver: string; driver_id?: string | null; headshot_url?: string | null }) => {
    if (!showAvatar) return null;
    const initials = item.driver
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <div className="relative flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full overflow-hidden border border-white/20 bg-white/5 shadow-sm">
        {item.headshot_url ? (
          <img
            src={item.headshot_url}
            alt={item.driver}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <span className="font-mono text-[9px] font-bold text-white/70">
            {initials || "F1"}
          </span>
        )}
      </div>
    );
  };

  if (driverList.length === 1) {
    const single = driverList[0];
    return (
      <div className={`flex items-center gap-2 min-w-0 ${className}`}>
        {renderDriverAvatar(single)}
        <p className={`${textSizeClass} truncate min-w-0`} title={single.driver}>
          <DriverLink
            driverId={single.driver_id || undefined}
            driverName={single.driver}
            className={`${accent.hoverText} transition-colors`}
          >
            {single.driver}
          </DriverLink>
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 ${className}`}>
      <TieCarouselTrack
        carousel={carousel}
        items={driverList}
        keyExtractor={(d) => d.driver}
        renderItem={(item) => (
          <div className="flex items-center gap-2 min-w-0">
            {renderDriverAvatar(item)}
            <p className={`${textSizeClass} truncate min-w-0`} title={item.driver}>
              <DriverLink
                driverId={item.driver_id || undefined}
                driverName={item.driver}
                className={`${accent.hoverText} transition-colors`}
              >
                {item.driver}
              </DriverLink>
            </p>
          </div>
        )}
      />
    </div>
  );
}
