"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { User, Lock, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WAVE_COLORS } from "@/components/WildlifeBackground";
import { gravitySpring, staggerContainer } from "@/lib/motion-presets";

const icons = [User, Lock, Users];
const TOUR_TYPES_BG = "/images/tour-types-caribbean.png";

const FALLBACK_ITEMS = [
  { title: "Personalizado", desc: "Itinerario a tu medida, ritmo y gustos." },
  { title: "Privado", desc: "Solo tu grupo. Guía exclusivo, cero multitudes." },
  { title: "Grupal", desc: "Fechas fijas. Conoce viajeros como tú." },
] as const;

/** Sin filter/blur: clip-path + filter deja las tarjetas invisibles en Safari/Chrome. */
const cardRise = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: gravitySpring,
  },
};

export function TourTypesSection() {
  const { t } = useLanguage();
  const tt = t("tourTypes");
  const items =
    Array.isArray(tt.items) && tt.items.length > 0 ? tt.items : [...FALLBACK_ITEMS];

  const cardClass =
    "flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-sky-950/20 hover:border-teal/50 hover:shadow-2xl transition-colors group min-h-[180px]";

  return (
    <section
      id="experiencias"
      className="relative overflow-hidden"
      style={{ backgroundColor: WAVE_COLORS.slateSoft }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-14 sm:h-20 z-0"
        style={{ backgroundColor: WAVE_COLORS.ocean }}
      />

      <svg aria-hidden className="absolute w-0 h-0" focusable="false">
        <defs>
          <clipPath id="tour-types-wave-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0.04 C0.25,0.006 0.75,0.09 1,0.04 L1,0.96 C0.75,0.91 0.25,0.994 0,0.96 Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        className="relative z-10 py-16 sm:py-20 pb-20 sm:pb-24"
        style={{
          clipPath: "url(#tour-types-wave-clip)",
          WebkitClipPath: "url(#tour-types-wave-clip)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <Image
            src={TOUR_TYPES_BG}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            quality={85}
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-700/55 via-teal-800/50 to-emerald-950/60 pointer-events-none" />
          <div className="absolute inset-0 bg-slate-900/25 pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="text-center mb-12"
          >
            <motion.div
              variants={cardRise}
              className="inline-block rounded-2xl bg-white px-6 py-5 sm:px-8 shadow-lg shadow-sky-950/15 border border-white max-w-2xl mx-auto"
            >
              <p className="text-teal-700 text-xs font-bold uppercase tracking-[0.2em] mb-3">{tt.badge}</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{tt.title}</h2>
              <p className="mt-3 text-slate-600 text-base max-w-lg mx-auto">{tt.subtitle}</p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {items.map((item, i) => {
              const Icon = icons[i] ?? User;
              const href = i === 2 ? "#viajes-grupales" : "#destinos";

              return (
                <motion.div
                  key={`${item.title}-${i}`}
                  variants={cardRise}
                  whileHover={{ y: -6, transition: gravitySpring }}
                >
                  <a href={href} className={cardClass}>
                    <div className="h-12 w-12 rounded-full border border-teal/25 bg-teal/10 flex items-center justify-center shrink-0 group-hover:border-teal group-hover:bg-teal/15 transition-colors">
                      <Icon className="h-5 w-5 text-teal group-hover:text-teal-dark transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-base">{item.title}</h3>
                      <p className="text-slate-600 text-sm mt-1 leading-snug">{item.desc}</p>
                    </div>
                    <span className="text-teal/70 group-hover:text-teal text-lg transition-colors" aria-hidden>
                      →
                    </span>
                  </a>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            variants={cardRise}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a
              href="#destinos"
              className="w-full sm:w-auto min-h-[52px] px-8 py-4 rounded-full bg-teal hover:bg-teal-dark text-navy font-bold transition-colors flex items-center justify-center shadow-lg shadow-teal-900/20"
            >
              {t("destinations").verDetalles}
            </a>
            <a
              href="#contacto"
              className="w-full sm:w-auto min-h-[52px] px-8 py-4 rounded-full border-2 border-white bg-white text-slate-900 hover:bg-slate-50 font-semibold transition-colors flex items-center justify-center shadow-md"
            >
              {tt.ctaForm}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
