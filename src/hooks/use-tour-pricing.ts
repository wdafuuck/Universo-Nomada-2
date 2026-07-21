"use client";

import { useEffect, useState } from "react";
import { getDefaultPricing, type TourPricingConfig } from "@/lib/tour-pricing";

const cache: Record<string, TourPricingConfig> = {};

export function useTourPricing(tourId: string, tourName: string, fallbackPrice?: number) {
  const [config, setConfig] = useState<TourPricingConfig>(() =>
    cache[tourId] ?? getDefaultPricing(tourId, tourName, fallbackPrice)
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tours/pricing?tourId=${encodeURIComponent(tourId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.config && !cancelled) {
            cache[tourId] = data.config;
            setConfig(data.config);
            return;
          }
        }
      } catch {
        /* use defaults */
      }
      if (!cancelled) {
        const def = getDefaultPricing(tourId, tourName, fallbackPrice);
        cache[tourId] = def;
        setConfig(def);
      }
    })();
    return () => { cancelled = true; };
  }, [tourId, tourName, fallbackPrice]);

  return config;
}
