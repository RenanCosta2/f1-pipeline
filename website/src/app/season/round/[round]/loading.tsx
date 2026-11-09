import React from "react";
import { Loader2 } from "lucide-react";

export default function RoundLoading() {
  return (
    <div className="mx-auto max-w-7xl py-2 space-y-6 animate-pulse">
      {/* Voltar link skeleton */}
      <div className="h-4 w-48 rounded bg-white/10" />

      {/* Hero Banner Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-[#12121A] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 rounded bg-f1-red/30" />
            <div className="h-5 w-28 rounded bg-white/10" />
          </div>
          <div className="h-8 w-72 sm:w-96 rounded-xl bg-white/15" />
          <div className="h-4 w-48 rounded bg-white/5" />
        </div>
        <div className="h-20 w-full md:w-64 rounded-xl bg-white/5 border border-white/5" />
      </div>

      {/* Session Pills Skeleton */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
        <div className="h-4 w-16 rounded bg-white/10 mr-2 hidden sm:block" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-20 sm:w-28 rounded-lg bg-white/10" />
          ))}
        </div>
      </div>

      {/* 4 Cards KPI Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-[#12121A] p-4 space-y-3">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="h-6 w-32 rounded bg-white/15" />
            <div className="h-3 w-16 rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5 sm:p-6 space-y-4">
        <div className="h-6 w-44 rounded bg-white/15" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-white/[0.02] border border-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}

