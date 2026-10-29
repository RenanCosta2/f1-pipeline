import React from "react";
import Link from "next/link";

/**
 * Mapeamento de nomes de construtores/equipes da F1 para seus IDs canônicos.
 */
const KNOWN_TEAM_MAP: Record<string, string> = {
  // Grid atual e moderno
  "red bull": "red_bull",
  "red bull racing": "red_bull",
  "rbr": "red_bull",

  "ferrari": "ferrari",
  "scuderia ferrari": "ferrari",

  "mercedes": "mercedes",
  "mercedes-amg": "mercedes",
  "mercedes amg": "mercedes",
  "mercedes-amg petronas": "mercedes",
  "mercedes petronas": "mercedes",

  "mclaren": "mclaren",
  "mclaren f1 team": "mclaren",

  "aston martin": "aston_martin",
  "aston martin aramco": "aston_martin",
  "aston martin racing": "aston_martin",

  "alpine": "alpine",
  "alpine f1 team": "alpine",

  "williams": "williams",
  "williams racing": "williams",

  "haas": "haas",
  "haas f1 team": "haas",
  "moneygram haas f1 team": "haas",

  "kick sauber": "sauber",
  "sauber": "sauber",
  "stake f1 team kick sauber": "sauber",
  "stake f1 team": "sauber",

  "rb": "rb",
  "rb f1 team": "rb",
  "racing bulls": "rb",
  "visa cash app rb": "rb",
  "vcarb": "rb",

  "alphatauri": "alphatauri",
  "scuderia alphatauri": "alphatauri",

  "toro rosso": "toro_rosso",
  "scuderia toro rosso": "toro_rosso",

  "alfa romeo": "alfa",
  "alfa romeo racing": "alfa",
  "alfa": "alfa",

  "racing point": "racing_point",
  "bwt racing point": "racing_point",

  "force india": "force_india",
  "sahara force india": "force_india",

  "renault": "renault",
  "renault f1 team": "renault",

  "lotus": "lotus_f1",
  "lotus f1": "lotus_f1",
  "lotus f1 team": "lotus_f1",

  "marussia": "marussia",
  "marussia f1 team": "marussia",

  "manor": "manor",
  "manor marussia": "manor",
  "manor racing": "manor",

  "caterham": "caterham",
  "caterham f1 team": "caterham",

  "cadillac": "cadillac",
  "cadillac f1 team": "cadillac",

  "audi": "audi",
  "audi f1 team": "audi",
};

/**
 * Normaliza uma string de texto removendo acentos e pontuação.
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Retorna o ID canônico de um construtor a partir de seu ID ou nome.
 */
export function getCanonicalTeamId(teamId?: string | null, teamName?: string | null): string {
  if (teamId) {
    const rawId = normalizeString(teamId).replace(/[\s-]+/g, "_");
    if (KNOWN_TEAM_MAP[rawId]) return KNOWN_TEAM_MAP[rawId];
    return rawId;
  }

  if (teamName) {
    const norm = normalizeString(teamName);
    if (KNOWN_TEAM_MAP[norm]) return KNOWN_TEAM_MAP[norm];

    // Checagem parcial por palavras-chave
    for (const [key, id] of Object.entries(KNOWN_TEAM_MAP)) {
      if (norm.includes(key)) return id;
    }

    return norm.replace(/[\s-]+/g, "_");
  }

  return "";
}

/**
 * Retorna a URL do perfil do construtor.
 */
export function getTeamProfileUrl(teamId?: string | null, teamName?: string | null): string {
  const canonical = getCanonicalTeamId(teamId, teamName);
  return canonical ? `/teams/${canonical}` : "/teams";
}

/**
 * Componente de link reutilizável para o perfil de um construtor.
 */
export function TeamLink({
  teamId,
  teamName,
  children,
  className = "",
  style,
  title,
  stopPropagation = false,
}: {
  teamId?: string | null;
  teamName?: string | null;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  stopPropagation?: boolean;
}) {
  const url = getTeamProfileUrl(teamId, teamName);
  const defaultTitle = teamName ? `Ver perfil de ${teamName}` : "Ver perfil da equipe";

  return (
    <Link
      href={url}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      className={`transition-colors hover:text-white hover:underline decoration-white/30 underline-offset-2 ${className}`}
      style={style}
      title={title || defaultTitle}
    >
      {children}
    </Link>
  );
}

/**
 * Mapeamento de abreviações de 3 a 4 letras das equipes de F1.
 */
const TEAM_ABBR_MAP: Record<string, string> = {
  red_bull: "RBR",
  ferrari: "FER",
  mercedes: "MER",
  mclaren: "MCL",
  aston_martin: "AMR",
  alpine: "ALP",
  williams: "WIL",
  haas: "HAA",
  sauber: "SAU",
  rb: "VCARB",
  alphatauri: "AT",
  toro_rosso: "STR",
  alfa: "ALF",
  racing_point: "RP",
  force_india: "FI",
  renault: "REN",
  lotus_f1: "LOT",
  manor: "MAN",
  caterham: "CAT",
  marussia: "MRU",
};

export function getTeamAbbreviation(teamName?: string | null, teamId?: string | null): string {
  const canonical = getCanonicalTeamId(teamId, teamName);
  if (canonical && TEAM_ABBR_MAP[canonical]) {
    return TEAM_ABBR_MAP[canonical];
  }
  if (teamName) {
    const clean = teamName.trim();
    const words = clean.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0] + (words[2] ? words[2][0] : words[1][1] || "")).toUpperCase();
    }
    return clean.slice(0, 3).toUpperCase();
  }
  return "F1";
}

export default TeamLink;
