import React from "react";

export default function TelemetryLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="border-b border-f1-border/40 pb-6 space-y-3">
        <div className="h-6 w-32 rounded-full bg-purple-500/10 border border-purple-500/20" />
        <div className="h-9 w-96 rounded-xl bg-white/10" />
        <div className="h-4 w-72 rounded-lg bg-white/5" />
      </div>

      <div className="h-12 w-64 rounded-xl bg-white/10" />

      <div className="h-96 rounded-2xl bg-[#14141F] border border-white/5 p-6" />
    </div>
  );
}
