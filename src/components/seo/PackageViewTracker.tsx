"use client";

import { useEffect, useRef } from "react";
import { trackViewItem } from "@/lib/analytics-events";

type Props = {
  tourId: string;
  tourName: string;
  price: number;
};

export function PackageViewTracker({ tourId, tourName, price }: Props) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !tourId || !tourName || price <= 0) return;
    tracked.current = true;
    trackViewItem({ item_id: tourId, item_name: tourName, price });
  }, [tourId, tourName, price]);

  return null;
}
