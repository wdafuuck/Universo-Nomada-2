"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Flame, ListChecks } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PriceOffer } from "@/components/PriceOffer";
import type { TourDestinationGroup } from "@/lib/tour-destination-groups";
import { tourVariantLabel } from "@/lib/tour-destination-groups";
import { normalizeTourCategory } from "@/lib/tour-category";

type Props = {
  group: TourDestinationGroup;
  onCardClick?: () => void;
};

const categoryStyles: Record<string, { badge: string; accent: string }> = {
  nacional: { badge: "bg-emerald-700 text-white", accent: "from-emerald-500 to-teal-600" },
  chile: { badge: "bg-emerald-700 text-white", accent: "from-emerald-500 to-teal-600" },
  internacional: { badge: "bg-sky-700 text-white", accent: "from-sky-500 to-blue-600" },
  grupal: { badge: "bg-amber-600 text-[#070f1a]", accent: "from-amber-500 to-orange-500" },
  experiencial: { badge: "bg-violet-700 text-white", accent: "from-violet-500 to-purple-600" },
};

export function DestinationTourGroup({ group, onCardClick }: Props) {
  const { t } = useLanguage();
  const dest = t("destinations");
  const lead = group.tours[0];
  const cat = normalizeTourCategory(lead.category, lead.id);
  const style = categoryStyles[cat] ?? categoryStyles.nacional;
  const isGroupTrip = cat === "grupal";

  return (
    <div
      className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100/80 hover:-translate-y-1.5 hover:border-teal/20 flex flex-col self-start w-full"
      onClick={onCardClick}
    >
      <div className="relative h-48 overflow-hidden shrink-0">
        <Image
          src={group.image}
          alt={group.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, 320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

        <span className={`absolute top-3 left-3 ${style.badge} text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
          {lead.tag}
        </span>

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">{group.title}</h3>
          <p className="text-white/90 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {group.subtitle}
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col">
        {isGroupTrip && (
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold mb-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            <Flame className="h-4 w-4 shrink-0 text-orange-500" />
            {t("tourCard").limited}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {group.tours.map((tour) => {
            const variant = tourVariantLabel(tour, group.title);
            const hasDiscount = tour.originalPrice != null && tour.originalPrice > tour.price;
            const pickCount = tour.includedToursPickCount ?? 0;

            return (
              <div
                key={tour.id}
                className={`rounded-2xl border p-3 flex flex-col ${
                  hasDiscount
                    ? "bg-gradient-to-br from-emerald-50 via-white to-amber-50/60 border-emerald-200/70"
                    : "bg-slate-50/80 border-slate-100"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="font-bold text-slate-900 text-sm leading-snug mb-1">{variant}</p>

                <div className="flex items-end justify-between gap-2 mb-1 h-[96px]">
                  <PriceOffer
                    price={tour.price}
                    originalPrice={tour.originalPrice}
                    desdeLabel={dest.desde}
                    porPersonaLabel={dest.porPersona}
                    ahorrasLabel={t("priceOffer").ahorras}
                    size="sm"
                    reserveDiscountSpace
                  />
                  <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold bg-white px-2.5 py-1.5 rounded-full border border-slate-100 shadow-sm shrink-0">
                    <Clock className="h-3.5 w-3.5 text-teal" />
                    {tour.duration}
                  </div>
                </div>

                {pickCount > 0 ? (
                  <div className="flex items-center gap-2 text-sky-700 text-xs font-semibold mb-1 bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1.5">
                    <ListChecks className="h-3.5 w-3.5 shrink-0" />
                    {dest.chooseTours
                      .replace("{count}", String(pickCount))
                      .replace("{total}", String(tour.includedToursTotal ?? pickCount))}
                  </div>
                ) : (
                  <div className="mb-1 min-h-[30px]" aria-hidden />
                )}

                <Link href={`/detalle-paquete/${tour.id}`}>
                  <button
                    type="button"
                    className={`w-full min-h-[44px] rounded-2xl bg-gradient-to-r ${style.accent} text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    {dest.verPrograma}
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
