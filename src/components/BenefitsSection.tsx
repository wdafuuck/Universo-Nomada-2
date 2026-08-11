"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WAVE_COLORS } from "@/components/WildlifeBackground";
import { FlowField } from "@/components/motion/FlowField";
import { staggerContainer, antiGravityRise } from "@/lib/motion-presets";
import { ScrollParallax } from "@/components/motion/ScrollParallax";

type PartnerLogo = {
  id: number;
  name: string;
  imageUrl: string;
  linkUrl: string;
};

export function BenefitsSection() {
  const { t } = useLanguage();
  const copy = t("benefitsSection") as {
    label: string;
    title: string;
    subtitle: string;
    cta: string;
    partnersLabel: string;
  };
  const [logos, setLogos] = useState<PartnerLogo[]>([]);
  const ref = useRef(null);

  useEffect(() => {
    fetch("/api/benefit-partner-logos")
      .then((r) => r.json())
      .then((data) => setLogos(data.logos ?? []))
      .catch(() => setLogos([]));
  }, []);

  return (
    <section
      id="beneficios"
      className="relative py-20 sm:py-28 overflow-hidden -mt-px"
      style={{ backgroundColor: WAVE_COLORS.benefits }}
    >
      <FlowField variant="cool" className="opacity-50" intensity="medium" />
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px", amount: 0.2 }}
        className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8"
      >
        <ScrollParallax strength={28}>
          <motion.div variants={antiGravityRise} className="text-center max-w-3xl mx-auto">
          <p className="text-teal-ink text-xs font-semibold uppercase tracking-[0.25em] mb-4 flex items-center justify-center gap-2">
            <Gift className="h-4 w-4" />
            {copy.label}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-slate-900 leading-tight tracking-tight">
            {copy.title}
          </h2>
          <p className="mt-5 text-slate-600 text-base sm:text-lg leading-relaxed">
            {copy.subtitle}
          </p>
          <Link
            href="/mi-cuenta"
            className="inline-flex items-center justify-center gap-2 mt-8 min-h-[52px] px-8 py-4 rounded-full bg-teal hover:bg-teal-dark text-navy font-bold transition-colors"
          >
            {copy.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          </motion.div>
        </ScrollParallax>

        {logos.length > 0 && (
          <motion.div variants={antiGravityRise} className="mt-14 sm:mt-16">
            <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-8">
              {copy.partnersLabel}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {logos.map((logo) => {
                const img = (
                  <div className="relative h-14 w-28 sm:h-16 sm:w-32 rounded-lg px-2 py-1 opacity-90 hover:opacity-100 transition-opacity duration-300">
                    <Image
                      src={logo.imageUrl}
                      alt={logo.name || "Aliado"}
                      fill
                      className="object-contain"
                      sizes="128px"
                    />
                  </div>
                );
                if (logo.linkUrl) {
                  return (
                    <a
                      key={logo.id}
                      href={logo.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      {img}
                    </a>
                  );
                }
                return <div key={logo.id} className="shrink-0">{img}</div>;
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
