import { Activity, ShieldCheck, Database, GitBranch } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-f1-border bg-[#09090D] text-f1-subtle text-xs py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-8 items-center justify-center rounded bg-f1-red font-black italic text-white text-[10px]">
            F1
          </div>
          <p>
            <strong className="text-white font-semibold">Formula 1 Data Pipeline & Analytics Hub</strong> — Desenvolvido com FastF1, PostgreSQL (Supabase), dbt e Next.js.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>Medallion Architecture</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-f1-red" />
            <span>dbt Tested Marts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-blue-400" />
            <span>Automated ELT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
