"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type TieCarouselAccent = "amber" | "purple" | "emerald" | "blue" | "red" | "zinc";

const ACCENT_THEME: Record<
  TieCarouselAccent,
  {
    pillBorder: string;
    pillBg: string;
    edgeBorder: string;
    edgeBg: string;
    edgeHover: string;
    text: string;
    dotActive: string;
    btnHover: string;
  }
> = {
  amber: {
    pillBorder: "border-amber-500/30",
    pillBg: "bg-amber-500/10",
    edgeBorder: "border-amber-500/35",
    edgeBg: "bg-[#14120E]/90",
    edgeHover: "hover:bg-amber-500/25 hover:border-amber-400/70 hover:text-white active:bg-amber-500/35",
    text: "text-amber-300",
    dotActive: "bg-amber-400",
    btnHover: "hover:bg-amber-500/25 hover:text-white",
  },
  purple: {
    pillBorder: "border-purple-500/30",
    pillBg: "bg-purple-500/10",
    edgeBorder: "border-purple-500/35",
    edgeBg: "bg-[#141020]/90",
    edgeHover: "hover:bg-purple-500/25 hover:border-purple-400/70 hover:text-white active:bg-purple-500/35",
    text: "text-purple-300",
    dotActive: "bg-purple-400",
    btnHover: "hover:bg-purple-500/25 hover:text-white",
  },
  emerald: {
    pillBorder: "border-emerald-500/30",
    pillBg: "bg-emerald-500/10",
    edgeBorder: "border-emerald-500/35",
    edgeBg: "bg-[#0E1816]/90",
    edgeHover: "hover:bg-emerald-500/25 hover:border-emerald-400/70 hover:text-white active:bg-emerald-500/35",
    text: "text-emerald-300",
    dotActive: "bg-emerald-400",
    btnHover: "hover:bg-emerald-500/25 hover:text-white",
  },
  blue: {
    pillBorder: "border-blue-500/30",
    pillBg: "bg-blue-500/10",
    edgeBorder: "border-blue-500/35",
    edgeBg: "bg-[#0E1422]/90",
    edgeHover: "hover:bg-blue-500/25 hover:border-blue-400/70 hover:text-white active:bg-blue-500/35",
    text: "text-blue-300",
    dotActive: "bg-blue-400",
    btnHover: "hover:bg-blue-500/25 hover:text-white",
  },
  red: {
    pillBorder: "border-f1-red/35",
    pillBg: "bg-f1-red/10",
    edgeBorder: "border-f1-red/40",
    edgeBg: "bg-[#1C0E10]/90",
    edgeHover: "hover:bg-f1-red/25 hover:border-f1-red/70 hover:text-white active:bg-f1-red/35",
    text: "text-f1-red",
    dotActive: "bg-f1-red",
    btnHover: "hover:bg-f1-red/25 hover:text-white",
  },
  zinc: {
    pillBorder: "border-white/15",
    pillBg: "bg-white/[0.06]",
    edgeBorder: "border-white/20",
    edgeBg: "bg-[#161620]/90",
    edgeHover: "hover:bg-white/20 hover:border-white/40 hover:text-white active:bg-white/30",
    text: "text-zinc-200",
    dotActive: "bg-white",
    btnHover: "hover:bg-white/15 hover:text-white",
  },
};

export interface UseTieCarouselOptions {
  autoPlayMs?: number;
  autoPlay?: boolean;
}

export interface TieCarouselState {
  index: number;
  count: number;
  isTied: boolean;
  isPaused: boolean;
  next: (e?: React.MouseEvent) => void;
  prev: (e?: React.MouseEvent) => void;
  goTo: (idx: number, e?: React.MouseEvent) => void;
  pause: () => void;
  resume: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useTieCarousel(
  count: number,
  options: UseTieCarouselOptions = {}
): TieCarouselState {
  const { autoPlayMs = 4500, autoPlay = true } = options;
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const safeCount = Math.max(1, count);
  const isTied = count > 1;
  const safeIndex = index % safeCount;

  useEffect(() => {
    if (index >= safeCount) {
      setIndex(0);
    }
  }, [safeCount, index]);

  useEffect(() => {
    if (!isTied || !autoPlay || isPaused || autoPlayMs <= 0) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeCount);
    }, autoPlayMs);
    return () => clearInterval(timer);
  }, [isTied, autoPlay, isPaused, autoPlayMs, safeCount]);

  const next = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIndex((prev) => (prev + 1) % safeCount);
    },
    [safeCount]
  );

  const prev = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIndex((curr) => (curr - 1 + safeCount) % safeCount);
    },
    [safeCount]
  );

  const goTo = useCallback(
    (idx: number, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIndex(((idx % safeCount) + safeCount) % safeCount);
    },
    [safeCount]
  );

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current !== null && touchStartY.current !== null) {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        if (Math.abs(deltaX) > 24 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) {
            setIndex((curr) => (curr + 1) % safeCount);
          } else {
            setIndex((curr) => (curr - 1 + safeCount) % safeCount);
          }
        }
      }
      touchStartX.current = null;
      touchStartY.current = null;
      setIsPaused(false);
    },
    [safeCount]
  );

  return {
    index: safeIndex,
    count,
    isTied,
    isPaused,
    next,
    prev,
    goTo,
    pause,
    resume,
    onTouchStart,
    onTouchEnd,
  };
}

export interface TieCarouselEdgeArrowsProps {
  carousel: TieCarouselState;
  accent?: TieCarouselAccent;
  size?: "xs" | "sm" | "md";
  position?: "center" | "metric";
}

/**
 * Setas laterais slim acopladas às bordas esquerda e direita do card.
 * Possuem área de toque expandida invisível (after:-inset-2) para excelente ergonomia touch
 * sem roubar espaço horizontal do título ou do nome do piloto.
 */
export function TieCarouselEdgeArrows({
  carousel,
  accent = "amber",
  size = "md",
  position = "center",
}: TieCarouselEdgeArrowsProps) {
  if (!carousel.isTied) return null;

  const theme = ACCENT_THEME[accent] || ACCENT_THEME.amber;
  const topClass = position === "metric" ? "top-[44%] -translate-y-1/2" : "top-1/2 -translate-y-1/2";
  const sizeClass =
    size === "xs"
      ? "h-6 w-3.5"
      : size === "sm"
      ? "h-7 w-4 sm:h-8 sm:w-4.5"
      : "h-8 w-4 sm:h-9 sm:w-5";
  const iconClass = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <>
      <button
        type="button"
        onClick={carousel.prev}
        onMouseEnter={carousel.pause}
        onMouseLeave={carousel.resume}
        aria-label="Ver anterior empatado"
        title="Ver anterior empatado"
        className={`absolute left-0 ${topClass} z-20 flex items-center justify-center rounded-r-lg border-y border-r ${theme.edgeBorder} ${theme.edgeBg} ${theme.text} ${theme.edgeHover} backdrop-blur-md shadow-[2px_0_8px_rgba(0,0,0,0.5)] transition-all active:scale-90 select-none cursor-pointer after:content-[''] after:absolute after:-inset-y-2 after:-right-2 after:left-0 ${sizeClass}`}
      >
        <ChevronLeft className={iconClass} />
      </button>

      <button
        type="button"
        onClick={carousel.next}
        onMouseEnter={carousel.pause}
        onMouseLeave={carousel.resume}
        aria-label="Ver próximo empatado"
        title="Ver próximo empatado"
        className={`absolute right-0 ${topClass} z-20 flex items-center justify-center rounded-l-lg border-y border-l ${theme.edgeBorder} ${theme.edgeBg} ${theme.text} ${theme.edgeHover} backdrop-blur-md shadow-[-2px_0_8px_rgba(0,0,0,0.5)] transition-all active:scale-90 select-none cursor-pointer after:content-[''] after:absolute after:-inset-y-2 after:-left-2 after:right-0 ${sizeClass}`}
      >
        <ChevronRight className={iconClass} />
      </button>
    </>
  );
}

export interface TieCarouselControlProps {
  carousel: TieCarouselState;
  accent?: TieCarouselAccent;
  showLabel?: boolean;
  label?: string;
  size?: "xs" | "sm";
  className?: string;
}

/**
 * Controle compacto em formato de pílula para textos inline (ex.: subtítulos de herói).
 */
export function TieCarouselControl({
  carousel,
  accent = "amber",
  showLabel = false,
  label = "Empate",
  size = "sm",
  className = "",
}: TieCarouselControlProps) {
  if (!carousel.isTied) return null;

  const theme = ACCENT_THEME[accent] || ACCENT_THEME.amber;
  const isXs = size === "xs";

  return (
    <div
      onMouseEnter={carousel.pause}
      onMouseLeave={carousel.resume}
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center rounded-full border ${theme.pillBorder} ${theme.pillBg} p-0.5 select-none shrink-0 ${className}`}
      role="group"
      aria-label={`Navegar entre ${carousel.count} itens empatados`}
    >
      <button
        type="button"
        onClick={carousel.prev}
        aria-label="Item empatado anterior"
        title="Ver anterior empatado"
        className={`flex items-center justify-center rounded-full transition-colors active:scale-90 ${
          isXs ? "h-4 w-4" : "h-5 w-5"
        } ${theme.text} ${theme.btnHover}`}
      >
        <ChevronLeft className={isXs ? "h-2.5 w-2.5" : "h-3 w-3"} />
      </button>

      {showLabel && (
        <button
          type="button"
          onClick={carousel.next}
          title="Clique para alternar entre os empatados"
          className={`inline-flex items-center gap-1 px-1 font-mono font-bold uppercase tracking-wider ${
            isXs ? "text-[8px]" : "text-[9px] sm:text-[10px]"
          } ${theme.text} hover:text-white transition-colors`}
        >
          <span>{label}</span>
        </button>
      )}

      <button
        type="button"
        onClick={carousel.next}
        aria-label="Próximo item empatado"
        title="Ver próximo empatado"
        className={`flex items-center justify-center rounded-full transition-colors active:scale-90 ${
          isXs ? "h-4 w-4" : "h-5 w-5"
        } ${theme.text} ${theme.btnHover}`}
      >
        <ChevronRight className={isXs ? "h-2.5 w-2.5" : "h-3 w-3"} />
      </button>
    </div>
  );
}

export interface TieCarouselDotsProps {
  carousel: TieCarouselState;
  accent?: TieCarouselAccent;
  showCounter?: boolean;
  className?: string;
}

export function TieCarouselDots({
  carousel,
  accent = "amber",
  showCounter = false,
  className = "",
}: TieCarouselDotsProps) {
  if (!carousel.isTied) return null;
  const theme = ACCENT_THEME[accent] || ACCENT_THEME.amber;

  return (
    <div
      className={`inline-flex items-center gap-1.5 shrink-0 select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {showCounter && (
        <span className={`font-mono text-[9px] font-bold tabular-nums ${theme.text} opacity-80`}>
          {carousel.index + 1}/{carousel.count}
        </span>
      )}
      {carousel.count <= 8 && (
        <div className="inline-flex items-center gap-1">
          {Array.from({ length: carousel.count }).map((_, idx) => {
            const isActive = idx === carousel.index;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => carousel.goTo(idx, e)}
                aria-label={`Ver empatado ${idx + 1} de ${carousel.count}`}
                title={`Empatado ${idx + 1} de ${carousel.count}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? `w-3.5 ${theme.dotActive}`
                    : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface TieCarouselTrackProps<T> {
  carousel: TieCarouselState;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  className?: string;
  slideClassName?: string;
}

/**
 * Viewport com trilha deslizante horizontal acelerada por hardware (translateX) e suporte a swipe touch.
 */
export function TieCarouselTrack<T>({
  carousel,
  items,
  renderItem,
  keyExtractor,
  className = "",
  slideClassName = "",
}: TieCarouselTrackProps<T>) {
  if (!items || items.length === 0) return null;

  if (items.length === 1) {
    return <div className={`w-full min-w-0 ${className}`}>{renderItem(items[0], 0)}</div>;
  }

  return (
    <div
      onMouseEnter={carousel.pause}
      onMouseLeave={carousel.resume}
      onTouchStart={carousel.onTouchStart}
      onTouchEnd={carousel.onTouchEnd}
      className={`relative overflow-hidden w-full min-w-0 touch-pan-y ${className}`}
    >
      <div
        className="flex w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{ transform: `translateX(-${carousel.index * 100}%)` }}
      >
        {items.map((item, idx) => (
          <div
            key={keyExtractor ? keyExtractor(item, idx) : idx}
            aria-hidden={idx !== carousel.index}
            className={`w-full shrink-0 min-w-0 ${slideClassName}`}
          >
            {renderItem(item, idx)}
          </div>
        ))}
      </div>
    </div>
  );
}
