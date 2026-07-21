"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export function SkipLink() {
  const { t } = useLanguage();
  const label = (t("a11y") as { skipToContent?: string })?.skipToContent ?? "Saltar al contenido principal";

  return (
    <a
      href="#main-content"
      className="skip-link fixed left-4 top-4 z-[300] -translate-y-24 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-teal"
    >
      {label}
    </a>
  );
}
