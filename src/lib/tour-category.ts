export const TOUR_CATEGORIES = [
  { value: "nacional", label: "Nacional" },
  { value: "internacional", label: "Internacional" },
  { value: "grupal", label: "Grupal" },
] as const;

export type TourCategory = (typeof TOUR_CATEGORIES)[number]["value"];

export function normalizeTourCategory(category: string, tourId?: string): TourCategory {
  if (category === "grupal" || tourId?.startsWith("group-")) return "grupal";
  if (category === "internacional") return "internacional";
  return "nacional";
}

export function tourCategoryLabel(category: string, tourId?: string): string {
  const key = normalizeTourCategory(category, tourId);
  return TOUR_CATEGORIES.find((c) => c.value === key)?.label ?? key;
}
