"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ConstructorCatalogItem } from "@/types/f1";
import { getTeamProfileUrl, getTeamAbbreviation } from "@/lib/teamUtils";
import {
  Trophy,
  Flag,
  Search,
  Award,
  ChevronRight,
  Shield,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Table2,
  Zap,
  RotateCcw
} from "lucide-react";

interface Props {
  constructors: ConstructorCatalogItem[];
}

type FilterCategory = "active" | "champions" | "winners" | "all";

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemName = "equipes"
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

const TEAMS_PER_PAGE = 12;

export default function ConstructorsCatalogView({ constructors }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterCategory>("active");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Ordenação
  const [sortKey, setSortKey] = useState<string>("total_world_championships");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Estatísticas de contagem
  const activeCount = useMemo(
    () => constructors.filter((c) => c.is_active).length,
    [constructors]
  );
  const championsCount = useMemo(
    () => constructors.filter((c) => c.total_world_championships > 0).length,
    [constructors]
  );
  const winnersCount = useMemo(
    () => constructors.filter((c) => c.total_wins > 0).length,
    [constructors]
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
  const filteredConstructors = useMemo(() => {
    let result = constructors.filter((team) => {
      if (searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase().trim();
        const matchName = team.team_name.toLowerCase().includes(q);
        const matchId = team.team_id.toLowerCase().includes(q);
        const abbr = getTeamAbbreviation(team.team_name, team.team_id).toLowerCase();
        if (!matchName && !matchId && !abbr.includes(q)) {
          return false;
        }
      }

      if (filter === "active") return team.is_active;
      if (filter === "champions") return team.total_world_championships > 0;
      if (filter === "winners") return team.total_wins > 0;
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
  }, [constructors, searchTerm, filter, sortKey, sortDir]);

  // Paginação
  const totalPages = Math.ceil(filteredConstructors.length / TEAMS_PER_PAGE) || 1;
  const paginatedConstructors = useMemo(() => {
    const start = (currentPage - 1) * TEAMS_PER_PAGE;
    return filteredConstructors.slice(start, start + TEAMS_PER_PAGE);
  }, [filteredConstructors, currentPage]);

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
            placeholder="Buscar por equipe, sigla ou identificador..."
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
              Campeãs ({championsCount})
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
              Vencedoras ({winnersCount})
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
              Todas ({constructors.length})
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
          Encontradas: <strong className="text-white font-mono">{filteredConstructors.length}</strong> de {constructors.length} equipes
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
      {filteredConstructors.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] p-10 text-center space-y-2">
          <Shield className="h-8 w-8 text-f1-subtle mx-auto opacity-50" />
          <p className="text-sm font-bold text-white">Nenhuma equipe encontrada</p>
          <p className="text-xs text-f1-subtle">
            Tente buscar com outros termos ou altere o filtro de categoria selecionado.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO 1: CARDS COMPACTOS (40% MENORES COM ALTA DENSIDADE)                  */}
      {/* ========================================================================= */}
      {viewMode === "grid" && filteredConstructors.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {paginatedConstructors.map((team) => {
              const teamColor = team.team_color || "#E10600";
              const isChampion = team.total_world_championships > 0;
              const profileUrl = getTeamProfileUrl(team.team_id, team.team_name);
              const teamAbbr = getTeamAbbreviation(team.team_name, team.team_id);

              return (
                <Link
                  key={team.team_id}
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
                        {team.total_world_championships}x Campeã
                      </span>
                    ) : team.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.2 text-[10px] font-bold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Grid 2026
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-f1-subtle">
                        {team.first_season}–{team.last_season}
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-white/50">
                      <span className="bg-white/5 px-1.5 py-0.2 rounded border border-white/5 text-white/70">
                        {teamAbbr}
                      </span>
                    </div>
                  </div>

                  {/* Emblema Estilizado e Nome */}
                  <div className="flex items-center gap-3 my-1">
                    <div
                      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0B0B10] flex flex-col items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-inner"
                      style={{
                        background: `linear-gradient(135deg, #181824 0%, ${teamColor}33 100%)`
                      }}
                    >
                      <div
                        className="h-1 w-4 rounded-full mb-0.5"
                        style={{ backgroundColor: teamColor }}
                      />
                      <span className="text-xs font-black text-white font-mono tracking-wider">
                        {teamAbbr}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-white tracking-tight truncate group-hover:underline decoration-white/40 transition-colors">
                        {team.team_name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: teamColor }}
                        />
                        <span className="text-[11px] font-semibold text-f1-subtle truncate">
                          {team.total_seasons} {team.total_seasons === 1 ? "temporada" : "temporadas"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Régua de 3 Estatísticas */}
                  <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-xl bg-black/40 p-1.5 border border-white/5 text-center font-mono">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-f1-subtle">GPs</span>
                      <span className="text-xs font-bold text-white">{team.total_gps}</span>
                    </div>
                    <div className="border-x border-white/5">
                      <span className="block text-[9px] uppercase font-bold text-f1-subtle">Vitórias</span>
                      <span className={`text-xs font-black ${team.total_wins > 0 ? "text-amber-400" : "text-white/60"}`}>
                        {team.total_wins}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-f1-subtle">Dobradinhas</span>
                      <span className={`text-xs font-black ${team.total_one_two > 0 ? "text-purple-300" : "text-white/60"}`}>
                        {team.total_one_two}
                      </span>
                    </div>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-f1-subtle">
                    <span className="font-mono text-zinc-400">
                      {team.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pts
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
            totalItems={filteredConstructors.length}
            pageSize={TEAMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemName="equipes"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO 2: TABELA ANALÍTICA DE ALTA DENSIDADE (TELEMETRIA TOTAL)             */}
      {/* ========================================================================= */}
      {viewMode === "table" && filteredConstructors.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0E0E14] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 bg-[#12121A] uppercase text-[11px]">
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
                    label="Dobradinhas 1-2"
                    columnKey="total_one_two"
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
                    label="1ª Fila (Front Row)"
                    columnKey="total_front_row"
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
                {paginatedConstructors.map((team) => {
                  const teamColor = team.team_color || "#E10600";
                  const profileUrl = getTeamProfileUrl(team.team_id, team.team_name);
                  const isChampion = team.total_world_championships > 0;
                  const teamAbbr = getTeamAbbreviation(team.team_name, team.team_id);
                  const winRate = team.total_gps > 0 ? ((team.total_wins / team.total_gps) * 100).toFixed(1) : "0.0";

                  return (
                    <tr
                      key={team.team_id}
                      className="hover:bg-white/[0.04] transition-colors group"
                    >
                      {/* Equipe / Construtor */}
                      <td className="py-2.5 px-3">
                        <Link href={profileUrl} className="flex items-center gap-2.5 font-sans">
                          <div
                            className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-white/10 flex items-center justify-center font-mono font-black text-[10px] text-white"
                            style={{
                              background: `linear-gradient(135deg, #181824 0%, ${teamColor}33 100%)`
                            }}
                          >
                            {teamAbbr}
                          </div>
                          <div>
                            <span className="font-bold text-white group-hover:underline decoration-white/40 transition-colors block text-xs">
                              {team.team_name}
                            </span>
                            <span className="text-[10px] text-f1-subtle font-mono block">
                              {team.total_seasons} temporadas ({team.first_season}–{team.last_season})
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Títulos */}
                      <td className="py-2.5 px-3 text-center">
                        {isChampion ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[11px]">
                            <Trophy className="h-2.5 w-2.5" />
                            {team.total_world_championships}x
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>

                      {/* GPs */}
                      <td className="py-2.5 px-3 text-center font-bold text-white">
                        {team.total_gps}
                      </td>

                      {/* Vitórias */}
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={team.total_wins > 0 ? "text-amber-400" : "text-white/30"}>
                          {team.total_wins}
                        </span>
                      </td>

                      {/* Dobradinhas 1-2 */}
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={team.total_one_two > 0 ? "text-purple-300" : "text-white/30"}>
                          {team.total_one_two}
                        </span>
                      </td>

                      {/* Pódios */}
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={team.total_podiums > 0 ? "text-blue-300" : "text-white/30"}>
                          {team.total_podiums}
                        </span>
                      </td>

                      {/* Poles */}
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={team.race_poles > 0 ? "text-purple-300" : "text-white/30"}>
                          {team.race_poles}
                        </span>
                      </td>

                      {/* 1ª Fila */}
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={team.total_front_row > 0 ? "text-white" : "text-white/30"}>
                          {team.total_front_row}
                        </span>
                      </td>

                      {/* Pontos */}
                      <td className="py-2.5 px-3 text-right font-black text-white">
                        {team.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
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
                          <span>Equipe</span>
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
            totalItems={filteredConstructors.length}
            pageSize={TEAMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemName="equipes"
          />
        </div>
      )}
    </div>
  );
}
