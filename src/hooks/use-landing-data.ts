"use client";

import { useCallback, useEffect, useState } from "react";
import type { TourCardData } from "@/components/TourCard";
import type { PromoCard } from "@/hooks/use-tours";

type Options = {
  initialTours?: TourCardData[];
  initialPromotions?: PromoCard[];
};

function mapApiTours(toursData: { tours?: Array<{
  tourId: string; name: string; subtitle: string; image: string;
  tag: string; price: number; duration: string; originalPrice: number | null; category: string;
  optionalTours?: { pickCount?: number; options?: unknown[] };
}> }): TourCardData[] {
  return (toursData.tours ?? []).map((t) => ({
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
}

export function useLandingData(options: Options = {}) {
  const { initialTours = [], initialPromotions = [] } = options;
  const [tours, setTours] = useState<TourCardData[]>(initialTours);
  const [promotions, setPromotions] = useState<PromoCard[]>(initialPromotions);
  const [promotionsLoaded, setPromotionsLoaded] = useState(true);
  const [toursLoaded, setToursLoaded] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    // Primer paint ya tiene datos SSR; solo refetch tras admin o tick explícito
    if (tick === 0) return;

    const bust = `?t=${tick}`;
    const opts: RequestInit = { cache: "no-store" };

    Promise.all([
      fetch(`/api/tours${bust}`, opts).then((r) => r.json()),
      fetch(`/api/promotions${bust}`, opts).then((r) => r.json()),
    ])
      .then(([toursData, promosData]) => {
        setTours(mapApiTours(toursData));
        setPromotions(promosData.promotions ?? []);
        setToursLoaded(true);
        setPromotionsLoaded(true);
      })
      .catch(() => {
        setToursLoaded(true);
        setPromotionsLoaded(true);
      });
  }, [tick]);

  return { tours, promotions, promotionsLoaded, toursLoaded, refetch };
}
