"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCookieConsent, setCookieConsent } from "@/lib/cookie-consent";

export function CookieConsent() {
  const { t } = useLanguage();
  const c = t("cookies") as {
    title: string;
    body: string;
    acceptAll: string;
    essentialOnly: string;
    privacy: string;
  };
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const choose = (level: "essential" | "all") => {
    setCookieConsent(level);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-0 left-0 right-0 z-[250] border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl p-4 sm:p-5"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p id="cookie-consent-title" className="font-bold text-slate-900 text-sm">
            {c.title}
          </p>
          <p id="cookie-consent-desc" className="mt-1 text-slate-600 text-xs sm:text-sm leading-relaxed">
            {c.body}{" "}
            <Link href="/politica-privacidad" className="text-teal font-semibold hover:underline">
              {c.privacy}
            </Link>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => choose("essential")}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            {c.essentialOnly}
          </button>
          <button
            type="button"
            onClick={() => choose("all")}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-teal text-navy text-sm font-bold hover:bg-teal-dark"
          >
            {c.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
