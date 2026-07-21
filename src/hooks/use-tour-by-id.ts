"use client";

import { useEffect, useState } from "react";
import type { OptionalToursConfig, PackageFaqItem, PackageGalleryImage } from "@/lib/tour-content";

export type LiveTour = {
  tourId: string;
  name: string;
  subtitle: string;
  image: string;
  price: number;
  originalPrice: number | null;
  duration: string;
  minDepositPerPerson?: number;
  description: string;
  includes: string[];
  excludes: string[];
  highlights: string[];
  pdfUrl: string;
  gallery: PackageGalleryImage[];
  faq: PackageFaqItem[];
  optionalTours: OptionalToursConfig;
};

export function useTourById(tourId: string) {
  const [tour, setTour] = useState<LiveTour | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tours/${encodeURIComponent(tourId)}`)
      .then((r) => (r.ok ? r.json() : { tour: null }))
      .then((data) => setTour(data.tour ?? null))
      .catch(() => setTour(null))
      .finally(() => setLoading(false));
  }, [tourId]);

  return { tour, loading };
}
