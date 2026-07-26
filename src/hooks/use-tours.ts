"use client";

import { useCallback, useEffect, useState } from "react";
import type { TourCardData } from "@/components/TourCard";

export type PromoCard = {
  id: number;
  /** ID del paquete (detalle / carrito) */
  tourId?: string;
  title: string;
  subtitle: string;
  discount: string;
  destination: string;
  validUntil: string;
  originalPrice: number;
  discountPrice: number;
  emoji: string;
  image: string;
};

/** @deprecated Use useLandingData for parallel fetch */
export function useTours() {
  const [tours, setTours] = useState<TourCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const bust = tick > 0 ? `?t=${tick}` : "";
    fetch(`/api/tours${bust}`, tick > 0 ? { cache: "no-store" } : {})
      .then((r) => r.json())
      .then((data) => {
        setTours((data.tours ?? []).map((t: {
          tourId: string; name: string; subtitle: string; image: string;
          tag: string; price: number; duration: string; originalPrice: number | null; category: string;
        }) => ({
          id: t.tourId, name: t.name, subtitle: t.subtitle, image: t.image, tag: t.tag,
          price: t.price, duration: t.duration, originalPrice: t.originalPrice ?? undefined, category: t.category,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tick]);

  return { tours, loading, refetch };
}

/** @deprecated Use useLandingData for parallel fetch */
export function usePromotions() {
  const [promotions, setPromotions] = useState<PromoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const bust = tick > 0 ? `?t=${tick}` : "";
    fetch(`/api/promotions${bust}`, tick > 0 ? { cache: "no-store" } : {})
      .then((r) => r.json())
      .then((data) => setPromotions(data.promotions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tick]);

  return { promotions, loading, refetch };
}
