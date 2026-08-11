"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Clock, Flame, ListChecks } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PriceOffer } from "@/components/PriceOffer";
import { normalizeTourCategory } from "@/lib/tour-category";
import { gravitySpring } from "@/lib/motion-presets";

export type TourCardData = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  tag: string;
  price: number;
  duration: string;
  originalPrice?: number;
  category: string;
  includedToursPickCount?: number;
  includedToursTotal?: number;
};

const categoryStyles: Record<string, { badge: string; accent: string; ring: string }> = {
  nacional: { badge: "bg-emerald-700 text-white", accent: "from-emerald-500 to-teal-600", ring: "ring-emerald-200" },
  chile: { badge: "bg-emerald-700 text-white", accent: "from-emerald-500 to-teal-600", ring: "ring-emerald-200" },
  internacional: { badge: "bg-sky-700 text-white", accent: "from-sky-500 to-blue-600", ring: "ring-sky-200" },
  grupal: { badge: "bg-amber-600 text-[#070f1a]", accent: "from-amber-500 to-orange-500", ring: "ring-amber-200" },
  experiencial: { badge: "bg-violet-700 text-white", accent: "from-violet-500 to-purple-600", ring: "ring-violet-200" },
};

export function TourCard({ tour, onClick }: { tour: TourCardData; onClick?: () => void }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const cat = normalizeTourCategory(tour.category, tour.id);
  const style = categoryStyles[cat] ?? categoryStyles.nacional;
  const isGroupTrip = cat === "grupal";
  const hasDiscount = tour.originalPrice != null && tour.originalPrice > tour.price;
  const hasIncludedTours = (tour.includedToursPickCount ?? 0) > 0;
  const discount = hasDiscount
    ? Math.round((1 - tour.price / tour.originalPrice!) * 100)
    : null;

  const handleTilt = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current as HTMLDivElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 8, ry: x * 8 });
  };

  const resetTilt = () => setTilt({ rx: 0, ry: 0 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={gravitySpring}
      onMouseMove={handleTilt}
      onMouseLeave={resetTilt}
      style={{
        transform: inView
          ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
          : undefined,
      }}
      className="group card-3d-tilt bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100/80 hover:-translate-y-2 hover:border-teal/30"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden shrink-0">
        <Image
          src={tour.image}
          alt={tour.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.15]"
          sizes="(max-width: 640px) 100vw, 320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-black/10 via-transparent to-black/5" />

        <span className={`absolute top-3 left-3 ${style.badge} text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
          {tour.tag}
        </span>

        {discount != null && (
          <motion.span
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ ...gravitySpring, delay: 0.2 }}
            className="absolute top-3 right-3 bg-gradient-to-r from-rose-700 to-orange-700 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-rose-500/30"
          >
            -{discount}%
          </motion.span>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">{tour.name}</h3>
          <p className="text-white/90 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />{tour.subtitle}
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col">
        <div
          className={`rounded-2xl p-3 mb-1 border h-[160px] flex items-end shrink-0 ${
            hasDiscount
              ? "bg-gradient-to-br from-emerald-50 via-white to-amber-50/60 border-emerald-200/70"
              : "bg-slate-50/80 border-slate-100"
          }`}
        >
          <div className="flex items-end justify-between gap-3 w-full">
            <PriceOffer
              price={tour.price}
              originalPrice={tour.originalPrice}
              desdeLabel={t("destinations").desde}
              porPersonaLabel={t("destinations").porPersona}
              ahorrasLabel={t("priceOffer").ahorras}
              size="md"
              reserveDiscountSpace
            />
            <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold bg-white px-2.5 py-1.5 rounded-full border border-slate-100 shadow-sm shrink-0">
              <Clock className="h-3.5 w-3.5 text-teal" />
              {tour.duration}
            </div>
          </div>
        </div>

        {hasIncludedTours && (
          <div className="flex items-center gap-2 text-sky-700 text-xs font-semibold mb-1 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2">
            <ListChecks className="h-4 w-4 shrink-0" />
            {t("destinations").chooseTours
              .replace("{count}", String(tour.includedToursPickCount))
              .replace("{total}", String(tour.includedToursTotal ?? tour.includedToursPickCount))}
          </div>
        )}

        {isGroupTrip && (
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold mb-1 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            <Flame className="h-4 w-4 shrink-0 text-orange-500" />
            {t("tourCard").limited}
          </div>
        )}

        <div onClick={(e) => e.stopPropagation()}>
          <Link href={`/detalle-paquete/${tour.id}`}>
            <button
              className={`w-full min-h-[44px] rounded-2xl bg-gradient-to-r ${style.accent} text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97]`}
            >
              {t("destinations").verPrograma}
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
