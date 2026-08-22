import { db } from "@/lib/db";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import {
  filterToursByGroupVisibility,
  getActiveGroupTourIds,
} from "@/lib/group-trips-visibility";

const REGION_MAP: Record<string, string[]> = {
  chile: ["chile", "grupal"],
  internacional: ["internacional", "grupal"],
  experiencial: ["experiencial", "chile", "internacional"],
  grupal: ["grupal", "internacional", "chile"],
};

export type RelatedTourCard = {
  tourId: string;
  name: string;
  subtitle: string;
  image: string;
  price: number;
  category: string;
  sortOrder: number;
};

function scoreRelated(
  current: { category: string; subtitle: string; sortOrder: number },
  candidate: RelatedTourCard,
): number {
  const preferred = REGION_MAP[current.category] ?? [current.category];
  let score = 0;
  if (preferred.includes(candidate.category)) score += 3;
  if (
    candidate.subtitle.toLowerCase().includes("chile") &&
    current.subtitle.toLowerCase().includes("chile")
  ) {
    score += 1;
  }
  score += Math.max(0, 5 - Math.abs(candidate.sortOrder - current.sortOrder)) * 0.2;
  return score;
}

function fromDefaultFallback(tourId: string, limit: number): RelatedTourCard[] {
  const current = DEFAULT_TOURS.find((t) => t.tourId === tourId);
  const pool = DEFAULT_TOURS.filter((t) => t.tourId !== tourId && t.active);
  if (!current) return pool.slice(0, limit);
  return pool
    .map((t) => ({ tour: t, score: scoreRelated(current, t) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.tour);
}

/**
 * Tours relacionados para detalle de paquete.
 * Solo tours activos en DB (misma regla que el catálogo web).
 */
export async function getRelatedTours(tourId: string, limit = 4): Promise<RelatedTourCard[]> {
  try {
    const tours = await db.tour.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        tourId: true,
        name: true,
        subtitle: true,
        image: true,
        price: true,
        category: true,
        sortOrder: true,
      },
    });
    const activeGroupIds = await getActiveGroupTourIds();
    const visible = filterToursByGroupVisibility(tours, activeGroupIds).filter(
      (t) => t.tourId !== tourId,
    );

    const current =
      tours.find((t) => t.tourId === tourId) ??
      DEFAULT_TOURS.find((t) => t.tourId === tourId);

    if (!current) {
      return visible.slice(0, limit);
    }

    return visible
      .map((tour) => ({ tour, score: scoreRelated(current, tour) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.tour);
  } catch {
    return fromDefaultFallback(tourId, limit);
  }
}
