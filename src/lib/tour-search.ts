export type TourSearchable = {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
};

/** Normaliza texto para búsqueda sin tildes ni mayúsculas. */
function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\w\s+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sinónimos por tourId para mejorar la búsqueda. */
const TOUR_SEARCH_ALIASES: Record<string, string[]> = {
  "rapa-nui": ["isla de pascua", "easter island", "moai"],
  "san-pedro-uyuni": ["atacama", "uyuni", "salar", "bolivia"],
  "region-atacama": ["atacama", "san pedro", "desierto"],
  "cusco-machupicchu": ["machu picchu", "peru", "inca"],
  mendoza: ["malbec", "vino", "argentina"],
  "buenos-aires": ["tango", "argentina"],
  "rio-janeiro": ["rio", "brasil", "carioca"],
  florianopolis: ["floripa", "brasil"],
  "catedrales-marmol": ["patagonia", "marmol", "carretera austral"],
  "ballenas-elqui": ["elqui", "ballenas", "chanaral"],
  "valle-aconcagua": ["aconcagua", "vino"],
  "group-atacama": ["atacama", "san pedro", "grupal"],
  "group-uyuni": ["uyuni", "salar", "grupal"],
  "group-rapa-nui": ["rapa nui", "pascua", "grupal"],
};

function tourSearchHaystack(tour: TourSearchable): string {
  const aliases = TOUR_SEARCH_ALIASES[tour.id] ?? [];
  return normalizeSearchText(
    [tour.name, tour.subtitle, tour.tag, tour.id.replace(/-/g, " "), ...aliases].join(" "),
  );
}

export function tourMatchesSearch(tour: TourSearchable, rawQuery: string): boolean {
  const query = normalizeSearchText(rawQuery);
  if (!query) return true;

  const haystack = tourSearchHaystack(tour);
  const tokens = query.split(" ").filter(Boolean);

  return tokens.every((token) => haystack.includes(token));
}
