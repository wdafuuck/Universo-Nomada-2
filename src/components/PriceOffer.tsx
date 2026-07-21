"use client";

import { Tag } from "lucide-react";

export type PriceOfferProps = {
  price: number;
  originalPrice?: number | null;
  desdeLabel?: string;
  porPersonaLabel?: string;
  ahorrasLabel?: string;
  size?: "sm" | "md" | "lg";
  /** light = tarjetas blancas; dark = fondos oscuros */
  theme?: "light" | "dark";
  showSavings?: boolean;
  /** Mantiene altura uniforme en grillas cuando otras tarjetas muestran descuento */
  reserveDiscountSpace?: boolean;
  className?: string;
};

export const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

export function PriceOffer({
  price,
  originalPrice,
  desdeLabel = "Desde",
  porPersonaLabel = "por persona",
  ahorrasLabel = "Ahorras",
  size = "md",
  theme = "light",
  showSavings = true,
  reserveDiscountSpace = false,
  className = "",
}: PriceOfferProps) {
  const hasDiscount = originalPrice != null && originalPrice > price;
  const discount = hasDiscount ? Math.round((1 - price / originalPrice!) * 100) : null;
  const savings = hasDiscount ? originalPrice! - price : 0;

  const sizes = {
    sm: { price: "text-xl sm:text-2xl", original: "text-sm", badge: "text-[10px] px-2 py-0.5" },
    md: { price: "text-2xl sm:text-3xl", original: "text-sm", badge: "text-xs px-2.5 py-1" },
    lg: { price: "text-3xl sm:text-4xl", original: "text-base", badge: "text-sm px-3 py-1.5" },
  };
  const s = sizes[size];

  const priceClass = theme === "dark" ? "text-white" : "text-black";
  const originalClass = theme === "dark" ? "text-white/40" : "text-black/45";
  const savingsClass =
    theme === "dark"
      ? "text-xs font-bold text-teal bg-teal/10 border border-teal/30 px-2.5 py-1 rounded-full"
      : "text-xs font-bold text-black bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full";

  return (
    <div className={`${theme === "dark" ? "text-center" : ""} ${className}`}>
      {hasDiscount ? (
        <div className={`flex flex-wrap items-center gap-2 mb-2 ${theme === "dark" ? "justify-center" : ""}`}>
          <span
            className={`inline-flex items-center gap-1 ${s.badge} bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 text-white font-black rounded-full shadow-md shadow-rose-500/25`}
          >
            <Tag className="h-3 w-3 shrink-0" aria-hidden />
            -{discount}% OFF
          </span>
          {showSavings && (
            <span className={savingsClass}>
              {ahorrasLabel} {formatCLP(savings)}
            </span>
          )}
        </div>
      ) : reserveDiscountSpace ? (
        <div className={`mb-2 ${size === "sm" ? "min-h-[38px]" : "min-h-[40px]"}`} aria-hidden />
      ) : null}

      <p
        className={`text-[11px] font-bold uppercase tracking-[0.14em] mb-1 ${
          theme === "dark" ? "text-white/50" : "text-slate-400"
        }`}
      >
        {desdeLabel}
      </p>

      {hasDiscount ? (
        <p className={`line-through font-medium mb-0.5 ${s.original} ${originalClass}`}>
          {formatCLP(originalPrice!)}
        </p>
      ) : reserveDiscountSpace ? (
        <p className={`mb-0.5 ${s.original} opacity-0 select-none`} aria-hidden>
          {formatCLP(price)}
        </p>
      ) : null}

      <p className={`${s.price} font-black leading-none tracking-tight ${priceClass}`}>
        {formatCLP(price)}
      </p>

      <p className={`text-xs mt-1.5 font-medium ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
        {porPersonaLabel}
      </p>
    </div>
  );
}
