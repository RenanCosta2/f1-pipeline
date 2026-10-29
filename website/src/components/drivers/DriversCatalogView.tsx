"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { DriverCatalogItem } from "@/types/f1";
import { getDriverProfileUrl } from "@/lib/driverUtils";
import { TeamLink } from "@/lib/teamUtils";
import {
  Trophy,
  Flag,
  Search,
  Award,
  ChevronRight,
  Timer,
  Calendar,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Table2,
  Users,
  Shield,
  Zap,
  RotateCcw
} from "lucide-react";

interface Props {
  drivers: DriverCatalogItem[];
}

type FilterCategory = "active" | "champions" | "winners" | "all";

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemName = "pilotos"
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-white/10 bg-[#0A0A10]/60 rounded-b-2xl text-xs">
      <span className="text-f1-subtle font-mono text-[11px]">
        Exibindo <strong className="text-white">{startItem}–{endItem}</strong> de <strong className="text-white">{totalItems}</strong> {itemName}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold transition-all text-[11px]"
        >
          Anterior
        </button>
        <span className="px-2 font-mono text-[11px] font-bold text-white/80">
          Pág. {currentPage} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold transition-all text-[11px]"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

function TableSortHeader({
  label,
  columnKey,
  currentSortKey,
  currentSortDir,
  onSort,
  align = "left",
  className = ""
}: {
  label: string;
  columnKey: string;
  currentSortKey: string | null;
  currentSortDir: "asc" | "desc";
  onSort: (key: string) => void;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  const isActive = currentSortKey === columnKey;
  const justifyClass =
    align === "center"
      ? "justify-center"
      : align === "right"
      ? "justify-end"
      : "justify-start";

  return (
    <th
      onClick={() => onSort(columnKey)}
      className={`py-3 px-3 cursor-pointer select-none transition-colors group hover:text-white ${
        isActive ? "text-white bg-white/[0.08]" : "text-f1-subtle"
      } ${className}`}
      title={`Clique para ordenar por ${label}`}
    >
      <div className={`inline-flex items-center gap-1 w-full ${justifyClass}`}>
        <span>{label}</span>
        {isActive ? (
          currentSortDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-f1-red shrink-0" />
          ) : (
            <ArrowDown className="h-3 w-3 text-f1-red shrink-0" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-25 group-hover:opacity-80 transition-opacity shrink-0" />
        )}
      </div>
    </th>
  );
}

const DRIVERS_PER_PAGE = 12;

export default function DriversCatalogView({ drivers }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterCategory>("active");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Ordenação
  const [sortKey, setSortKey] = useState<string>("total_world_championships");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Estatísticas de contagem
  const activeCount = useMemo(
    () => drivers.filter((d) => d.is_active).length,
    [drivers]
  );
  const championsCount = useMemo(
    () => drivers.filter((d) => d.total_world_championships > 0).length,
    [drivers]
  );
  const winnersCount = useMemo(
    () => drivers.filter((d) => d.total_wins > 0).length,
    [drivers]
  );

  const handleSort = (key: string) => {
    setCurrentPage(1);
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleFilterChange = (cat: FilterCategory) => {
    setFilter(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  // Filtragem e ordenação
  const filteredDrivers = useMemo(() => {
    let result = drivers.filter((driver) => {
      if (searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase().trim();
        const matchName = driver.driver_full_name.toLowerCase().includes(q);
        const matchAbbr = driver.driver_abbreviation?.toLowerCase().includes(q);
        const matchTeam = driver.team_name?.toLowerCase().includes(q);
        const matchNat = driver.driver_nationality?.toLowerCase().includes(q);
        if (!matchName && !matchAbbr && !matchTeam && !matchNat) {
          return false;
        }
      }

      if (filter === "active") return driver.is_active;
      if (filter === "champions") return driver.total_world_championships > 0;
      if (filter === "winners") return driver.total_wins > 0;
      return true;
    });

    result.sort((a: any, b: any) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (typeof valA === "string") {
        return sortDir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      // Tiebreaker por vitórias se ordenar por títulos
      if (sortKey === "total_world_championships" && valA === valB) {
        return b.total_wins - a.total_wins;
      }

      return sortDir === "asc" ? valA - valB : valB - valA;
    });

    return result;
  }, [drivers, searchTerm, filter, sortKey, sortDir]);

  // Paginação
  const totalPages = Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE) || 1;
  const paginatedDrivers = useMemo(() => {
    const start = (currentPage - 1) * DRIVERS_PER_PAGE;
    return filteredDrivers.slice(start, start + DRIVERS_PER_PAGE);
  }, [filteredDrivers, currentPage]);

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* BARRA DE CONTROLES COMPACTA (TOOLBAR ANALÍTICA)                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl border border-white/10 bg-[#0E0E14] shadow-md">
        {/* Lado Esquerdo: Campo de Busca Instantâneo */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-f1-subtle" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por piloto, equipe, país ou sigla..."
            className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-8 py-1.5 text-xs text-white placeholder-f1-subtle outline-none transition-colors hover:border-white/20 focus:border-f1-red font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-f1-subtle hover:text-white"
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        {/* Lado Direito: Filtros Rápidos + Alternador Grid/Tabela */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          {/* Filtros em Pílulas */}
          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => handleFilterChange("active")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "active"
                  ? "bg-f1-red text-white shadow-sm shadow-f1-red/30"
                  : "text-f1-subtle hover:text-white"
              }`}
            >
              Grid 2026 ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("champions")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "champions"
                  ? "bg-f1-red text-white shadow-sm shadow-f1-red/30"
                  : "text-f1-subtle hover:text-white"
              }`}
            >
              Campeões ({championsCount})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("winners")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "winners"
                  ? "bg-f1-red text-white shadow-sm shadow-f1-red/30"
                  : "text-f1-subtle hover:text-white"
              }`}
            >
              Vencedores ({winnersCount})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "all"
                  ? "bg-f1-red text-white shadow-sm shadow-f1-red/30"
                  : "text-f1-subtle hover:text-white"
              }`}
            >
              Todos ({drivers.length})
            </button>
          </div>

          {/* Alternador de Modo: Cards vs Tabela */}
          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-white/10 text-white"
                  : "text-f1-subtle hover:text-white"
              }`}
              title="Visualização em Cards Compactos"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-white/10 text-white"
                  : "text-f1-subtle hover:text-white"
              }`}
              title="Visualização em Tabela Analítica de Telemetria"
            >
              <Table2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contador de Resultados e Reset */}
      <div className="flex items-center justify-between text-xs text-f1-subtle px-1">
        <span>
          Encontrados: <strong className="text-white font-mono">{filteredDrivers.length}</strong> de {drivers.length} pilotos
        </span>
        {(searchTerm || filter !== "active") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFilter("active");
              setCurrentPage(1);
            }}
            className="flex items-center gap-1 text-[11px] text-f1-red hover:underline"
          >
            <RotateCcw className="h-3 w-3" />
            Restaurar filtros
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* NENHUM RESULTADO                                                          */}
      {/* ========================================================================= */}
      {filteredDrivers.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-10 text-center space-y-2">
          <Users className="h-8 w-8 text-f1-subtle mx-auto opacity-50" />
          <p className="text-sm font-bold text-white">Nenhum piloto encontrado</p>
          <p className="text-xs text-f1-subtle">
            Tente buscar com outros termos ou altere o filtro de categoria selecionado.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO 1: CARDS COMPACTOS (40% MENORES COM ALTA DENSIDADE)                  */}
      {/* ========================================================================= */}
      {viewMode === "grid" && filteredDrivers.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {paginatedDrivers.map((driver) => {
              const teamColor = driver.team_color || "#E10600";
              const isChampion = driver.total_world_championships > 0;
              const profileUrl = getDriverProfileUrl(driver.driver_id, driver.driver_full_name);

              return (
                <Link
                  key={driver.driver_id}
                  href={profileUrl}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E14] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:shadow-xl"
                >
                  {/* Linha superior com a cor da equipe */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                    style={{ backgroundColor: teamColor }}
                  />

                  {/* Topo do Card: Badge de Título/Status e Sigla */}
                  <div className="flex items-center justify-between gap-1.5 mb-2.5 pt-0.5">
                    {isChampion ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.2 text-[10px] font-black uppercase text-amber-400">
                        <Trophy className="h-2.5 w-2.5" />
                        {driver.total_world_championships}x Campeão
                      </span>
                    ) : driver.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.2 text-[10px] font-bold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Grid 2026
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-f1-subtle">
                        {driver.first_season}–{driver.last_season}
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-white/50">
                      {driver.driver_abbreviation && (
                        <span className="bg-white/5 px-1 py-0.2 rounded border border-white/5 text-white/70">
                          {driver.driver_abbreviation}
                        </span>
                      )}
                      <span>{driver.driver_nationality}</span>
                    </div>
                  </div>

                  {/* Foto e Identificação */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0B0B10]">
                      {driver.driver_headshot_url ? (
                        <img
                          src={driver.driver_headshot_url}
                          alt={driver.driver_full_name}
                          className="h-full w-full object-cover object-top transition-transform duration-200 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-xs font-black text-white"
                          style={{
                            background: `linear-gradient(135deg, #181824 0%, ${teamColor}33 100%)`
                          }}
                        >
                          {driver.driver_abbreviation || driver.driver_full_name.substring(0, 3).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-white tracking-tight truncate group-hover:underline decoration-white/40 transition-colors">
                        {driver.driver_full_name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: teamColor }}
                        />
                        <span className="text-[11px] font-semibold text-f1-subtle truncate">
                          {driver.team_name || "Fórmula 1"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Régua de 3 Estatísticas */}
                  <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-xl bg-black/40 p-1.5 border border-white/5 text-center font-mono">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-f1-subtle">GPs</span>
                      <span className="text-xs font-bold text-white">{driver.total_gps}</span>
                    </div>
                    <div className="border-x border-white/5">
                      <span className="block text-[9px] uppercase font-bold text-f1-subtle">Vitórias</span>
                      <span className={`text-xs font-black ${driver.total_wins > 0 ? "text-amber-400" : "text-white/60"}`}>
                        {driver.total_wins}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-f1-subtle">Pódios</span>
                      <span className={`text-xs font-black ${driver.total_podiums > 0 ? "text-blue-300" : "text-white/60"}`}>
                        {driver.total_podiums}
                      </span>
                    </div>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-f1-subtle">
                    <span className="font-mono text-zinc-400">
                      {driver.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pts
                    </span>
                    <span className="flex items-center gap-0.5 font-bold text-white group-hover:underline decoration-white/40 transition-colors">
                      Acessar <ChevronRight className="h-3 w-3 text-f1-subtle group-hover:text-white" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDrivers.length}
            pageSize={DRIVERS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemName="pilotos"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO 2: TABELA ANALÍTICA DE ALTA DENSIDADE (TELEMETRIA TOTAL)             */}
      {/* ========================================================================= */}
      {viewMode === "table" && filteredDrivers.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 bg-[#12121A] uppercase text-[11px]">
                  <TableSortHeader
                    label="Piloto"
                    columnKey="driver_full_name"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                  <TableSortHeader
                    label="Equipe"
                    columnKey="team_name"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                  <TableSortHeader
                    label="Títulos"
                    columnKey="total_world_championships"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                  <TableSortHeader
                    label="GPs"
                    columnKey="total_gps"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                  <TableSortHeader
                    label="Vitórias"
                    columnKey="total_wins"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                  <TableSortHeader
                    label="Pódios"
                    columnKey="total_podiums"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                  <TableSortHeader
                    label="Poles"
                    columnKey="race_poles"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                  <TableSortHeader
                    label="Voltas Rápidas"
                    columnKey="total_fastest_laps"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                  <TableSortHeader
                    label="Pontos"
                    columnKey="total_points"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <th className="py-3 px-3 text-center">Taxa Vit.</th>
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedDrivers.map((driver) => {
                  const teamColor = driver.team_color || "#E10600";
                  const profileUrl = getDriverProfileUrl(driver.driver_id, driver.driver_full_name);
                  const isChampion = driver.total_world_championships > 0;
                  const winRate = driver.total_gps > 0 ? ((driver.total_wins / driver.total_gps) * 100).toFixed(1) : "0.0";

                  return (
                    <tr
                      key={driver.driver_id}
                      className="hover:bg-white/[0.04] transition-colors group"
                    >
                      {/* Piloto */}
                      <td className="py-2.5 px-3">
                        <Link href={profileUrl} className="flex items-center gap-2.5 font-sans">
                          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0B0B10]">
                            {driver.driver_headshot_url ? (
                              <img
                                src={driver.driver_headshot_url}
                                alt={driver.driver_full_name}
                                className="h-full w-full object-cover object-top"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-white">
                                {driver.driver_abbreviation || driver.driver_full_name.substring(0, 3)}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white group-hover:underline decoration-white/40 transition-colors block text-xs">
                              {driver.driver_full_name}
                            </span>
                            <span className="text-[10px] text-f1-subtle font-mono block">
                              {driver.driver_nationality} · {driver.driver_abbreviation || "—"}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Equipe */}
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: teamColor }}
                          />
                          {driver.team_name ? (
                            <TeamLink
                              teamName={driver.team_name}
                              className="text-white text-xs truncate max-w-[140px] hover:underline decoration-white/30 underline-offset-2 hover:text-white transition-colors"
                              title={`Ver perfil de ${driver.team_name}`}
                            >
                              {driver.team_name}
                            </TeamLink>
                          ) : (
                            <span className="text-white/40 text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* Títulos */}
                      <td className="py-2.5 px-3 text-center">
                        {isChampion ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[11px]">
                            <Trophy className="h-2.5 w-2.5" />
                            {driver.total_world_championships}x
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>

                      {/* GPs */}
                      <td className="py-2.5 px-3 text-center font-bold text-white">
                        {driver.total_gps}
                      </td>

                      {/* Vitórias */}
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={driver.total_wins > 0 ? "text-amber-400" : "text-white/30"}>
                          {driver.total_wins}
                        </span>
                      </td>

                      {/* Pódios */}
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={driver.total_podiums > 0 ? "text-blue-300" : "text-white/30"}>
                          {driver.total_podiums}
                        </span>
                      </td>

                      {/* Poles */}
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={driver.race_poles > 0 ? "text-purple-300" : "text-white/30"}>
                          {driver.race_poles}
                        </span>
                      </td>

                      {/* Voltas Rápidas */}
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={driver.total_fastest_laps > 0 ? "text-emerald-400" : "text-white/30"}>
                          {driver.total_fastest_laps}
                        </span>
                      </td>

                      {/* Pontos */}
                      <td className="py-2.5 px-3 text-right font-black text-white">
                        {driver.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                      </td>

                      {/* Taxa de Vitória */}
                      <td className="py-2.5 px-3 text-center text-f1-subtle text-[11px]">
                        {winRate}%
                      </td>

                      {/* Ação */}
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={profileUrl}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <span>Perfil</span>
                          <ChevronRight className="h-3 w-3 text-f1-subtle" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDrivers.length}
            pageSize={DRIVERS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemName="pilotos"
          />
        </div>
      )}
    </div>
  );
}
