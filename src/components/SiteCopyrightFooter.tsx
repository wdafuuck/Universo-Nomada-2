"use client";

import { useLanguage } from "@/contexts/LanguageContext";

/** Barra inferior fija de copyright en todas las páginas. */
export function SiteCopyrightFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-[#0D1B2A] border-t border-white/5 py-4 px-4 text-center"
      aria-label="Derechos de autor"
    >
      <p className="text-white/65 text-xs sm:text-sm">
        © {year} Universo Nómada®. {t("footer").copyright}
      </p>
    </footer>
  );
}
