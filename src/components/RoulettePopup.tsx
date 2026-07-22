"use client";

import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStoredRoulettePrize } from "@/lib/roulette-client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Ya no gira en el home (crasheaba móviles). Invita a /ruleta.
 */
export function RoulettePopup({ isOpen, onClose }: Props) {
  const { t } = useLanguage();
  const lp = t("leadPopup") as { title: string; subtitle: string; dismiss: string };
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setBlocked(!!getStoredRoulettePrize());
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-t-2xl sm:rounded-3xl bg-gradient-to-br from-teal via-teal to-amber-500 text-white p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <Gift className="h-10 w-10 mb-3 text-white" aria-hidden />
        <h2 className="text-2xl font-black mb-2 pr-8">{lp.title}</h2>
        <p className="text-white/90 text-sm mb-6 leading-relaxed">{lp.subtitle}</p>

        {blocked ? (
          <p className="text-sm text-white/90 mb-4">
            Ya tienes un premio activo. Úsalo al armar tu reserva.
          </p>
        ) : (
          <Button
            asChild
            className="w-full bg-[#0f172a] hover:bg-black text-white font-bold rounded-full h-12"
          >
            <a href="/ruleta">Girar la ruleta</a>
          </Button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-white/80 hover:text-white text-sm underline underline-offset-2 mx-auto block"
        >
          {lp.dismiss ?? "No gracias"}
        </button>
      </div>
    </div>
  );
}
