"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { UploadAwareImage } from "@/components/UploadAwareImage";
import { PriceOffer } from "@/components/PriceOffer";
import { PromoUrgency } from "@/components/PromoUrgency";
import { AddToCartButton } from "@/components/AddToCartButton";
import { gravitySpring } from "@/lib/motion-presets";
import type { PromoDestinationGroup } from "@/lib/tour-ofertas";
import type { PromoCard } from "@/hooks/use-tours";
import type { TourCardData } from "@/components/TourCard";

type PromoOfferCardProps = {
  group: PromoDestinationGroup;
  layout: "compact" | "grid";
  groupIndex: number;
  labels: {
    verDetalles: string;
    hasta: string;
    desde: string;
    porPersona: string;
    ahorras: string;
  };
  resolveTourId: (promo: PromoCard, index: number) => string;
  getDuration: (promo: PromoCard) => string;
  tourList: TourCardData[];
};

export function PromoOfferCard({
  group,
  layout,
  groupIndex,
  labels,
  resolveTourId,
  getDuration,
  tourList,
}: PromoOfferCardProps) {
  const compact = layout === "compact";
  const lead = group.promos[0];
  const multi = group.promos.length > 1;

  return (
    <motion.div
      className={`group premium-card-lift bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden gradient-card-border ${
        compact ? "sm:grid sm:grid-cols-[minmax(160px,38%)_1fr] sm:items-stretch" : ""
      }`}
      whileHover={{ y: compact ? -4 : -8, transition: gravitySpring }}
    >
      <div
        className={`relative overflow-hidden ${
          compact ? "h-44 sm:h-auto sm:min-h-[200px] sm:max-h-[260px]" : "h-48"
        }`}
      >
        <UploadAwareImage
          src={group.image}
          alt={group.title}
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          sizes={compact ? "(max-width: 640px) 100vw, 38vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full shadow-lg">
            {lead.discount}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="text-2xl drop-shadow-lg">{group.emoji}</span>
        </div>
      </div>

      <div className={`p-4 ${compact ? "sm:p-5 sm:flex sm:flex-col sm:justify-center" : "p-5"}`}>
        <h3 className={`text-gray-900 font-bold mb-0.5 ${compact ? "text-lg sm:text-xl" : "text-lg"}`}>
          {multi ? group.destinationName : group.title}
        </h3>
        <p className={`text-gray-600 mb-3 line-clamp-2 ${compact ? "text-sm" : "text-sm"}`}>
          {multi ? group.title : lead.subtitle}
        </p>

        {!compact && !multi ? (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">✈️ Vuelo</span>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">🏨 Hotel</span>
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">🎯 Tour</span>
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">👥 Guías Locales</span>
            </div>
          </div>
        ) : null}

        <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
          {group.promos.map((promo, i) => {
            const promoTourId = resolveTourId(promo, i);
            const duration = getDuration(promo);

            if (compact) {
              return (
                <div
                  key={promo.tourId ?? `${group.key}-${i}`}
                  className="rounded-xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/80 to-white px-3 py-2.5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {duration ? (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800">
                          <Clock className="h-3 w-3 text-teal" aria-hidden />
                          {duration}
                        </span>
                      ) : null}
                      <PriceOffer
                        price={promo.discountPrice}
                        originalPrice={promo.originalPrice}
                        desdeLabel={labels.desde}
                        porPersonaLabel={labels.porPersona}
                        ahorrasLabel={labels.ahorras}
                        size="sm"
                        showSavings={false}
                        className="min-w-0"
                      />
                    </div>
                    <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/detalle-paquete/${promoTourId}`}
                        className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg px-3 py-2 text-xs transition-all min-h-[36px] shadow-sm"
                      >
                        {labels.verDetalles}
                      </Link>
                      <AddToCartButton
                        tourId={promoTourId}
                        tourName={promo.subtitle}
                        image={promo.image}
                        basePrice={promo.discountPrice}
                        duration={duration || tourList.find((tt) => tt.id === promoTourId)?.duration}
                        className="rounded-lg min-h-[36px] text-xs"
                      />
                    </div>
                  </div>
                  {promo.validUntil && groupIndex === 0 && i === 0 ? (
                    <PromoUrgency validUntil={promo.validUntil} spotsLeft={5} />
                  ) : null}
                </div>
              );
            }

            return (
              <div
                key={promo.tourId ?? `${group.key}-${i}`}
                className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-amber-50/50 border border-emerald-200/60 p-4"
              >
                {multi && duration ? (
                  <p className="font-bold text-slate-900 text-sm mb-2">{duration}</p>
                ) : null}

                <div className="flex items-end justify-between gap-3">
                  <PriceOffer
                    price={promo.discountPrice}
                    originalPrice={promo.originalPrice}
                    desdeLabel={labels.desde}
                    porPersonaLabel={labels.porPersona}
                    ahorrasLabel={labels.ahorras}
                    size="md"
                  />
                  {!multi && duration ? (
                    <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                      <Clock className="h-3.5 w-3.5 text-teal" aria-hidden />
                      {duration}
                    </span>
                  ) : null}
                </div>

                {promo.validUntil ? (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden />
                      {labels.hasta} {promo.validUntil}
                    </span>
                  </div>
                ) : null}
                {promo.validUntil ? (
                  <PromoUrgency validUntil={promo.validUntil} spotsLeft={groupIndex === 0 && i === 0 ? 5 : undefined} />
                ) : null}

                <div className="flex flex-col gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/detalle-paquete/${promoTourId}`}
                    className="flex flex-1 items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl px-4 py-3 text-sm transition-all min-h-[44px] shadow-md shadow-emerald-500/20"
                  >
                    {labels.verDetalles}
                  </Link>
                  <div className="flex-1">
                    <AddToCartButton
                      tourId={promoTourId}
                      tourName={promo.subtitle}
                      image={promo.image}
                      basePrice={promo.discountPrice}
                      duration={duration || tourList.find((tt) => tt.id === promoTourId)?.duration}
                      className="rounded-xl min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
