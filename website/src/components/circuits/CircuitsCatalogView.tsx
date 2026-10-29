"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { CircuitOverviewItem } from "@/types/f1";
import { getCountryFlag, getTrackTypeBadge, formatSeasonsRanges } from "@/lib/circuitUtils";
import DriverLink from "@/lib/driverUtils";
import { TeamLink } from "@/lib/teamUtils";
import {
  Search,
  Flag,
  Trophy,
  Zap,
  ChevronRight,
  Timer,
  Shield,
  Layers,
  MapPin,
  LayoutGrid,
  Table2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RotateCcw,
  Calendar,
  AlertTriangle
} from "lucide-react";

interface CircuitsCatalogViewProps {
  circuits: CircuitOverviewItem[];
}

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemName = "circuitos"
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

const CIRCUITS_PER_PAGE = 12;

export default function CircuitsCatalogView({ circuits }: CircuitsCatalogViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Ordenação
  const [sortKey, setSortKey] = useState<string>("total_gps_completed");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Tipos de pista disponíveis
  const permanentCount = useMemo(
    () => circuits.filter((c) => (c.track_type || "").toLowerCase() === "permanent").length,
    [circuits]
  );
  const streetCount = useMemo(
    () => circuits.filter((c) => (c.track_type || "").toLowerCase() === "street").length,
    [circuits]
  );

  const handleSort = (key: string) => {
    setCurrentPage(1);
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "circuit_name" || key === "country" ? "asc" : "desc");
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const filteredAndSortedCircuits = useMemo(() => {
    let list = circuits.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.circuit_name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        (c.circuit_id && c.circuit_id.toLowerCase().includes(q)) ||
        (c.most_wins_driver && c.most_wins_driver.toLowerCase().includes(q)) ||
        (c.most_wins_team && c.most_wins_team.toLowerCase().includes(q));

      const matchesType =
        selectedType === "all" ||
        (c.track_type && c.track_type.toLowerCase() === selectedType.toLowerCase());

      return matchesSearch && matchesType;
    });

    list.sort((a: any, b: any) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (typeof valA === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === "asc" ? valA - valB : valB - valA;
    });

    return list;
  }, [circuits, searchTerm, selectedType, sortKey, sortDir]);

  const totalPages = Math.ceil(filteredAndSortedCircuits.length / CIRCUITS_PER_PAGE) || 1;
  const paginatedCircuits = useMemo(() => {
    const start = (currentPage - 1) * CIRCUITS_PER_PAGE;
    return filteredAndSortedCircuits.slice(start, start + CIRCUITS_PER_PAGE);
  }, [filteredAndSortedCircuits, currentPage]);

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
            placeholder="Buscar por autódromo, país, cidade ou piloto..."
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
              onClick={() => handleTypeChange("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedType === "all"
                  ? "bg-f1-red text-white shadow-sm shadow-f1-red/30"
                  : "text-f1-subtle hover:text-white"
              }`}
            >
              Todos ({circuits.length})
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("permanent")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedType === "permanent"
                  ? "bg-f1-red text-white shadow-sm shadow-f1-red/30"
                  : "text-f1-subtle hover:text-white"
              }`}
            >
              Permanentes ({permanentCount})
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("street")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedType === "street"
                  ? "bg-f1-red text-white shadow-sm shadow-f1-red/30"
                  : "text-f1-subtle hover:text-white"
              }`}
            >
              Circuitos de Rua ({streetCount})
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
          Encontrados: <strong className="text-white font-mono">{filteredAndSortedCircuits.length}</strong> de {circuits.length} circuitos
        </span>
        {(searchTerm || selectedType !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedType("all");
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
      {filteredAndSortedCircuits.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-10 text-center space-y-2">
          <MapPin className="h-8 w-8 text-f1-subtle mx-auto opacity-50" />
          <p className="text-sm font-bold text-white">Nenhum circuito encontrado</p>
          <p className="text-xs text-f1-subtle">
            Tente buscar com outros termos ou altere o filtro de categoria selecionado.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO 1: CARDS COMPACTOS (40% MENORES - 4 COLUNAS, MESMA ALTURA DE ~150PX)  */}
      {/* ========================================================================= */}
      {viewMode === "grid" && filteredAndSortedCircuits.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {paginatedCircuits.map((c) => {
              const flag = getCountryFlag(c.country);
              const badge = getTrackTypeBadge(c.track_type);
              const teamColor = c.most_wins_team_color || "#E10600";
              const yearsText = formatSeasonsRanges(
                c.years_held || c.seasons_list || (c.first_gp_year ? [c.first_gp_year, c.last_gp_year || c.first_gp_year] : [])
              );

              return (
                <Link
                  key={c.circuit_id}
                  href={`/circuits/${c.circuit_id}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E14] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:shadow-xl"
                >
                  {/* Linha superior com a cor da equipe mais vitoriosa */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                    style={{ backgroundColor: teamColor }}
                  />

                  {/* Topo do Card: Badge de Tipo e Código da Pista */}
                  <div className="flex items-center justify-between gap-1.5 mb-2.5 pt-0.5">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider ${badge.badgeClass}`}>
                      {badge.label}
                    </span>

                    <span className="text-[10px] font-mono font-bold bg-white/5 px-1.5 py-0.2 rounded border border-white/5 text-white/70">
                      {c.circuit_id.toUpperCase()}
                    </span>
                  </div>

                  {/* Bandeira e Identificação do Autódromo */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0B0B10] flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform duration-200">
                      <span role="img" aria-label={c.country}>
                        {flag}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-white tracking-tight truncate group-hover:underline decoration-white/40 transition-colors">
                        {c.circuit_name}
                      </h3>
                      <p className="text-[11px] font-medium text-f1-subtle truncate mt-0.5">
                        {c.location}, {c.country}
                      </p>
                    </div>
                  </div>

                  {/* Mini Régua de 3 Estatísticas */}
                  <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-xl bg-black/40 p-1.5 border border-white/5 text-center font-mono">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-f1-subtle">GPs</span>
                      <span className="text-xs font-bold text-white">{c.total_gps_completed}</span>
                    </div>
                    <div className="border-x border-white/5">
                      <span className="block text-[9px] uppercase font-bold text-f1-subtle">Recorde</span>
                      <span className="text-xs font-bold text-purple-300 truncate block">
                        {c.race_lap_record_formatted || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-f1-subtle">Média DNF</span>
                      <span className="text-xs font-bold text-amber-400">
                        {c.avg_dnfs_per_race}
                      </span>
                    </div>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-f1-subtle">
                    <span className="font-mono text-zinc-400 truncate max-w-[150px]" title={`Temporadas com GP: ${c.seasons_list || ""}`}>
                      {yearsText}
                    </span>
                    <span className="flex items-center gap-0.5 font-bold text-white group-hover:underline decoration-white/40 transition-colors shrink-0">
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
            totalItems={filteredAndSortedCircuits.length}
            pageSize={CIRCUITS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemName="circuitos"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO 2: TABELA ANALÍTICA DE ALTA DENSIDADE (TELEMETRIA TOTAL)             */}
      {/* ========================================================================= */}
      {viewMode === "table" && filteredAndSortedCircuits.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 bg-[#12121A] uppercase text-[11px]">
                  <TableSortHeader
                    label="Autódromo / País"
                    columnKey="circuit_name"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                  <TableSortHeader
                    label="Tipo"
                    columnKey="track_type"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                  <TableSortHeader
                    label="GPs"
                    columnKey="total_gps_completed"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                  <th className="py-3 px-3 text-center">Temporadas com GP</th>
                  <TableSortHeader
                    label="Recorde de Corrida"
                    columnKey="race_lap_record_formatted"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="py-3 px-3">Maior Vencedor</th>
                  <th className="py-3 px-3">Equipe Top</th>
                  <TableSortHeader
                    label="Média DNF"
                    columnKey="avg_dnfs_per_race"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedCircuits.map((c) => {
                  const flag = getCountryFlag(c.country);
                  const badge = getTrackTypeBadge(c.track_type);
                  const teamColor = c.most_wins_team_color || "#E10600";
                  const yearsText = formatSeasonsRanges(
                    c.years_held || c.seasons_list || (c.first_gp_year ? [c.first_gp_year, c.last_gp_year || c.first_gp_year] : [])
                  );

                  return (
                    <tr
                      key={c.circuit_id}
                      className="hover:bg-white/[0.04] transition-colors group"
                    >
                      {/* Autódromo */}
                      <td className="py-2.5 px-3">
                        <Link href={`/circuits/${c.circuit_id}`} className="flex items-center gap-2.5 font-sans">
                          <span className="text-xl shrink-0" role="img" aria-label={c.country}>
                            {flag}
                          </span>
                          <div>
                            <span className="font-bold text-white group-hover:underline decoration-white/40 transition-colors block text-xs">
                              {c.circuit_name}
                            </span>
                            <span className="text-[10px] text-f1-subtle font-mono block">
                              {c.location}, {c.country}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Tipo */}
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider font-sans ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* GPs */}
                      <td className="py-2.5 px-3 text-center font-bold text-white">
                        {c.total_gps_completed}
                      </td>

                      {/* Temporadas com GP */}
                      <td className="py-2.5 px-3 text-center text-f1-subtle text-[11px] whitespace-nowrap" title={c.seasons_list ? `Temporadas: ${c.seasons_list}` : undefined}>
                        <span>{yearsText}</span>
                      </td>

                      {/* Recorde de Corrida */}
                      <td className="py-2.5 px-3">
                        {c.race_lap_record_formatted ? (
                          <div>
                            <span className="font-bold text-purple-300 block">
                              {c.race_lap_record_formatted}
                            </span>
                            <span className="text-[10px] text-f1-subtle block font-sans truncate max-w-[130px]">
                              {c.race_lap_record_driver || "Sem registro"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>

                      {/* Maior Vencedor */}
                      <td className="py-2.5 px-3 font-sans">
                        {c.most_wins_driver ? (
                          <div className="flex items-center gap-1.5">
                            <Trophy className="h-3 w-3 text-amber-400 shrink-0" />
                            <div className="truncate max-w-[130px]">
                              <DriverLink
                                driverName={c.most_wins_driver}
                                className="font-bold text-white block text-xs truncate hover:text-white hover:underline decoration-white/30 transition-colors"
                                title={`Ver perfil de ${c.most_wins_driver}`}
                              >
                                {c.most_wins_driver}
                              </DriverLink>
                              <span className="text-[10px] text-f1-subtle font-mono block">
                                {c.most_wins_count} {c.most_wins_count === 1 ? "vitória" : "vitórias"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>

                      {/* Equipe Top */}
                      <td className="py-2.5 px-3 font-sans">
                        {c.most_wins_team ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: teamColor }}
                            />
                            <TeamLink
                              teamName={c.most_wins_team}
                              className="text-white text-xs truncate max-w-[120px] hover:underline decoration-white/30 underline-offset-2 hover:text-white transition-colors"
                              title={`Ver perfil de ${c.most_wins_team}`}
                            >
                              {c.most_wins_team}
                            </TeamLink>
                          </div>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>

                      {/* Média DNF */}
                      <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                        {c.avg_dnfs_per_race}
                      </td>

                      {/* Ação */}
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={`/circuits/${c.circuit_id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <span>Pista</span>
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
            totalItems={filteredAndSortedCircuits.length}
            pageSize={CIRCUITS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemName="circuitos"
          />
        </div>
      )}
    </div>
  );
}
