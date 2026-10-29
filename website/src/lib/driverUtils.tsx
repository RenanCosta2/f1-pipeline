import React from "react";
import Link from "next/link";

/**
 * Mapeamento de nomes de pilotos conhecidos da F1 para seus IDs canônicos.
 */
const KNOWN_DRIVER_MAP: Record<string, string> = {
  // Grid atual e era moderna
  "max verstappen": "max_verstappen",
  "m verstappen": "max_verstappen",
  "verstappen": "max_verstappen",
  "ver": "max_verstappen",

  "lewis hamilton": "hamilton",
  "l hamilton": "hamilton",
  "hamilton": "hamilton",
  "ham": "hamilton",

  "charles leclerc": "leclerc",
  "c leclerc": "leclerc",
  "leclerc": "leclerc",
  "lec": "leclerc",

  "lando norris": "norris",
  "l norris": "norris",
  "norris": "norris",
  "nor": "norris",

  "oscar piastri": "piastri",
  "o piastri": "piastri",
  "piastri": "piastri",
  "pia": "piastri",

  "carlos sainz": "sainz",
  "c sainz": "sainz",
  "sainz": "sainz",
  "sai": "sainz",

  "george russell": "russell",
  "g russell": "russell",
  "russell": "russell",
  "rus": "russell",

  "fernando alonso": "alonso",
  "f alonso": "alonso",
  "alonso": "alonso",
  "alo": "alonso",

  "gabriel bortoleto": "bortoleto",
  "g bortoleto": "bortoleto",
  "bortoleto": "bortoleto",
  "bor": "bortoleto",

  "andrea kimi antonelli": "antonelli",
  "kimi antonelli": "antonelli",
  "a antonelli": "antonelli",
  "antonelli": "antonelli",
  "ant": "antonelli",

  "oliver bearman": "bearman",
  "o bearman": "bearman",
  "bearman": "bearman",
  "bea": "bearman",

  "nico hulkenberg": "hulkenberg",
  "nico hülkenberg": "hulkenberg",
  "n hulkenberg": "hulkenberg",
  "hulkenberg": "hulkenberg",
  "hul": "hulkenberg",

  "yuki tsunoda": "tsunoda",
  "y tsunoda": "tsunoda",
  "tsunoda": "tsunoda",
  "tsu": "tsunoda",

  "alexander albon": "albon",
  "alex albon": "albon",
  "a albon": "albon",
  "albon": "albon",
  "alb": "albon",

  "pierre gasly": "gasly",
  "p gasly": "gasly",
  "gasly": "gasly",
  "gas": "gasly",

  "esteban ocon": "ocon",
  "e ocon": "ocon",
  "ocon": "ocon",
  "oco": "ocon",

  "valtteri bottas": "bottas",
  "v bottas": "bottas",
  "bottas": "bottas",
  "bot": "bottas",

  "sergio perez": "perez",
  "sergio pérez": "perez",
  "s perez": "perez",
  "perez": "perez",
  "per": "perez",

  "guanyu zhou": "zhou",
  "zhou guanyu": "zhou",
  "g zhou": "zhou",
  "zhou": "zhou",
  "zho": "zhou",

  "lance stroll": "stroll",
  "l stroll": "stroll",
  "stroll": "stroll",
  "str": "stroll",

  "franco colapinto": "colapinto",
  "f colapinto": "colapinto",
  "colapinto": "colapinto",
  "col": "colapinto",

  "jack doohan": "doohan",
  "j doohan": "doohan",
  "doohan": "doohan",
  "doo": "doohan",

  "liam lawson": "lawson",
  "l lawson": "lawson",
  "lawson": "lawson",
  "law": "lawson",

  "daniel ricciardo": "ricciardo",
  "d ricciardo": "ricciardo",
  "ricciardo": "ricciardo",
  "ric": "ricciardo",

  "sebastian vettel": "vettel",
  "s vettel": "vettel",
  "vettel": "vettel",
  "vet": "vettel",

  "kimi raikkonen": "raikkonen",
  "kimi räikkönen": "raikkonen",
  "k raikkonen": "raikkonen",
  "raikkonen": "raikkonen",
  "rai": "raikkonen",

  "kevin magnussen": "kevin_magnussen",
  "k magnussen": "kevin_magnussen",
  "magnussen": "kevin_magnussen",
  "mag": "kevin_magnussen",

  "logan sargeant": "sargeant",
  "sargeant": "sargeant",
  "sar": "sargeant",

  "nyck de vries": "de_vries",
  "de vries": "de_vries",
  "dev": "de_vries",

  "felipe drugovich": "drugovich",
  "drugovich": "drugovich",
  "dru": "drugovich",

  "mick schumacher": "mick_schumacher",
  "schumacher": "mick_schumacher",
  "msc": "mick_schumacher",

  "nicholas latifi": "latifi",
  "latifi": "latifi",
  "lat": "latifi",

  "antonio giovinazzi": "giovinazzi",
  "giovinazzi": "giovinazzi",
  "gio": "giovinazzi",

  "robert kubica": "kubica",
  "kubica": "kubica",
  "kub": "kubica",

  "daniil kvyat": "kvyat",
  "kvyat": "kvyat",
  "kvy": "kvyat",

  "romain grosjean": "grosjean",
  "grosjean": "grosjean",
  "gro": "grosjean",

  "marcus ericsson": "ericsson",
  "ericsson": "ericsson",
  "eri": "ericsson",

  "stoffel vandoorne": "vandoorne",
  "vandoorne": "vandoorne",
  "van": "vandoorne",

  "sergey sirotkin": "sirotkin",
  "sirotkin": "sirotkin",
  "sir": "sirotkin",

  "brendon hartley": "hartley",
  "hartley": "hartley",
  "har": "hartley",

  "pascal wehrlein": "wehrlein",
  "wehrlein": "wehrlein",
  "weh": "wehrlein",

  "jolyon palmer": "palmer",
  "palmer": "palmer",
  "pal": "palmer",

  "felipe massa": "massa",
  "massa": "massa",
  "mas": "massa",

  "esteban gutierrez": "gutierrez",
  "gutierrez": "gutierrez",
  "gut": "gutierrez",

  "rio haryanto": "haryanto",
  "haryanto": "haryanto",
  "har_rio": "haryanto",

  "felipe nasr": "nasr",
  "nasr": "nasr",
  "nas": "nasr",

  "pastor maldonado": "maldonado",
  "maldonado": "maldonado",
  "mal": "maldonado",

  "will stevens": "stevens",
  "stevens": "stevens",
  "ste": "stevens",

  "alexander rossi": "rossi",
  "rossi": "rossi",
  "rso": "rossi",

  "roberto merhi": "merhi",
  "merhi": "merhi",
  "mer": "merhi",

  "jean-eric vergne": "vergne",
  "vergne": "vergne",
  "verg": "vergne",

  "adrian sutil": "sutil",
  "sutil": "sutil",
  "sut": "sutil",

  "kamui kobayashi": "kobayashi",
  "kobayashi": "kobayashi",
  "kob": "kobayashi",

  "max chilton": "chilton",
  "chilton": "chilton",
  "chi": "chilton",

  "jules bianchi": "bianchi",
  "bianchi": "bianchi",
  "bia": "bianchi",

  "andre lotterer": "lotterer",
  "lotterer": "lotterer",
  "lot": "lotterer",

  "isack hadjar": "hadjar",
  "hadjar": "hadjar",
  "had": "hadjar",

  "nico rosberg": "rosberg",
  "n rosberg": "rosberg",
  "rosberg": "rosberg",
  "ros": "rosberg",

  "jenson button": "button",
  "j button": "button",
  "button": "button",
  "but": "button",

  "mark webber": "webber",
  "m webber": "webber",
  "webber": "webber",
  "web": "webber",
};

/**
 * Normaliza uma string de texto removendo acentos e pontuações.
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Retorna o identificador de piloto (slug) correspondente a partir de driver_id, nome ou sigla.
 */
export function getDriverSlug(
  driverId?: string | null,
  driverName?: string | null,
  driverAbbr?: string | null
): string {
  if (driverId && driverId.trim() !== "") {
    return driverId.trim();
  }

  if (driverName && driverName.trim() !== "") {
    const normalized = normalizeString(driverName);
    if (KNOWN_DRIVER_MAP[normalized]) {
      return KNOWN_DRIVER_MAP[normalized];
    }
    // Tenta pelo último sobrenome
    const parts = normalized.split(/\s+/);
    const lastName = parts[parts.length - 1];
    if (KNOWN_DRIVER_MAP[lastName]) {
      return KNOWN_DRIVER_MAP[lastName];
    }
    // Fallback: transforma nome em slug seguro
    return normalized.replace(/\s+/g, "_");
  }

  if (driverAbbr && driverAbbr.trim() !== "") {
    const normalizedAbbr = normalizeString(driverAbbr);
    if (KNOWN_DRIVER_MAP[normalizedAbbr]) {
      return KNOWN_DRIVER_MAP[normalizedAbbr];
    }
    return normalizedAbbr;
  }

  return "max_verstappen";
}

/**
 * Retorna a URL absoluta interna para a página do perfil do piloto.
 */
export function getDriverProfileUrl(
  driverId?: string | null,
  driverName?: string | null,
  driverAbbr?: string | null
): string {
  const slug = getDriverSlug(driverId, driverName, driverAbbr);
  return `/drivers/${encodeURIComponent(slug)}`;
}

/**
 * Componente unificado DriverLink:
 * Renderiza o link com hover estilizado para a página de perfil do piloto.
 */
export function DriverLink({
  driverId,
  driverName,
  driverAbbr,
  children,
  className = "",
  style,
  title,
  stopPropagation = false,
}: {
  driverId?: string | null;
  driverName?: string | null;
  driverAbbr?: string | null;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  stopPropagation?: boolean;
}) {
  const url = getDriverProfileUrl(driverId, driverName, driverAbbr);
  const defaultTitle = driverName ? `Ver perfil de ${driverName}` : "Ver perfil do piloto";

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
 * Função utilitária para separar nomes de múltiplos pilotos quando há empates em recordes,
 * suportando arrays ou strings delimitadas por '/', ',', '&' ou 'e'.
 */
export function parseDriverNames(input?: string | string[] | null): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((d) => String(d).trim()).filter((d) => d.length > 0 && d !== "—");
  }
  const trimmed = String(input).trim();
  if (!trimmed || trimmed === "—") return [];
  return trimmed
    .split(/\s*(?:\/|,| e | & )\s*/)
    .map((d) => d.trim())
    .filter((d) => d.length > 0 && d !== "—");
}

export default DriverLink;
