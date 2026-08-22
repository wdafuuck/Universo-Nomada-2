"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  isHeroCopyHidden,
  mergeHeroCopy,
  type HeroSiteContent,
} from "@/lib/hero-site-content";

type HeroCopyFallback = {
  line1: string;
  line2: string;
  subtitle: string;
};

/**
 * Texto editable del hero (ES) + flag global de ocultar título/subtítulo.
 */
export function useHeroSiteContent(fallback: HeroCopyFallback) {
  const { language } = useLanguage();
  const [content, setContent] = useState<HeroSiteContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-content?key=hero")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.content) setContent(json.content as HeroSiteContent);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const merged = mergeHeroCopy(fallback, content, {
    applyTextOverrides: language === "es",
  });

  return {
    line1: merged.line1,
    line2: merged.line2,
    subtitle: merged.subtitle,
    hideCopy: isHeroCopyHidden(content),
  };
}
