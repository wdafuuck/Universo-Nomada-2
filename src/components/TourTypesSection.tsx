"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { User, Lock, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WAVE_COLORS } from "@/components/WildlifeBackground";
import { FlowField } from "@/components/motion/FlowField";
import { gravitySpring, staggerContainer, antiGravityRise } from "@/lib/motion-presets";

const icons = [User, Lock, Users];
const TOUR_TYPES_BG = "/images/tour-types-caribbean.png";

export function TourTypesSection() {
  const { t } = useLanguage();
  const tt = t("tourTypes");

  const cardClass =
    "flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-white/80 bg-white/95 backdrop-blur-md shadow-lg shadow-sky-950/10 hover:bg-white hover:border-teal/40 hover:shadow-xl transition-colors group min-h-[180px] premium-card-lift";

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
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/45 via-teal-700/40 to-emerald-900/55 pointer-events-none" />
        </div>
        <FlowField variant="cool" className="opacity-30" intensity="subtle" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10% 0px", amount: 0.25 }}
            className="text-center mb-12"
          >
            <motion.div
              variants={antiGravityRise}
              className="inline-block rounded-2xl bg-white/90 backdrop-blur-md px-6 py-5 sm:px-8 shadow-lg shadow-sky-950/10 border border-white/70 max-w-2xl mx-auto"
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
            viewport={{ once: true, margin: "-40px", amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {tt.items.map((item: { title: string; desc: string }, i: number) => {
              const Icon = icons[i] ?? User;
              const isGrupal = i === 2;

              const content = (
                <>
                  <div className="h-12 w-12 rounded-full border border-teal/20 bg-teal/5 flex items-center justify-center shrink-0 group-hover:border-teal group-hover:bg-teal/10 transition-colors">
                    <Icon className="h-5 w-5 text-teal/80 group-hover:text-teal transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-base">{item.title}</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-snug">{item.desc}</p>
                  </div>
                  <span className="text-teal/60 group-hover:text-teal text-lg transition-colors">→</span>
                </>
              );

              const card = (
                <motion.div
                  key={item.title}
                  variants={antiGravityRise}
                  whileHover={{ y: -6, transition: gravitySpring }}
                >
                  {isGrupal ? (
                    <a href="#viajes-grupales" className={cardClass}>
                      {content}
                    </a>
                  ) : (
                    <a href="#destinos" className={cardClass}>
                      {content}
                    </a>
                  )}
                </motion.div>
              );

              return card;
            })}
          </motion.div>

          <motion.div
            variants={antiGravityRise}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10% 0px", amount: 0.25 }}
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
              className="w-full sm:w-auto min-h-[52px] px-8 py-4 rounded-full border-2 border-white/90 bg-white/90 text-slate-900 hover:bg-white font-semibold transition-colors flex items-center justify-center shadow-md"
            >
              {tt.ctaForm}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
