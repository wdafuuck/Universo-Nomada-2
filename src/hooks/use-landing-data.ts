"use client";

import { useCallback, useEffect, useState } from "react";
import type { TourCardData } from "@/components/TourCard";
import type { PromoCard } from "@/hooks/use-tours";

export function useLandingData() {
  const [tours, setTours] = useState<TourCardData[]>([]);
  const [promotions, setPromotions] = useState<PromoCard[]>([]);
  const [promotionsLoaded, setPromotionsLoaded] = useState(false);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const bust = tick > 0 ? `?t=${tick}` : "";
    const opts: RequestInit = tick > 0 ? { cache: "no-store" } : {};

    Promise.all([
      fetch(`/api/tours${bust}`, opts).then((r) => r.json()),
      fetch(`/api/promotions${bust}`, opts).then((r) => r.json()),
    ])
      .then(([toursData, promosData]) => {
        const mapped: TourCardData[] = (toursData.tours ?? []).map((t: {
          tourId: string; name: string; subtitle: string; image: string;
          tag: string; price: number; duration: string; originalPrice: number | null; category: string;
          optionalTours?: { pickCount?: number; options?: unknown[] };
        }) => ({
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
        }));
        setTours(mapped);
        setPromotions(promosData.promotions ?? []);
        setPromotionsLoaded(true);
      })
      .catch(() => {
        setPromotionsLoaded(true);
      });
  }, [tick]);

  return { tours, promotions, promotionsLoaded, refetch };
}
