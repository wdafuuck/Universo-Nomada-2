"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Contenido editable del admin (español).
 * Solo sobrescribe traducciones cuando el idioma activo es ES;
 * en EN/FR/ZH/PT se usan las keys de i18n.
 */
export function useSiteContentOverride<T>(key: string, fallback: T): T {
  const { language } = useLanguage();
  const [override, setOverride] = useState<T | null>(null);

  useEffect(() => {
    if (language !== "es") {
      setOverride(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/site-content?key=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.content) setOverride(json.content as T);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key, language]);

  if (language !== "es") return fallback;
  return override ?? fallback;
}
