import { SITE_URL } from "@/lib/site-url";

export const SEO_BRAND = "Universo Nómada®";

export const SEO_DEFAULT_KEYWORDS = [
  "agencia de viajes Chile",
  "viajes personalizados Chile",
  "tours Sudamérica",
  "Rapa Nui paquete",
  "Atacama Uyuni tour",
  "Machu Picchu desde Chile",
  "viajes boutique La Serena",
  "agencia viajes Viña del Mar",
  "turismo experiencial Chile",
  "paquetes turísticos Sudamérica",
  "viajes grupales Chile",
  "Universo Nómada",
] as const;

export const HREFLANG_LOCALES = [
  { lang: "es", hrefLang: "es-CL", path: "" },
  { lang: "en", hrefLang: "en", path: "" },
  { lang: "pt", hrefLang: "pt-BR", path: "" },
  { lang: "fr", hrefLang: "fr", path: "" },
  { lang: "zh", hrefLang: "zh-CN", path: "" },
] as const;

export function hreflangAlternates(path = ""): Record<string, string> {
  const clean = path.startsWith("/") ? path : path ? `/${path}` : "";
  const entries: Record<string, string> = {};
  for (const loc of HREFLANG_LOCALES) {
    entries[loc.hrefLang] = `${SITE_URL}${clean}`;
  }
  entries["x-default"] = `${SITE_URL}${clean}`;
  return entries;
}

/** Keywords por destino para rich snippets y metadata */
export const TOUR_SEO_KEYWORDS: Record<string, string[]> = {
  "rapa-nui": ["Rapa Nui", "Isla de Pascua", "Tapati", "moais", "viaje Rapa Nui Chile"],
  atacama: ["San Pedro Atacama", "desierto Atacama", "Salar Uyuni", "tour Atacama Uyuni"],
  cusco: ["Machu Picchu", "Cusco", "Valle Sagrado", "Perú desde Chile"],
  patagonia: ["Patagonia Chile", "Capillas de Mármol", "Puerto Río Tranquilo"],
  "florianopolis-brasil": ["Florianópolis", "playas Brasil", "viaje Floripa"],
  "rio-janeiro": ["Río de Janeiro", "Cristo Redentor", "Copacabana tour"],
  "buenos-aires": ["Buenos Aires", "Argentina tour", "tango Buenos Aires"],
  mendoza: ["Mendoza vinos", "Alta montaña Argentina", "turismo enológico"],
};

export function tourKeywords(tourId: string, tourName: string): string[] {
  const specific = TOUR_SEO_KEYWORDS[tourId] ?? [];
  return [...new Set([...specific, tourName, "Universo Nómada", "paquete turístico Chile"])];
}
