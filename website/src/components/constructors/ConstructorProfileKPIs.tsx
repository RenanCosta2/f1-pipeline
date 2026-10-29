"use client";

import React from "react";
import { ConstructorCatalogItem } from "@/types/f1";
import {
  Trophy,
  Zap,
  Flag,
  Layers,
  Crown,
  Award,
  TrendingUp,
  Sparkles,
  Gauge,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

interface Props {
  profile: ConstructorCatalogItem;
}

function RankBadge({ rank, label }: { rank?: number; label?: string }) {
  if (!rank) return null;
  const isTop1 = rank === 1;
  const isTop3 = rank <= 3;
  const isTop10 = rank <= 10;

  if (isTop1) {
    return (
      <span className="font-mono text-xs font-black text-amber-400 tracking-wider">
        #1 {label ? label.toUpperCase() : "HISTÓRICO"}
      </span>
    );
  }

  if (isTop3) {
    return (
      <span className="font-mono text-xs font-bold text-slate-200 tracking-wider">
        #{rank} {label ? label.toUpperCase() : "HISTÓRICO"}
      </span>
    );
  }

  if (isTop10) {
    return (
      <span className="font-mono text-[11px] font-semibold text-sky-300 tracking-wider">
        #{rank} {label ? label.toUpperCase() : ""}
      </span>
    );
  }

  return (
    <span className="font-mono text-[11px] text-white/40">
      #{rank}
    </span>
  );
}

export default function ConstructorProfileKPIs({ profile }: Props) {
  const avgPoints = profile.total_gps > 0
    ? (profile.total_points / profile.total_gps).toFixed(1)
    : "0.0";
  const dnfRate = profile.total_gps > 0
    ? (((profile.total_dnfs || 0) / profile.total_gps) * 100).toFixed(1)
    : "0.0";

  // Identifica os maiores feitos históricos da equipe para a faixa de destaques
  interface HistoricalAchievement {
    label: string;
    detail: string;
    rank: number;
    icon: any;
    isRecord: boolean;
  }

  const achievements: HistoricalAchievement[] = [];

  if (profile.rank_world_championships && profile.rank_world_championships <= 5 && profile.total_world_championships > 0) {
    achievements.push({
      label: profile.rank_world_championships === 1 ? "Maior Campeã de Construtores" : `#${profile.rank_world_championships} Maior Campeã`,
      detail: `${profile.total_world_championships} Títulos`,
      rank: profile.rank_world_championships,
      icon: Trophy,
      isRecord: profile.rank_world_championships === 1
    });
  }

  const raceWinsRank = profile.rank_race_wins || profile.rank_total_wins;
  if (raceWinsRank && raceWinsRank <= 5 && profile.race_wins > 0) {
    achievements.push({
      label: raceWinsRank === 1 ? "Recordista em Vitórias GP" : `#${raceWinsRank} Maior em Vitórias`,
      detail: `${profile.race_wins} Vitórias`,
      rank: raceWinsRank,
      icon: Crown,
      isRecord: raceWinsRank === 1
    });
  }

  if (profile.total_one_two > 0) {
    achievements.push({
      label: "Dobradinhas (1-2)",
      detail: `${profile.total_one_two} vezes`,
      rank: 3,
      icon: ShieldCheck,
      isRecord: profile.total_one_two >= 50
    });
  }

  if (profile.rank_poles && profile.rank_poles <= 5 && profile.race_poles > 0) {
    achievements.push({
      label: profile.rank_poles === 1 ? "Recordista em Pole Positions" : `#${profile.rank_poles} Maior em Poles`,
      detail: `${profile.race_poles} Poles`,
      rank: profile.rank_poles,
      icon: Zap,
      isRecord: profile.rank_poles === 1
    });
  }

  const racePodiumsRank = profile.rank_race_podiums || profile.rank_total_podiums;
  if (racePodiumsRank && racePodiumsRank <= 5 && profile.total_podiums > 0) {
    achievements.push({
      label: racePodiumsRank === 1 ? "Recordista em Pódios" : `#${racePodiumsRank} Maior em Pódios`,
      detail: `${profile.total_podiums} Pódios`,
      rank: racePodiumsRank,
      icon: Award,
      isRecord: racePodiumsRank === 1
    });
  }

  if (profile.rank_points && profile.rank_points <= 5 && profile.total_points > 0) {
    achievements.push({
      label: profile.rank_points === 1 ? "Maior Pontuadora da História" : `#${profile.rank_points} Maior Pontuadora`,
      detail: `${profile.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pts`,
      rank: profile.rank_points,
      icon: TrendingUp,
      isRecord: profile.rank_points === 1
    });
  }

  if (profile.rank_gps && profile.rank_gps <= 3 && profile.total_gps > 0) {
    achievements.push({
      label: profile.rank_gps === 1 ? "Recordista de GPs Disputados" : `#${profile.rank_gps} em GPs Disputados`,
      detail: `${profile.total_gps} GPs`,
      rank: profile.rank_gps,
      icon: Flag,
      isRecord: profile.rank_gps === 1
    });
  }

  const topAchievements = achievements.sort((a, b) => a.rank - b.rank).slice(0, 5);

  return (
    <div>
      {/* Título de Seção Compacto e Industrial (Idêntico ao do Piloto) */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
        <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
          Raio-X Histórico & Recordes da Escuderia
        </h2>
        <span className="text-[11px] text-white/40 font-mono">
          ERA MODERNA (2013–2026)
        </span>
      </div>

      {/* Faixa Dinâmica de Destaques Históricos */}
      {topAchievements.length > 0 && (
        <div className="mb-4 p-3.5 rounded-xl border border-amber-500/20 bg-[#12100A]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 block font-mono">
                Destaques Históricos
              </span>
              <span className="text-[10px] text-white/50 font-mono">
                Marcas oficiais da escuderia consolidadas na história da F1
              </span>
            </div>

            {/* Badges de Feitos Históricos */}
            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
              {topAchievements.map((ach, idx) => {
                return (
                  <div
                    key={idx}
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
                      ach.isRecord
                        ? "bg-amber-400/10 border-amber-400/30 text-amber-300"
                        : "bg-white/5 border-white/10 text-white/80"
                    }`}
                  >
                    <span>{ach.label}</span>
                    <span className="font-black text-white">
                      {ach.detail}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Grid de 3 Colunas Temáticas (Idêntico ao Raio-X do Piloto) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/5">
        {/* COLUNA 1: Conquistas & Pódios */}
        <div className="space-y-2 pt-2 md:pt-0">
          <div className="text-xs font-mono font-black uppercase tracking-wider text-white/60 pb-1 border-b border-white/5">
            Conquistas & Pódios
          </div>

          {/* Vitórias em Grandes Prêmios */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Vitórias em GPs</div>
              <div className="text-[10px] text-white/40 font-mono">
                {profile.total_wins} total ({profile.race_wins} GP · {profile.sprint_wins} Sprint)
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-right">
              <span className="text-xl font-black font-mono text-white">{profile.race_wins}</span>
              <RankBadge rank={profile.rank_race_wins || profile.rank_total_wins} label="Histórico" />
            </div>
          </div>

          {/* Dobradinhas (1-2) */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Dobradinhas (1-2)</div>
              <div className="text-[10px] text-amber-400/80 font-mono">
                1º e 2º lugares na mesma corrida
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-right">
              <span className="text-xl font-black font-mono text-amber-400">{profile.total_one_two}</span>
              <span className="font-mono text-[11px] text-amber-300/70 font-bold">VEZES</span>
            </div>
          </div>

          {/* Pódios em Grandes Prêmios */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Pódios em GPs</div>
              <div className="text-[10px] text-white/40 font-mono">
                {profile.total_podiums} total ({profile.race_podiums} GP · {profile.sprint_podiums} Sprint)
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-right">
              <span className="text-xl font-black font-mono text-emerald-400">
                {profile.race_podiums}
              </span>
              <RankBadge rank={profile.rank_race_podiums || profile.rank_total_podiums} label="Histórico" />
            </div>
          </div>

          {/* Pódios Duplos */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Pódios Duplos</div>
              <div className="text-[10px] text-white/40 font-mono">Ambos pilotos no pódio do GP</div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-xl font-black font-mono text-emerald-300">{profile.total_double_podium}</span>
              <span className="font-mono text-[11px] text-emerald-400/70 font-bold">VEZES</span>
            </div>
          </div>

          {/* Voltas Rápidas */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Voltas Rápidas</div>
              <div className="text-[10px] text-white/40 font-mono">Melhor volta em corrida</div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-xl font-black font-mono text-cyan-300">{profile.total_fastest_laps}</span>
            </div>
          </div>

          {/* Melhor Chegada */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Melhor Chegada</div>
              <div className="text-[10px] text-white/40 font-mono">Posição mais alta em GPs</div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-xl font-black font-mono text-white">
                {profile.best_finish_position ? `P${profile.best_finish_position}` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* COLUNA 2: Ritmo de Qualificação */}
        <div className="space-y-2 pt-3 md:pt-0 md:pl-6">
          <div className="text-xs font-mono font-black uppercase tracking-wider text-white/60 pb-1 border-b border-white/5">
            Ritmo de Qualificação
          </div>

          {/* Pole Positions */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Pole Positions</div>
              <div className="text-[10px] text-white/40 font-mono">{profile.sprint_poles || 0} poles em Sprints</div>
            </div>
            <div className="flex items-center gap-2.5 text-right">
              <span className="text-xl font-black font-mono text-purple-300">{profile.race_poles}</span>
              <RankBadge rank={profile.rank_poles} label="Histórico" />
            </div>
          </div>

          {/* 1ª Fila Completa (1-2 Grid) */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">1ª Fila Completa</div>
              <div className="text-[10px] text-purple-400/80 font-mono">Bloqueio 1-2 no grid de largada</div>
            </div>
            <div className="flex items-center gap-2.5 text-right">
              <span className="text-xl font-black font-mono text-purple-300">{profile.total_front_row}</span>
              <span className="font-mono text-[11px] text-purple-300/70 font-bold">VEZES</span>
            </div>
          </div>

          {/* Pole ➔ Vitória (GP) */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-white/90 whitespace-nowrap">Pole ➔ Vitória (GP)</div>
              <div className="text-[10px] text-emerald-400 font-mono whitespace-nowrap">{profile.total_poles_to_win || 0} de {profile.race_poles} convertidas</div>
            </div>
            <div className="flex items-center gap-2 text-right shrink-0">
              <span className="text-xl font-black font-mono text-emerald-400">
                {profile.pole_to_win_rate !== undefined ? `${profile.pole_to_win_rate.toFixed(1)}%` : "—"}
              </span>
            </div>
          </div>

          {/* Aparições Q3 / Q2 */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Aparições Q3 / Q2</div>
              <div className="text-[10px] text-sky-400 font-mono">
                {profile.total_q2_appearences || 0} Q2 ({profile.rank_q2_appearences ? `#${profile.rank_q2_appearences}` : ""})
              </div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-xl font-black font-mono text-sky-300">{profile.total_q3_appearences || 0}</span>
              <RankBadge rank={profile.rank_q3_appearences} label="Q3" />
            </div>
          </div>

          {/* Melhor Grid */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Melhor Grid de Largada</div>
              <div className="text-[10px] text-white/40 font-mono">Melhor posição de saída em GPs</div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-xl font-black font-mono text-white">
                {profile.best_grid_position ? `P${profile.best_grid_position}` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* COLUNA 3: Longevidade & Eficiência */}
        <div className="space-y-2 pt-3 md:pt-0 md:pl-6">
          <div className="text-xs font-mono font-black uppercase tracking-wider text-white/60 pb-1 border-b border-white/5">
            Longevidade & Eficiência
          </div>

          {/* GPs Disputados */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">GPs Disputados</div>
              <div className="text-[10px] text-white/40 font-mono">{profile.total_seasons} temporadas na F1</div>
            </div>
            <div className="flex items-center gap-2.5 text-right">
              <span className="text-xl font-black font-mono text-white">{profile.total_gps}</span>
              <RankBadge rank={profile.rank_gps} label="Histórico" />
            </div>
          </div>

          {/* Temporadas Ativas */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Temporadas Ativas</div>
              <div className="text-[10px] text-white/40 font-mono">{profile.first_season} a {profile.last_season}</div>
            </div>
            <div className="flex items-center gap-2.5 text-right">
              <span className="text-xl font-black font-mono text-white">{profile.total_seasons}</span>
              <RankBadge rank={profile.rank_seasons} label="Histórico" />
            </div>
          </div>

          {/* Pontos Totais */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Pontos Totais</div>
              <div className="text-[10px] text-white/40 font-mono">Média: {avgPoints} pts/GP</div>
            </div>
            <div className="flex items-center gap-2.5 text-right">
              <span className="text-xl font-black font-mono text-white">
                {profile.total_points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              </span>
              <RankBadge rank={profile.rank_points} label="Histórico" />
            </div>
          </div>

          {/* Pontuação Dupla */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Pontuação Dupla</div>
              <div className="text-[10px] text-emerald-400 font-mono">Ambos pilotos na zona de pontos</div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-xl font-black font-mono text-emerald-300">{profile.total_double_points}</span>
              <span className="font-mono text-[11px] text-emerald-400/70 font-bold">GPS</span>
            </div>
          </div>

          {/* Abandonos */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-xs font-bold text-white/90">Abandonos (DNFs)</div>
              <div className="text-[10px] text-rose-400 font-mono">{dnfRate}% dos GPs disputados</div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-xl font-black font-mono text-rose-400">{profile.total_dnfs || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
