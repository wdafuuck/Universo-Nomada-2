"use client";

import { useSyncExternalStore, useState } from "react";
import { Clock, Gift, X } from "lucide-react";
import {
  formatRouletteCountdown,
  getStoredRoulettePrize,
  rouletteMsRemaining,
  subscribeRoulettePrize,
  type StoredRoulettePrize,
} from "@/lib/roulette-client";
import {
  isRouletteDiscountPrize,
  roulettePrizeLabel,
  roulettePrizeHasBenefit,
} from "@/lib/roulette-shared";

function readActivePrize(): StoredRoulettePrize | null {
  const stored = getStoredRoulettePrize();
  if (!stored || !roulettePrizeHasBenefit(stored.prize)) return null;
  return stored;
}

export function RoulettePrizeBar() {
  const [dismissed, setDismissed] = useState(false);
  const prize = useSyncExternalStore(
    subscribeRoulettePrize,
    readActivePrize,
    () => null,
  );

  if (!prize || dismissed) return null;

  const msLeft = rouletteMsRemaining(prize.expiresAt);
  if (msLeft <= 0) return null;

  const label = roulettePrizeLabel(prize.prize);
  const isDiscount = isRouletteDiscountPrize(prize.prize);

  return (
    <div className="fixed top-0 left-0 right-0 z-[85] bg-gradient-to-r from-navy to-[#0F2440] text-white shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3 text-sm">
        <Gift className="h-4 w-4 text-teal shrink-0" />
        <p className="flex-1 min-w-0 truncate">
          <span className="font-semibold text-teal">{label}</span>
          {isDiscount && <span className="text-white/70"> — se aplica automático en el carrito</span>}
        </p>
        <span className="flex items-center gap-1.5 font-bold text-amber-300 shrink-0 tabular-nums">
          <Clock className="h-3.5 w-3.5" />
          {formatRouletteCountdown(msLeft)}
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          aria-label="Ocultar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
