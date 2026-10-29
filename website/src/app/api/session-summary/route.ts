import { NextRequest, NextResponse } from "next/server";
import {
  getSessionSummary,
  getMaxSpeed,
  getIdealLap,
  getLatestSeasonYear,
  getLatestCompletedRound
} from "@/lib/db";

function formatSector(t: string | null | undefined): string {
  if (!t) return "—";
  const parts = t.split(":");
  if (parts.length === 3) {
    const mins = parseInt(parts[0], 10);
    const secs = parts[1];
    const ms = parts[2];
    if (mins === 0) {
      return `${secs}.${ms}s`;
    }
    return `${mins}:${secs}.${ms}`;
  }
  return t.includes("s") ? t : `${t}s`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const yearParam = searchParams.get("year");
  const roundParam = searchParams.get("round");
  const sessionParam = searchParams.get("session") || "Race";

  const defaultYear = await getLatestSeasonYear();
  const year = yearParam ? parseInt(yearParam) : defaultYear;

  const defaultRound = await getLatestCompletedRound(year);
  const round = roundParam ? parseInt(roundParam) : defaultRound;

  try {
    const [results, speedTraps, idealLaps] = await Promise.all([
      getSessionSummary(year, round, sessionParam),
      getMaxSpeed(year, round, sessionParam),
      getIdealLap(year, round, sessionParam)
    ]);

    // Speed Trap Leader
    const topSpeed = speedTraps && speedTraps.length > 0 && speedTraps[0].max_speed_trap
      ? {
          speed: speedTraps[0].max_speed_trap,
          driver: speedTraps[0].driver_full_name,
          team: speedTraps[0].team_name
        }
      : null;

    // Driver with Most Laps
    let mostLapsDriver: { laps: number; driver: string } | null = null;
    if (results && results.length > 0) {
      const sortedByLaps = [...results]
        .filter((r) => r.laps_completed != null)
        .sort((a, b) => (b.laps_completed || 0) - (a.laps_completed || 0));

      if (sortedByLaps.length > 0 && sortedByLaps[0].laps_completed) {
        mostLapsDriver = {
          laps: sortedByLaps[0].laps_completed,
          driver: sortedByLaps[0].driver_full_name
        };
      }
    }

    // Best Sectors (Fastest S1, S2, S3 across all drivers in this session)
    let bestSectors: {
      s1: { time: string; driver: string; team: string } | null;
      s2: { time: string; driver: string; team: string } | null;
      s3: { time: string; driver: string; team: string } | null;
    } | null = null;

    if (idealLaps && idealLaps.length > 0) {
      const validS1 = idealLaps.filter(l => l.sector_1 && l.sector_1.trim() !== "");
      const validS2 = idealLaps.filter(l => l.sector_2 && l.sector_2.trim() !== "");
      const validS3 = idealLaps.filter(l => l.sector_3 && l.sector_3.trim() !== "");

      const s1Top = validS1.length > 0 ? [...validS1].sort((a, b) => a.sector_1.localeCompare(b.sector_1))[0] : null;
      const s2Top = validS2.length > 0 ? [...validS2].sort((a, b) => a.sector_2.localeCompare(b.sector_2))[0] : null;
      const s3Top = validS3.length > 0 ? [...validS3].sort((a, b) => a.sector_3.localeCompare(b.sector_3))[0] : null;

      if (s1Top || s2Top || s3Top) {
        bestSectors = {
          s1: s1Top ? { time: formatSector(s1Top.sector_1), driver: s1Top.driver_full_name, team: s1Top.team_name } : null,
          s2: s2Top ? { time: formatSector(s2Top.sector_2), driver: s2Top.driver_full_name, team: s2Top.team_name } : null,
          s3: s3Top ? { time: formatSector(s3Top.sector_3), driver: s3Top.driver_full_name, team: s3Top.team_name } : null,
        };
      }
    }

    return NextResponse.json({
      year,
      round,
      session: sessionParam,
      results,
      speedTrap: topSpeed,
      mostLaps: mostLapsDriver,
      bestSectors
    });
  } catch (error) {
    console.error("API session-summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session summary" },
      { status: 500 }
    );
  }
}
