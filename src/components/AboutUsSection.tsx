"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WAVE_COLORS } from "@/components/WildlifeBackground";
import { FlowField } from "@/components/motion/FlowField";
import { antiGravityRise, staggerContainer } from "@/lib/motion-presets";
import { ScrollParallax } from "@/components/motion/ScrollParallax";

export function AboutUsSection() {
  const { t } = useLanguage();
  const n = t("nosotros") as {
    label: string;
    title: string;
    paragraphs: readonly string[];
    quote: string;
    names: string;
    photoCaption: string;
    impact: string;
    impactLabel: string;
  };
  const ref = useRef(null);

  return (
    <section
      id="nosotros"
      className="relative py-20 sm:py-28 pb-20 sm:pb-24 overflow-hidden"
      style={{ backgroundColor: WAVE_COLORS.light }}
    >
      <FlowField variant="warm" className="opacity-65" intensity="medium" />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px", amount: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start"
        >
          <ScrollParallax strength={36} direction={-1}>
            <motion.div variants={antiGravityRise}>
              <p className="text-teal-ink text-xs font-semibold uppercase tracking-[0.25em] mb-4">{n.label}</p>
              <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-slate-900 leading-tight tracking-tight">
                {n.title}
              </h2>

              <div className="mt-6 space-y-4">
                {n.paragraphs.map((paragraph, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed text-base sm:text-lg">
                    {paragraph}
                  </p>
                ))}
              </div>

              <blockquote className="mt-8 text-slate-800 text-lg sm:text-xl font-medium italic border-l-4 border-teal pl-5 py-1">
                &ldquo;{n.quote}&rdquo;
              </blockquote>

              <div className="mt-8">
                <a
                  href="#destinos"
                  className="inline-flex items-center justify-center min-h-[52px] px-8 py-4 rounded-full bg-teal hover:bg-teal-dark text-navy font-bold transition-colors"
                >
                  {t("destinations").verDetalles}
                </a>
              </div>
            </motion.div>
          </ScrollParallax>

          <motion.div
            variants={antiGravityRise}
            className="relative lg:sticky lg:top-24"
          >
            <div className="relative aspect-[3/4] max-w-md mx-auto lg:max-w-none rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/15 ring-1 ring-emerald-100">
              <Image
                src="/images/familia-universo-nomada-v2.jpg"
                alt="Rocío, Ricardo y Facundo — Universo Nómada"
                fill
                className="object-cover object-[center_72%]"
                sizes="(max-width: 1024px) 90vw, 480px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="text-white/90 text-sm font-medium tracking-wide">{n.photoCaption}</p>
                <p className="text-white text-xl sm:text-2xl font-light mt-1">{n.names}</p>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 bg-white rounded-2xl px-5 py-3 shadow-lg border border-emerald-100">
              <p className="text-2xl font-bold text-slate-900">{n.impact}</p>
              <p className="text-slate-500 text-xs font-medium">{n.impactLabel}</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
