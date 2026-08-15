"use client";

import Image from "next/image";
import { Coffee, UtensilsCrossed, Moon, Wine, CheckCircle2 } from "lucide-react";
import type { GroupDayMeals, GroupItineraryDay } from "@/lib/group-trip-content";

const MEALS: {
  key: keyof GroupDayMeals;
  label: string;
  Icon: typeof Coffee;
}[] = [
  { key: "breakfast", label: "Desayuno", Icon: Coffee },
  { key: "lunch", label: "Almuerzo", Icon: UtensilsCrossed },
  { key: "dinner", label: "Cena", Icon: Moon },
  { key: "cocktail", label: "Cóctel", Icon: Wine },
];

type Props = {
  days: GroupItineraryDay[];
};

export function GroupTripItinerarySection({ days }: Props) {
  if (!days.length) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-5">Itinerario</h2>
      <div className="space-y-5">
        {days.map((day) => (
          <article
            key={day.day}
            className="rounded-2xl border border-gray-700 bg-gray-800/80 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_minmax(160px,220px)] gap-0 md:gap-0">
              {/* Foto izquierda */}
              <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[180px] bg-gray-900">
                {day.image ? (
                  <Image
                    src={day.image}
                    alt={day.title || `Día ${day.day}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 200px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
                    Día {day.day}
                  </div>
                )}
                <span className="absolute top-3 left-3 rounded-full bg-navy/90 text-teal text-xs font-bold px-3 py-1">
                  Día {day.day}
                </span>
              </div>

              {/* Descripción centro */}
              <div className="p-5 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-700/80">
                <h3 className="text-white font-bold text-lg leading-snug">
                  {day.title || `Día ${day.day}`}
                </h3>
                {day.description.trim() ? (
                  <p className="mt-2 text-gray-300 text-sm leading-relaxed">
                    {day.description.trim()}
                  </p>
                ) : null}
                {/* Comidas */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {MEALS.map(({ key, label, Icon }) => {
                    const on = day.meals[key];
                    return (
                      <span
                        key={key}
                        title={label}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
                          on
                            ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                            : "bg-white/5 border-white/10 text-white/25"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Actividades derecha */}
              <div className="p-5 border-t md:border-t-0 md:border-l border-gray-700/80 bg-gray-900/40">
                <p className="text-teal text-xs font-bold uppercase tracking-wider mb-3">
                  Actividades
                </p>
                {day.activities.filter((a) => a.trim()).length === 0 ? (
                  <p className="text-gray-500 text-sm">Por confirmar</p>
                ) : (
                  <ul className="space-y-2">
                    {day.activities
                      .filter((a) => a.trim())
                      .map((act, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                          <span className="leading-snug">{act.trim()}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
