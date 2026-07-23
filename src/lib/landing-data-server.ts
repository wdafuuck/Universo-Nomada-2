import { db } from "@/lib/db";
import { DEFAULT_HERO_SLIDES } from "@/lib/default-hero-slides";
import { DEFAULT_PROMOTIONS, DEFAULT_TOURS } from "@/lib/default-tours";
import { toPublicTour } from "@/lib/tour-public";
import {
  filterToursByGroupVisibility,
  getActiveGroupTourIds,
} from "@/lib/group-trips-visibility";
import { syncSeasonalPromotions } from "@/lib/promo-sync";
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
  const [heroCount, tourCount, promoCount] = await Promise.all([
    db.heroSlide.count(),
    db.tour.count(),
    db.promotion.count(),
  ]);

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
  if (promoCount === 0) {
    for (const p of DEFAULT_PROMOTIONS) {
      await db.promotion.create({ data: p });
    }
  }
}

/** Datos reales de DB para el primer paint (sin flash de defaults client-side). */
export async function getLandingInitialData(): Promise<LandingInitialData> {
  try {
    await ensureLandingSeeded();
    await syncSeasonalPromotions();

    const [slides, tours, promotions, activeGroupIds] = await Promise.all([
      db.heroSlide.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: { imageUrl: true },
      }),
      db.tour.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      }),
      db.promotion.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      }),
      getActiveGroupTourIds(),
    ]);

    const visible = filterToursByGroupVisibility(tours, activeGroupIds);

    return {
      heroImages: slides.map((s) => s.imageUrl).filter(Boolean),
      tours: visible.map((t) => mapTourToCard(toPublicTour(t))),
      promotions: promotions.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        discount: p.discount,
        destination: p.destination,
        validUntil: p.validUntil,
        originalPrice: p.originalPrice,
        discountPrice: p.discountPrice,
        emoji: p.emoji,
        image: p.image,
      })),
    };
  } catch (err) {
    console.error("[landing] getLandingInitialData failed:", err);
    return { heroImages: [], tours: [], promotions: [] };
  }
}
