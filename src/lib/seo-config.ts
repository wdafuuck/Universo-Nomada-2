import { SITE_URL } from "@/lib/site-url";

export const SEO_BRAND = "Universo Nómada®";

export const SEO_DEFAULT_KEYWORDS = [
  "viajes chile",
  "viajes a chile",
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

/**
 * Solo es-CL + x-default mientras no existan rutas i18n reales.
 * Declarar en/pt/fr/zh al mismo URL confunde a Google.
 */
export function hreflangAlternates(path = ""): Record<string, string> {
  const clean = path.startsWith("/") ? path : path ? `/${path}` : "";
  const url = `${SITE_URL}${clean}`;
  return {
    "es-CL": url,
    "x-default": url,
  };
}

/** Keywords por destino para rich snippets y metadata */
export const TOUR_SEO_KEYWORDS: Record<string, string[]> = {
  "rapa-nui": ["Rapa Nui", "Isla de Pascua", "Tapati", "moais", "viaje Rapa Nui Chile", "viajes a rapa nui"],
  atacama: ["San Pedro Atacama", "desierto Atacama", "Salar Uyuni", "tour Atacama Uyuni", "viajes a atacama"],
  "san-pedro-uyuni": ["Atacama Uyuni", "Salar de Uyuni", "viajes a atacama"],
  "region-atacama": ["San Pedro de Atacama", "viajes a atacama", "desierto Atacama"],
  cusco: ["Machu Picchu", "Cusco", "Valle Sagrado", "Perú desde Chile"],
  "cusco-machupicchu": ["Machu Picchu", "Cusco", "viaje cusco machu picchu"],
  patagonia: ["Patagonia Chile", "Capillas de Mármol", "Puerto Río Tranquilo", "viajes patagonia chile"],
  "catedrales-marmol": ["Catedrales de Mármol", "Carretera Austral", "viajes patagonia chile"],
  "florianopolis-brasil": ["Florianópolis", "playas Brasil", "viaje Floripa"],
  florianopolis: ["Florianópolis", "viaje florianopolis", "Floripa desde Chile"],
  "rio-janeiro": ["Río de Janeiro", "Cristo Redentor", "Copacabana tour", "viaje rio de janeiro"],
  "buenos-aires": ["Buenos Aires", "Argentina tour", "tango Buenos Aires", "viaje buenos aires"],
  mendoza: ["Mendoza vinos", "Alta montaña Argentina", "turismo enológico", "viaje mendoza"],
  "ballenas-elqui": ["Valle del Elqui", "ballenas Chile", "astroturismo Elqui"],
};

export function tourKeywords(tourId: string, tourName: string): string[] {
  const specific = TOUR_SEO_KEYWORDS[tourId] ?? [];
  return [...new Set([...specific, tourName, "Universo Nómada", "paquete turístico Chile", "viajes chile"])];
}
