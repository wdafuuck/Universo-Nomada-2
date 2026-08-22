"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WAVE_COLORS } from "@/components/WildlifeBackground";
import { FlowField } from "@/components/motion/FlowField";
import { staggerContainer, antiGravityRise } from "@/lib/motion-presets";
import { ScrollParallax } from "@/components/motion/ScrollParallax";
import { UploadAwareImage } from "@/components/UploadAwareImage";

type PartnerLogo = {
  id: number;
  name: string;
  imageUrl: string;
  linkUrl: string;
};

function partnerLogoLayout(count: number) {
  if (count <= 2) {
    return { minCol: 180, logoH: 80, gap: "2.75rem", maxW: "max-w-2xl" };
  }
  if (count <= 4) {
    return { minCol: 150, logoH: 68, gap: "2rem", maxW: "max-w-4xl" };
  }
  if (count <= 6) {
    return { minCol: 120, logoH: 56, gap: "1.5rem", maxW: "max-w-5xl" };
  }
  return { minCol: 96, logoH: 48, gap: "1rem", maxW: "max-w-6xl" };
}

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
  const layout = useMemo(() => partnerLogoLayout(logos.length), [logos.length]);

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
            <div
              className={`grid items-center justify-items-center w-full mx-auto ${layout.maxW}`}
              style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(${layout.minCol}px, 1fr))`,
                gap: layout.gap,
              }}
            >
              {logos.map((logo) => {
                const img = (
                  <div
                    className="relative w-full rounded-lg px-3 py-2 opacity-90 hover:opacity-100 transition-opacity duration-300"
                    style={{ height: layout.logoH }}
                  >
                    <UploadAwareImage
                      src={logo.imageUrl}
                      alt={logo.name || "Aliado"}
                      fill
                      className="object-contain"
                      sizes={`(max-width: 640px) 45vw, ${layout.minCol}px`}
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
                      className="w-full max-w-[220px]"
                    >
                      {img}
                    </a>
                  );
                }
                return (
                  <div key={logo.id} className="w-full max-w-[220px]">
                    {img}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
