/** Contenido enriquecido de viajes grupales (itinerario + alojamientos). */

export type GroupDayMeals = {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  cocktail: boolean;
};

export type GroupItineraryDay = {
  day: number;
  title: string;
  description: string;
  /** Una actividad por ítem */
  activities: string[];
  image: string;
  meals: GroupDayMeals;
};

export type GroupAccommodationInfo = {
  id: string;
  name: string;
  description: string;
  image: string;
};

export const EMPTY_MEALS: GroupDayMeals = {
  breakfast: false,
  lunch: false,
  dinner: false,
  cocktail: false,
};

export function emptyItineraryDay(day = 1): GroupItineraryDay {
  return {
    day,
    title: `Día ${day}`,
    description: "",
    activities: [],
    image: "",
    meals: { ...EMPTY_MEALS },
  };
}

export function emptyAccommodation(): GroupAccommodationInfo {
  return {
    id: `acc-${Date.now().toString(36)}`,
    name: "",
    description: "",
    image: "",
  };
}

function asBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1;
}

export function parseItineraryJson(raw: string | null | undefined): GroupItineraryDay[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, i): GroupItineraryDay | null => {
        if (!item || typeof item !== "object") return null;
        const o = item as Record<string, unknown>;
        const mealsRaw =
          o.meals && typeof o.meals === "object" ? (o.meals as Record<string, unknown>) : {};
        const activities = Array.isArray(o.activities)
          ? o.activities.map((a) => String(a ?? "").trim()).filter(Boolean)
          : typeof o.activitiesText === "string"
            ? o.activitiesText
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean)
            : [];
        return {
          day: Number(o.day) || i + 1,
          title: String(o.title ?? `Día ${i + 1}`),
          description: String(o.description ?? ""),
          activities,
          image: String(o.image ?? ""),
          meals: {
            breakfast: asBool(mealsRaw.breakfast),
            lunch: asBool(mealsRaw.lunch),
            dinner: asBool(mealsRaw.dinner),
            cocktail: asBool(mealsRaw.cocktail),
          },
        };
      })
      .filter((d): d is GroupItineraryDay => d != null)
      .sort((a, b) => a.day - b.day);
  } catch {
    return [];
  }
}

export function parseAccommodationsJson(
  raw: string | null | undefined,
): GroupAccommodationInfo[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, i): GroupAccommodationInfo | null => {
        if (!item || typeof item !== "object") return null;
        const o = item as Record<string, unknown>;
        return {
          id: String(o.id ?? `acc-${i}`),
          name: String(o.name ?? ""),
          description: String(o.description ?? ""),
          image: String(o.image ?? ""),
        };
      })
      .filter((a): a is GroupAccommodationInfo => a != null && Boolean(a.name.trim()));
  } catch {
    return [];
  }
}

export function slugifyGroupTourId(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `group-${base || "viaje"}`;
}
