import React from "react";
import Link from "next/link";

export const COUNTRY_FLAG_MAP: Record<string, string> = {
  "Australia": "🇦🇺",
  "Austria": "🇦🇹",
  "Azerbaijan": "🇦🇿",
  "Bahrain": "🇧🇭",
  "Belgium": "🇧🇪",
  "Brazil": "🇧🇷",
  "Canada": "🇨🇦",
  "China": "🇨🇳",
  "France": "🇫🇷",
  "Germany": "🇩🇪",
  "Great Britain": "🇬🇧",
  "United Kingdom": "🇬🇧",
  "UK": "🇬🇧",
  "Hungary": "🇭🇺",
  "Italy": "🇮🇹",
  "Japan": "🇯🇵",
  "Malaysia": "🇲🇾",
  "Mexico": "🇲🇽",
  "Monaco": "🇲🇨",
  "Netherlands": "🇳🇱",
  "Portugal": "🇵🇹",
  "Qatar": "🇶🇦",
  "Russia": "🇷🇺",
  "Saudi Arabia": "🇸🇦",
  "Singapore": "🇸🇬",
  "Spain": "🇪🇸",
  "Turkey": "🇹🇷",
  "UAE": "🇦🇪",
  "United Arab Emirates": "🇦🇪",
  "USA": "🇺🇸",
  "United States": "🇺🇸"
};

export function getCountryFlag(country: string | null | undefined): string {
  if (!country) return "🏁";
  const trimmed = country.trim();
  return COUNTRY_FLAG_MAP[trimmed] || "🏁";
}

export function getTrackTypeBadge(trackType: string | null | undefined): {
  label: string;
  badgeClass: string;
} {
  const type = (trackType || "").toLowerCase();

  if (type === "street") {
    return {
      label: "Circuito de Rua",
      badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400"
    };
  }
  if (type === "hybrid") {
    return {
      label: "Traçado Híbrido",
      badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-400"
    };
  }
  return {
    label: "Autódromo Permanente",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
  };
}

/**
 * Formata um conjunto de anos em intervalos legíveis (ex: 2013–2019, 2021–2026).
 * Evita criar a falsa impressão de que houve GP todo ano consecutivo.
 */
export function formatSeasonsRanges(
  yearsInput: number[] | string | undefined | null
): string {
  if (!yearsInput) return "—";

  let years: number[] = [];
  if (Array.isArray(yearsInput)) {
    years = [...yearsInput].map(Number).filter((n) => !isNaN(n));
  } else if (typeof yearsInput === "string") {
    years = yearsInput
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n));
  }

  if (years.length === 0) return "—";

  const uniqueYears = Array.from(new Set(years)).sort((a, b) => a - b);
  if (uniqueYears.length === 1) return uniqueYears[0].toString();

  const ranges: string[] = [];
  let start = uniqueYears[0];
  let prev = uniqueYears[0];

  for (let i = 1; i < uniqueYears.length; i++) {
    const current = uniqueYears[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      if (start === prev) {
        ranges.push(start.toString());
      } else {
        ranges.push(`${start}–${prev}`);
      }
      start = current;
      prev = current;
    }
  }

  if (start === prev) {
    ranges.push(start.toString());
  } else {
    ranges.push(`${start}–${prev}`);
  }

  return ranges.join(", ");
}

/**
 * Mapeamento de nomes de autódromos, GPs e identificadores para o circuit_id canônico.
 */
const KNOWN_CIRCUIT_MAP: Record<string, string> = {
  // Autódromos modernos e históricos
  "red bull ring": "red_bull_ring",
  "spielberg": "red_bull_ring",
  "austria": "red_bull_ring",
  "oesterreichring": "red_bull_ring",

  "bahrain": "bahrain",
  "bahrain international circuit": "bahrain",
  "sakhir": "bahrain",

  "silverstone": "silverstone",
  "silverstone circuit": "silverstone",
  "great britain": "silverstone",
  "british grand prix": "silverstone",

  "catalunya": "catalunya",
  "circuit de barcelona-catalunya": "catalunya",
  "circuit de barcelona catalunya": "catalunya",
  "barcelona": "catalunya",
  "spanish grand prix": "catalunya",

  "hungaroring": "hungaroring",
  "budapest": "hungaroring",
  "hungary": "hungaroring",

  "monza": "monza",
  "autodromo nazionale monza": "monza",
  "autodromo nazionale di monza": "monza",
  "italian grand prix": "monza",

  "spa": "spa_francorchamps",
  "spa francorchamps": "spa_francorchamps",
  "spa-francorchamps": "spa_francorchamps",
  "circuit de spa-francorchamps": "spa_francorchamps",
  "circuit de spa francorchamps": "spa_francorchamps",
  "belgian grand prix": "spa_francorchamps",
  "belgium": "spa_francorchamps",

  "monaco": "monaco",
  "circuit de monaco": "monaco",
  "monte carlo": "monaco",
  "monaco grand prix": "monaco",

  "yas marina": "yas_marina",
  "yas marina circuit": "yas_marina",
  "abu dhabi": "yas_marina",
  "abu dhabi grand prix": "yas_marina",

  "cota": "cota",
  "circuit of the americas": "cota",
  "austin": "cota",
  "united states grand prix": "cota",
  "us gp": "cota",

  "albert park": "albert_park",
  "albert park circuit": "albert_park",
  "melbourne": "albert_park",
  "australian grand prix": "albert_park",

  "interlagos": "interlagos",
  "autódromo josé carlos pace": "interlagos",
  "autodromo jose carlos pace": "interlagos",
  "autódromo josé carlos pace (interlagos)": "interlagos",
  "autodromo jose carlos pace (interlagos)": "interlagos",
  "são paulo grand prix": "interlagos",
  "sao paulo grand prix": "interlagos",
  "brazilian grand prix": "interlagos",
  "brazil": "interlagos",
  "brasil": "interlagos",

  "circuit gilles villeneuve": "circuit_gilles_villeneuve",
  "gilles villeneuve": "circuit_gilles_villeneuve",
  "villeneuve": "circuit_gilles_villeneuve",
  "montreal": "circuit_gilles_villeneuve",
  "canadian grand prix": "circuit_gilles_villeneuve",
  "canada": "circuit_gilles_villeneuve",

  "marina bay": "marina_bay",
  "marina bay street circuit": "marina_bay",
  "singapore": "marina_bay",
  "singapore grand prix": "marina_bay",

  "suzuka": "suzuka",
  "suzuka circuit": "suzuka",
  "suzuka international racing course": "suzuka",
  "japanese grand prix": "suzuka",
  "japan": "suzuka",

  "shanghai": "shanghai",
  "shanghai international circuit": "shanghai",
  "chinese grand prix": "shanghai",
  "china": "shanghai",

  "baku": "baku_city_circuit",
  "baku city circuit": "baku_city_circuit",
  "azerbaijan": "baku_city_circuit",
  "azerbaijan grand prix": "baku_city_circuit",

  "hermanos rodriguez": "hermanos_rodriguez",
  "autódromo hermanos rodríguez": "hermanos_rodriguez",
  "autodromo hermanos rodriguez": "hermanos_rodriguez",
  "mexico": "hermanos_rodriguez",
  "mexico city grand prix": "hermanos_rodriguez",
  "mexican grand prix": "hermanos_rodriguez",

  "sochi": "sochi",
  "sochi autodrom": "sochi",
  "russian grand prix": "sochi",
  "russia": "sochi",

  "zandvoort": "zandvoort",
  "circuit zandvoort": "zandvoort",
  "dutch grand prix": "zandvoort",
  "netherlands": "zandvoort",

  "imola": "imola",
  "autodromo enzo e dino ferrari": "imola",
  "autodromo enzo e dino ferrari (imola)": "imola",
  "emilia romagna grand prix": "imola",

  "jeddah": "jeddah",
  "jeddah corniche circuit": "jeddah",
  "saudi arabia": "jeddah",
  "saudi arabian grand prix": "jeddah",

  "miami": "miami",
  "miami international autodrome": "miami",
  "miami grand prix": "miami",

  "sepang": "sepang",
  "sepang international circuit": "sepang",
  "malaysian grand prix": "sepang",
  "malaysia": "sepang",

  "losail": "losail",
  "lusail": "losail",
  "lusail international circuit": "losail",
  "qatar": "losail",
  "qatar grand prix": "losail",

  "paul ricard": "paul_ricard",
  "circuit paul ricard": "paul_ricard",
  "french grand prix": "paul_ricard",
  "le castellet": "paul_ricard",

  "hockenheimring": "hockenheimring",
  "hockenheim": "hockenheimring",
  "german grand prix": "hockenheimring",

  "las vegas": "las_vegas",
  "las vegas strip": "las_vegas",
  "las vegas strip circuit": "las_vegas",
  "las vegas grand prix": "las_vegas",

  "istanbul": "istanbul_park",
  "istanbul park": "istanbul_park",
  "intercity istanbul park": "istanbul_park",
  "turkish grand prix": "istanbul_park",

  "portimao": "portimao",
  "portimão": "portimao",
  "algarve": "portimao",
  "autódromo internacional do algarve": "portimao",
  "autodromo internacional do algarve": "portimao",
  "autódromo internacional do algarve (portimão)": "portimao",
  "autodromo internacional do algarve (portimao)": "portimao",
  "portuguese grand prix": "portimao",

  "nurburgring": "nurburgring",
  "nürburgring": "nurburgring",

  "korea": "korea",
  "korea international circuit": "korea",

  "mugello": "mugello",
  "autodromo internazionale del mugello": "mugello",
  "tuscan grand prix": "mugello",

  "madrid": "madrid",
  "circuito de madrid": "madrid",

  "buddh": "buddh",
  "buddh international circuit": "buddh",
  "indian grand prix": "buddh",
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
 * Retorna o ID canônico de um circuito a partir de seu ID ou nome.
 */
export function getCanonicalCircuitId(circuitId?: string | null, circuitName?: string | null): string {
  if (circuitId) {
    const rawId = normalizeString(circuitId).replace(/[\s-]+/g, "_");
    if (KNOWN_CIRCUIT_MAP[rawId]) return KNOWN_CIRCUIT_MAP[rawId];
    return rawId;
  }

  if (circuitName) {
    const norm = normalizeString(circuitName);
    if (KNOWN_CIRCUIT_MAP[norm]) return KNOWN_CIRCUIT_MAP[norm];

    // Checagem parcial por palavras-chave
    for (const [key, id] of Object.entries(KNOWN_CIRCUIT_MAP)) {
      if (norm.includes(key)) return id;
    }

    return norm.replace(/[\s-]+/g, "_");
  }

  return "";
}

/**
 * Retorna a URL do perfil do circuito.
 */
export function getCircuitProfileUrl(circuitId?: string | null, circuitName?: string | null): string {
  const canonical = getCanonicalCircuitId(circuitId, circuitName);
  return canonical ? `/circuits/${canonical}` : "/circuits";
}

/**
 * Componente de link reutilizável para o perfil de um circuito.
 */
export function CircuitLink({
  circuitId,
  circuitName,
  children,
  className = "",
  style,
  title,
  stopPropagation = false,
}: {
  circuitId?: string | null;
  circuitName?: string | null;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  stopPropagation?: boolean;
}) {
  const url = getCircuitProfileUrl(circuitId, circuitName);
  const defaultTitle = circuitName ? `Ver detalhes de ${circuitName}` : "Ver detalhes do circuito";

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

export default CircuitLink;
