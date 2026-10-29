import React from "react";

export default function SeasonLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="border-b border-f1-border/40 pb-6 space-y-3">
        <div className="h-6 w-40 rounded-full bg-amber-500/10 border border-amber-500/20" />
        <div className="h-9 w-96 rounded-xl bg-white/10" />
        <div className="h-4 w-full max-w-xl rounded-lg bg-white/5" />
      </div>

      {/* Top Control Bar Skeleton */}
      <div className="flex items-center justify-between gap-4 bg-[#14141F] border border-white/5 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-44 rounded-xl bg-white/10" />
          <div className="h-8 w-24 rounded-xl bg-white/5 hidden sm:block" />
        </div>
        <div className="h-8 w-36 rounded-xl bg-white/10" />
      </div>

      {/* Main Content Skeleton (Side-by-side Table + Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Skeleton (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-white/5 bg-[#14141F] p-5 sm:p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div className="space-y-2">
              <div className="h-5 w-52 rounded bg-white/15" />
              <div className="h-3 w-80 rounded bg-white/5" />
            </div>
          </div>

          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02]">
                <div className="h-6 w-6 rounded-full bg-white/10 text-center" />
                <div className="h-4 w-4 rounded bg-white/5" />
                <div className="h-8 w-8 rounded-full bg-white/10" />
                <div className="flex-1 space-y-1">
                  <div className="h-3.5 w-32 rounded bg-white/15" />
                  <div className="h-2.5 w-20 rounded bg-white/5" />
                </div>
                <div className="h-4 w-12 rounded bg-white/10 hidden md:block" />
                <div className="h-4 w-16 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Slider & Chart Skeleton (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-white/5 bg-[#14141F] p-5 space-y-4">
            <div className="h-4 w-36 rounded bg-white/15" />
            <div className="h-8 w-full rounded-xl bg-white/5" />
            <div className="h-6 w-full rounded-full bg-white/10" />
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#14141F] p-5 space-y-4">
            <div className="h-4 w-48 rounded bg-white/15" />
            <div className="h-56 w-full rounded-xl bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
