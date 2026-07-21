"use client";

import { useEffect, useState } from "react";

export function useSiteContentOverride<T>(key: string, fallback: T): T {
  const [data, setData] = useState<T>(fallback);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/site-content?key=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.content) setData(json.content as T);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [key]);

  return data;
}
