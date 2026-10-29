import React from "react";

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-f1-border/40 pb-6">
        <div className="space-y-3">
          <div className="h-6 w-48 rounded-full bg-white/10" />
          <div className="h-9 w-80 rounded-xl bg-white/10" />
          <div className="h-4 w-96 rounded-lg bg-white/5" />
        </div>
        <div className="h-10 w-44 rounded-xl bg-white/10" />
      </div>

      {/* Main Grid Skeleton (Weekend View / Hero + Standings) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Hero + Sessions) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-[280px] sm:h-[320px] rounded-3xl bg-[#14141F] border border-white/5 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-white/10" />
                <div className="h-8 w-64 rounded-lg bg-white/15" />
              </div>
              <div className="h-6 w-24 rounded-full bg-white/10" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5" />
              ))}
            </div>
          </div>

          {/* Session Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-[#14141F] border border-white/5 p-3 space-y-2">
                <div className="h-3 w-12 rounded bg-white/10" />
                <div className="h-4 w-16 rounded bg-white/15" />
                <div className="h-3 w-20 rounded bg-white/5 mt-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (Standings Mini) */}
        <div className="rounded-3xl bg-[#14141F] border border-white/5 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="h-5 w-32 rounded bg-white/15" />
            <div className="h-4 w-16 rounded bg-white/10" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02]">
                <div className="h-6 w-6 rounded-full bg-white/10" />
                <div className="h-8 w-8 rounded-full bg-white/10" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-28 rounded bg-white/15" />
                  <div className="h-2.5 w-16 rounded bg-white/5" />
                </div>
                <div className="h-4 w-12 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
