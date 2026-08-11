import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { DEFAULT_HERO_SLIDES } from "@/lib/default-hero-slides";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { toPublicTour } from "@/lib/tour-public";
import {
  filterToursByGroupVisibility,
  getActiveGroupTourIds,
} from "@/lib/group-trips-visibility";
import { tourToPromoCard } from "@/lib/tour-ofertas";
import type { TourCardData } from "@/components/TourCard";
import type { PromoCard } from "@/hooks/use-tours";

export type LandingInitialData = {
  heroImages: string[];
  tours: TourCardData[];
  promotions: PromoCard[];
};

function mapTourToCard(t: ReturnType<typeof toPublicTour>): TourCardData {
  return {
    id: t.tourId,
    name: t.name,
    subtitle: t.subtitle,
    image: t.image,
    tag: t.tag,
    price: t.price,
    duration: t.duration,
    originalPrice: t.originalPrice ?? undefined,
    category: t.category,
    includedToursPickCount: t.optionalTours?.pickCount ?? 0,
    includedToursTotal: t.optionalTours?.options?.length ?? 0,
  };
}

async function ensureLandingSeeded() {
  const [heroCount, tourCount] = await Promise.all([db.heroSlide.count(), db.tour.count()]);

  if (heroCount === 0) {
    for (const slide of DEFAULT_HERO_SLIDES) {
      await db.heroSlide.create({ data: { ...slide, active: true } });
    }
  }
  if (tourCount === 0) {
    for (const t of DEFAULT_TOURS) {
      await db.tour.create({ data: t });
    }
  }
}

async function loadLandingInitialData(): Promise<LandingInitialData> {
  await ensureLandingSeeded();

  const [slides, tours, activeGroupIds] = await Promise.all([
    db.heroSlide.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { imageUrl: true },
    }),
    db.tour.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    getActiveGroupTourIds(),
  ]);

  const visible = filterToursByGroupVisibility(tours, activeGroupIds);
  const ofertas = tours.filter((t) => t.showInOfertas).map(tourToPromoCard);

  return {
    heroImages: slides.map((s) => s.imageUrl).filter(Boolean),
    tours: visible.map((t) => mapTourToCard(toPublicTour(t))),
    promotions: ofertas,
  };
}

const cachedLanding = unstable_cache(loadLandingInitialData, ["landing-initial-v1"], {
  revalidate: 30,
});

/** Datos reales de DB para el primer paint (sin flash de defaults client-side). */
export async function getLandingInitialData(): Promise<LandingInitialData> {
  try {
    return await cachedLanding();
  } catch (err) {
    console.error("[landing] getLandingInitialData failed:", err);
    return { heroImages: [], tours: [], promotions: [] };
  }
}
