"use client";

import { useEffect, useState } from "react";
import type {
  GroupAccommodationInfo,
  GroupItineraryDay,
} from "@/lib/group-trip-content";

export type GroupTripDetail = {
  tourId: string;
  name: string;
  reservation: number;
  includes: string[];
  itinerary: GroupItineraryDay[];
  accommodations: GroupAccommodationInfo[];
};

export function useGroupTripDetail(tourId: string | undefined) {
  const [trip, setTrip] = useState<GroupTripDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tourId?.startsWith("group-")) {
      setTrip(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/group-trips/${encodeURIComponent(tourId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setTrip(data?.trip ?? null);
      })
      .catch(() => {
        if (!cancelled) setTrip(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tourId]);

  return { trip, loading };
}
