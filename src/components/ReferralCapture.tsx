"use client";

import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "un_referral_code";

export function ReferralCapture() {
  const { t } = useLanguage();
  const [code, setCode] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem(STORAGE_KEY, ref);
      setCode(ref);
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCode(stored);
    }
  }, []);

  if (!code || dismissed) return null;

  const banner = (t("referral") as { banner: string }).banner;

  return (
    <div className="fixed top-0 left-0 right-0 z-[90] bg-gradient-to-r from-teal to-emerald-500 text-[#070f1a] px-4 py-2.5 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-sm font-semibold text-center pr-8">
        <Gift className="h-4 w-4 shrink-0" />
        <span>{banner}</span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function getReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}
