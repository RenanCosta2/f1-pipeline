"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Flag,
  Activity,
  Gauge,
  Github,
  Database,
  Menu,
  X,
  Layers,
  Sparkles,
  ChevronRight,
  Users,
  Shield,
  MapPin
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    {
      name: "Visão Geral",
      description: "Hub ao vivo e último GP",
      href: "/",
      icon: Flag,
      badge: "Live"
    },
    {
      name: "Temporada",
      description: "Classificação, matriz e corridas",
      href: "/season",
      icon: Trophy
    },
    {
      name: "Pilotos",
      description: "Galeria e perfis de carreira",
      href: "/drivers",
      icon: Users
    },
    {
      name: "Equipes",
      description: "Galeria e perfis históricos",
      href: "/teams",
      icon: Shield
    },
    {
      name: "Circuitos",
      description: "Autódromos, recordes e histórico",
      href: "/circuits",
      icon: MapPin
    }
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE TOP BAR (Visível apenas em telas pequenas < md) */}
      {/* ========================================================================= */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0B0B10]/95 px-4 py-3 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-10 items-center justify-center rounded bg-f1-red font-black italic tracking-tighter text-white text-xs">
            F1
          </div>
          <span className="text-sm font-black uppercase tracking-wider text-white">
            Analytics <span className="text-f1-red">Hub</span>
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
          aria-label="Abrir menu de navegação"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* SIDEBAR CONTAINER (Fixo na lateral esquerda no desktop, gaveta no mobile) */}
      {/* ========================================================================= */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-72 md:w-64 lg:w-72 flex-shrink-0 flex flex-col justify-between border-r border-white/10 bg-[#0B0B10] transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Section: Logo & Live Status */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 group"
            >
              <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-f1-red font-black italic tracking-tighter text-white shadow-lg shadow-f1-red/30 transition-transform group-hover:scale-105">
                F1
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-wider text-white leading-none">
                  Analytics <span className="text-f1-red">Hub</span>
                </span>
                <span className="text-[10px] text-f1-subtle font-mono tracking-tight mt-1">
                  Data Pipeline & dbt Marts
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-white/60 hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Live Status Badge */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-bold text-white text-[11px] uppercase tracking-wide">
                Temporada 2026
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Ao Vivo
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <div>
            <p className="px-3 text-[10px] font-black uppercase tracking-widest text-f1-subtle mb-3 flex items-center gap-2">
              <Layers className="h-3 w-3 text-f1-red" />
              Módulos de Análise
            </p>

            <nav className="space-y-1.5" aria-label="Navegação lateral principal">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group relative flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-f1-red/20 via-f1-red/10 to-transparent text-white border-l-4 border-f1-red shadow-md shadow-f1-red/10"
                        : "text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                          isActive
                            ? "bg-f1-red text-white shadow-md shadow-f1-red/40"
                            : "bg-white/5 text-white/60 group-hover:text-white group-hover:bg-white/10"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`font-black uppercase tracking-wider text-xs ${
                            isActive ? "text-white" : "text-white/80 group-hover:text-white"
                          }`}
                        >
                          {link.name}
                        </p>
                        <p className="text-[10px] text-f1-subtle font-medium truncate mt-0.5">
                          {link.description}
                        </p>
                      </div>
                    </div>

                    {link.badge ? (
                      <span className="flex-shrink-0 text-[9px] font-black uppercase bg-f1-red/20 text-f1-red border border-f1-red/30 px-1.5 py-0.5 rounded">
                        {link.badge}
                      </span>
                    ) : (
                      <ChevronRight
                        className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${
                          isActive
                            ? "text-f1-red translate-x-0.5"
                            : "text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5"
                        }`}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Technical Context Widget */}
          <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Arquitetura ELT</span>
            </div>
            <p className="text-[11px] text-f1-subtle leading-relaxed">
              Pipeline Medallion com Airflow, dbt Marts e banco analítico Supabase em nuvem.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Sync com FastF1 ativo</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Pipeline Health & GitHub */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-black/40">
          <div className="flex items-center justify-between text-xs text-f1-subtle">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-white/80">Supabase Live</span>
            </div>
            <span className="text-[10px] font-mono text-white/40">v1.2.0</span>
          </div>

          <a
            href="https://github.com/RenanCosta2/f1-pipeline"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10 hover:border-f1-red/40 transition-all group"
          >
            <Github className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
            <span>Repositório GitHub</span>
          </a>
        </div>
      </aside>
    </>
  );
}
