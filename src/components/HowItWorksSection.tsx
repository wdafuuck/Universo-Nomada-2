"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRef } from "react";
import { Compass, Sparkles, FileText, Plane } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteContentOverride } from "@/hooks/use-site-content";
import { antiGravityRise, gravitySpring, staggerContainer } from "@/lib/motion-presets";
import { WAVE_COLORS } from "@/components/WildlifeBackground";

const icons = [Compass, Sparkles, FileText, Plane];

const CARIBBEAN_BG = "/images/punta-cana-caribbean.jpg";

function PalmSilhouette({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 200"
      className={className}
      fill="currentColor"
    >
      <path d="M58 200V92c-8-2-14-8-16-16 6 2 12 2 18 0-4-10-2-22 6-30-8 4-14 12-16 22 4-8 12-14 22-16-6-12-4-26 6-34-10 6-16 18-14 30 8-6 18-8 28-4-8-14-6-32 8-42-12 8-18 22-16 36 10-8 24-10 36-4-6-18 0-38 14-50-8 12-10 28-4 42 12-8 28-8 40 2-2-16 4-34 18-44-6 14-4 30 6 42 10-6 22-6 32 0V200H58z" />
    </svg>
  );
}

export function HowItWorksSection() {
  const { t } = useLanguage();
  const fallback = t("howItWorks") as {
    label: string;
    title: string;
    subtitle: string;
    steps: readonly { title: string; desc: string }[];
  };
  const h = useSiteContentOverride("howItWorks", fallback);
  const ref = useRef(null);

  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden"
      style={{ backgroundColor: WAVE_COLORS.benefits }}
    >
      {/* Blanco solo en la ola superior (continúa desde destinos) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-14 sm:h-20 bg-white z-0"
      />

      <svg aria-hidden className="absolute w-0 h-0" focusable="false">
        <defs>
          <clipPath id="how-it-works-wave-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0.04 C0.25,0.006 0.75,0.09 1,0.04 L1,0.96 C0.75,0.91 0.25,0.994 0,0.96 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Foto + contenido en un solo bloque con ola arriba y abajo */}
      <div
        className="relative z-10 py-16 sm:py-24 pb-20 sm:pb-28"
        style={{
          clipPath: "url(#how-it-works-wave-clip)",
          WebkitClipPath: "url(#how-it-works-wave-clip)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <Image
            src={CARIBBEAN_BG}
            alt=""
            fill
            className="object-cover object-center scale-105"
            sizes="100vw"
            quality={80}
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/55 via-teal-700/50 to-emerald-900/65 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-emerald-900/20 to-cyan-400/15 pointer-events-none" />
          <PalmSilhouette className="absolute -left-4 bottom-[6%] w-28 sm:w-36 text-emerald-950/25 pointer-events-none hidden sm:block" />
          <PalmSilhouette className="absolute -right-6 bottom-[6%] w-32 sm:w-44 text-emerald-950/20 pointer-events-none scale-x-[-1] hidden sm:block" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-14"
          >
            <motion.div
              variants={antiGravityRise}
              className="inline-block rounded-2xl bg-white/88 backdrop-blur-md px-6 py-5 sm:px-8 sm:py-6 shadow-lg shadow-cyan-950/10 border border-white/60 max-w-3xl mx-auto"
            >
              <span className="text-teal-700 text-xs font-bold uppercase tracking-[0.2em]">
                {h.label}
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {h.title}
              </h2>
              <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto">
                {h.subtitle}
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            ref={ref}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5"
          >
            {h.steps.map((step, i) => {
              const Icon = icons[i] ?? Compass;
              return (
                <motion.div
                  key={step.title}
                  variants={antiGravityRise}
                  whileHover={{ y: -6, transition: gravitySpring }}
                  className="relative text-center p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-white/80 shadow-xl shadow-cyan-950/15 premium-card-lift"
                >
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-md">
                    {i + 1}
                  </span>
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-teal/10 flex items-center justify-center mb-5">
                    <Icon className="h-7 w-7 text-teal" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
