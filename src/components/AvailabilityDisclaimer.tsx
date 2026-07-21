"use client";

import { Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  variant?: "compact" | "full";
  withCheckbox?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function AvailabilityDisclaimer({
  variant = "compact",
  withCheckbox = false,
  checked = false,
  onCheckedChange,
}: Props) {
  const { t } = useLanguage();
  const c = t("cart");
  const text =
    variant === "full"
      ? (c.availabilityDisclaimerFull ??
        "Tu reserva está sujeta a confirmación final de disponibilidad de alojamiento y vuelos.")
      : (c.availabilityDisclaimerCompact ??
        "El alojamiento y el vuelo que elijas son tu preferencia. Si no hay cupo, te contactaremos dentro de 24 h.");

  return (
    <div
      className={`rounded-xl border text-sm leading-relaxed ${
        variant === "full"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-slate-200 bg-slate-50 text-slate-700"
      } ${withCheckbox ? "p-4 space-y-3" : "p-3"}`}
      role="note"
    >
      <div className="flex gap-2">
        <Info
          className={`h-4 w-4 shrink-0 mt-0.5 ${variant === "full" ? "text-amber-700" : "text-teal"}`}
          aria-hidden
        />
        <div className="space-y-1.5 min-w-0">
          <p className={`font-semibold ${variant === "full" ? "text-amber-900" : "text-slate-900"}`}>
            {c.availabilityDisclaimerTitle ?? "Confirmación de disponibilidad"}
          </p>
          <p className="text-xs sm:text-sm">{text}</p>
        </div>
      </div>
      {withCheckbox && (
        <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-amber-200/80">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            className="mt-1 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
          />
          <span className="text-xs sm:text-sm font-medium text-amber-950">
            {c.availabilityDisclaimerAccept ??
              "Entiendo que la disponibilidad se confirma después y que podría haber ajustes en alojamiento o vuelo."}
          </span>
        </label>
      )}
    </div>
  );
}
