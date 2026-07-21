"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function ExperientialSection() {
  const { t } = useLanguage();
  const e = t("experiential");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-20 sm:py-28 bg-[#0D1B2A] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-teal/5 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
          <div>
            <span className="text-amber/90 text-xs font-semibold tracking-[0.25em] uppercase">{e.label}</span>
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-light text-white">{e.title}</h2>
          </div>
          <WhatsAppButton
            message={t("whatsappMessages").hero}
            label={t("hero").ctaWhatsapp}
            variant="outline"
            className="self-start lg:self-auto shrink-0"
          />
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {e.items.map((item: { title: string; desc: string }, i: number) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="p-6 sm:p-7 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <h3 className="text-white font-medium text-base mb-2">{item.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
