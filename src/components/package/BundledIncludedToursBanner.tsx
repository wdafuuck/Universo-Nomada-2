"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import type { BundledIncludedTour } from "@/lib/tour-content";

type Props = {
  tours: BundledIncludedTour[];
  title?: string;
  theme?: "light" | "dark";
};

export function BundledIncludedToursBanner({
  tours,
  title = "Tours incluidos:",
  theme = "light",
}: Props) {
  const visible = tours.filter((t) => t.name.trim());
  if (!visible.length) return null;

  const isDark = theme === "dark";

  return (
    <div
      className={
        isDark
          ? "mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4"
          : "mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
      }
    >
      <p
        className={
          isDark
            ? "font-semibold text-emerald-300 mb-3 flex items-center gap-2"
            : "font-semibold text-emerald-900 mb-3 flex items-center gap-2"
        }
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {title}
      </p>
      <ul className="space-y-2">
        {visible.map((tour) => (
          <li key={tour.id} className="flex gap-3 items-start">
            {tour.image ? (
              <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0">
                <Image src={tour.image} alt={tour.name} fill className="object-cover" sizes="48px" />
              </div>
            ) : (
              <CheckCircle2
                className={`h-5 w-5 mt-0.5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
              />
            )}
            <div className="min-w-0">
              <p className={`font-medium text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                {tour.name}
              </p>
              {tour.description?.trim() ? (
                <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                  {tour.description.trim()}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
