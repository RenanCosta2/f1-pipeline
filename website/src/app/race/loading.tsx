import React from "react";

export default function RaceLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-f1-border/40 pb-6 space-y-3">
        <div className="h-6 w-36 rounded-full bg-f1-red/10 border border-f1-red/20" />
        <div className="h-9 w-96 rounded-xl bg-white/10" />
        <div className="h-4 w-80 rounded-lg bg-white/5" />
      </div>

      {/* Selectors bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-48 rounded-xl bg-white/10" />
        <div className="h-10 w-32 rounded-xl bg-white/10" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 rounded-2xl bg-[#14141F] border border-white/5 p-5 space-y-3">
            <div className="h-4 w-28 rounded bg-white/15" />
            <div className="h-8 w-40 rounded-lg bg-white/10" />
            <div className="h-3 w-48 rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="h-72 rounded-2xl bg-[#14141F] border border-white/5 p-5" />
    </div>
  );
}
