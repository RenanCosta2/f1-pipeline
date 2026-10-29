"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Flag, Activity, Gauge, Github, Database, Users, Shield, MapPin } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Visão Geral", href: "/", icon: Flag },
    { name: "Temporada", href: "/season", icon: Trophy },
    { name: "Pilotos", href: "/drivers", icon: Users },
    { name: "Equipes", href: "/teams", icon: Shield },
    { name: "Circuitos", href: "/circuits", icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-f1-border bg-[#0D0D12]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-12 items-center justify-center rounded bg-f1-red font-black italic tracking-tighter text-white transition-transform group-hover:scale-105">
              F1
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-wider text-white uppercase">
                Analytics <span className="text-f1-red">Hub</span>
              </span>
              <span className="text-[10px] text-f1-subtle tracking-tight">
                Data Pipeline & dbt Marts
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-f1-red/15 text-white border-b-2 border-f1-red"
                      : "text-f1-subtle hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-f1-red" : "text-f1-subtle"}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Pipeline Indicator & GitHub */}
        <div className="flex items-center gap-3">

          {/* Data freshness badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Database className="h-3 w-3" />
            <span>Supabase Live</span>
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com/RenanCosta2/f1-pipeline"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-f1-border bg-f1-card text-f1-subtle hover:text-white hover:border-f1-red transition-all"
            title="Ver no GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="flex md:hidden border-t border-f1-border/50 bg-[#12121B] px-2 py-1 justify-around">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center py-1.5 px-3 text-[11px] font-medium rounded ${
                isActive ? "text-f1-red" : "text-f1-subtle"
              }`}
            >
              <Icon className="h-4 w-4 mb-0.5" />
              {link.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
