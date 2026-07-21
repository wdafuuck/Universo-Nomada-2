import { DEFAULT_TOURS, type DefaultTour } from "@/lib/default-tours";

const REGION_MAP: Record<string, string[]> = {
  chile: ["chile", "grupal"],
  internacional: ["internacional", "grupal"],
  experiencial: ["experiencial", "chile", "internacional"],
  grupal: ["grupal", "internacional", "chile"],
};

export function getRelatedTours(tourId: string, limit = 4): DefaultTour[] {
  const current = DEFAULT_TOURS.find((t) => t.tourId === tourId);
  if (!current) {
    return DEFAULT_TOURS.filter((t) => t.tourId !== tourId).slice(0, limit);
  }

  const preferred = REGION_MAP[current.category] ?? [current.category];

  const scored = DEFAULT_TOURS.filter((t) => t.tourId !== tourId && t.active).map((t) => {
    let score = 0;
    if (preferred.includes(t.category)) score += 3;
    if (t.subtitle.toLowerCase().includes("chile") && current.subtitle.toLowerCase().includes("chile")) score += 1;
    score += Math.max(0, 5 - Math.abs(t.sortOrder - current.sortOrder)) * 0.2;
    return { tour: t, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.tour);
}
