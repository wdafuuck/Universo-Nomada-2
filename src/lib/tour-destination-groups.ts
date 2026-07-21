import type { TourCardData } from "@/components/TourCard";
import { normalizeTourCategory } from "@/lib/tour-category";

export type TourDestinationGroup = {
  key: string;
  title: string;
  subtitle: string;
  image: string;
  tours: TourCardData[];
  minPrice: number;
};

/** Alias de slugs → clave canónica (nombres distintos, mismo destino). */
const DESTINATION_ALIASES: Record<string, string> = {
  "san-pedro-uyuni": "uyuni-san-pedro",
  "san-pedro-de-atacama-uyuni": "uyuni-san-pedro",
  "uyuni-san-pedro-de-atacama": "uyuni-san-pedro",
  "uyuni-san-pedro": "uyuni-san-pedro",
  "region-atacama": "atacama",
  atacama: "atacama",
  "cusco-machupicchu": "cusco-machu-picchu",
  "cusco-machu-picchu": "cusco-machu-picchu",
  "machu-picchu": "cusco-machu-picchu",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function canonicalizeDestinationKey(raw: string): string {
  return DESTINATION_ALIASES[raw] ?? raw;
}

/** Quita duración y sufijos del nombre para obtener el destino base. */
export function cleanDestinationName(name: string): string {
  return name
    .replace(/\s*[-–—]\s*grupal\s*$/i, "")
    .replace(/\s+grupal\s*$/i, "")
    .replace(/\s*\d+\s*d[ií]as?(\s*\/\s*\d+\s*noches?)?\s*$/i, "")
    .replace(/\s*\d+\s*d[ií]as?\s*$/i, "")
    .replace(/\s*\d+D\/\d+N\s*$/i, "")
    .replace(/\s*[-–—]?\s*(express|premium|clasico|clásico|full|lite|basico|básico|plus)\s*$/i, "")
    .trim();
}

/** Stem del tourId sin sufijos de duración/variante (`rapa-nui-7d` → `rapa-nui`). */
export function tourIdStem(tourId: string): string {
  return tourId
    .replace(/^group-/, "")
    .replace(/-\d+d(?:ias?)?(?:-\d+n(?:oches?)?)?$/i, "")
    .replace(/-\d+$/i, "");
}

function destinationGroupKey(tour: TourCardData): string {
  const cat = normalizeTourCategory(tour.category, tour.id);
  /** No mezclar grupales con programas individuales del mismo destino. */
  const typeSuffix = cat === "grupal" ? "grupal" : cat;

  let baseKey: string;
  if (tour.id.startsWith("group-")) {
    baseKey = tour.id.replace(/^group-/, "");
  } else {
    /**
     * Como en admin de Rocío: agrupar por nombre limpio.
     * El stem del tourId (y aliases) solo unifica variantes cuando el nombre
     * ya mapea al mismo destino canónico o no hay nombre usable.
     */
    const cleaned = cleanDestinationName(tour.name);
    const nameKey = cleaned ? slugify(cleaned) : "";
    const stem = tourIdStem(tour.id);
    const nameCanon = nameKey ? canonicalizeDestinationKey(nameKey) : "";
    const stemCanon = stem ? canonicalizeDestinationKey(stem) : "";

    if (nameCanon && stemCanon && nameCanon === stemCanon) {
      baseKey = nameCanon;
    } else if (nameCanon && DESTINATION_ALIASES[stem]) {
      // Variante con nombre distinto pero mismo stem alias (ej. Uyuni 5/7)
      baseKey = stemCanon;
    } else if (nameCanon) {
      baseKey = nameCanon;
    } else {
      baseKey = stemCanon || slugify(tour.subtitle) || tour.id;
    }
  }

  return `${canonicalizeDestinationKey(baseKey)}::${typeSuffix}`;
}

function groupTitle(tours: TourCardData[]): string {
  const cleaned = tours.map((t) => cleanDestinationName(t.name)).filter(Boolean);
  const unique = [...new Set(cleaned)];
  if (unique.length === 1) return unique[0];

  // Preferir el nombre más corto (destino base)
  const byLen = [...unique].sort((a, b) => a.length - b.length);
  return byLen[0] || cleanDestinationName(tours[0].name) || tours[0].name;
}

/** Etiqueta corta de la variante (duración, grupal, etc.). */
export function tourVariantLabel(tour: TourCardData, groupTitleText: string): string {
  const name = tour.name.trim();
  const base = groupTitleText.trim();
  if (base && name.toLowerCase().startsWith(base.toLowerCase())) {
    const rest = name.slice(base.length).replace(/^[\s\-–—]+/, "").trim();
    if (rest) return rest;
  }

  if (tour.id.startsWith("group-") || tour.category === "grupal") {
    return tour.duration ? `Grupal · ${tour.duration}` : "Viaje grupal";
  }

  return tour.duration || name;
}

export function groupToursByDestination(tours: TourCardData[]): TourDestinationGroup[] {
  const map = new Map<string, TourCardData[]>();
  const order: string[] = [];

  for (const tour of tours) {
    const key = destinationGroupKey(tour);
    if (!map.has(key)) order.push(key);
    const list = map.get(key) ?? [];
    list.push(tour);
    map.set(key, list);
  }

  return order.map((key) => {
    const list = map.get(key) ?? [];
    const sorted = [...list].sort((a, b) => {
      const daysA = parseDurationDays(a.duration);
      const daysB = parseDurationDays(b.duration);
      if (daysA !== daysB) return daysA - daysB;
      return a.price - b.price;
    });
    return {
      key,
      title: groupTitle(sorted),
      subtitle: sorted[0].subtitle,
      image: sorted[0].image,
      tours: sorted,
      minPrice: Math.min(...sorted.map((t) => t.price)),
    };
  });
}

function parseDurationDays(duration: string): number {
  const d = duration.match(/(\d+)\s*d/i);
  if (d) return Number(d[1]);
  const dn = duration.match(/(\d+)D/i);
  if (dn) return Number(dn[1]);
  return 999;
}
