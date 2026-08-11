"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HelpCircle, MessageCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteContentOverride } from "@/hooks/use-site-content";
import { GravityReveal } from "@/components/motion/GravityReveal";
import { FlowField } from "@/components/motion/FlowField";
import { antiGravityRise, staggerContainer } from "@/lib/motion-presets";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FaqCopy = {
  label: string;
  title: string;
  subtitle?: string;
  cta?: string;
  items: readonly { q: string; a: string }[];
};

export function FaqSection() {
  const { t } = useLanguage();
  const fallback = t("faq") as FaqCopy;
  const f = useSiteContentOverride("faq", fallback) as FaqCopy;

  return (
    <section id="faq" className="relative py-16 sm:py-20 lg:py-24 bg-slate-50 overflow-hidden -mt-px">
      <FlowField variant="warm" className="opacity-45" intensity="medium" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] gap-10 lg:gap-14 xl:gap-16 items-start">
          <GravityReveal once mode="up" className="lg:sticky lg:top-24">
            <div className="text-left max-w-md lg:max-w-none mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 border border-teal/15 px-3 py-1.5 mb-5">
                <HelpCircle className="h-3.5 w-3.5 text-teal" />
                <span className="text-teal-ink text-xs font-bold uppercase tracking-[0.2em]">{f.label}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-black text-slate-900 tracking-tight leading-tight">
                {f.title}
              </h2>
              {f.subtitle && (
                <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">{f.subtitle}</p>
              )}

              <div className="hidden lg:flex flex-col gap-4 mt-8">
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="h-5 w-5 text-teal" />
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {f.cta ?? "¿Tienes otra duda? Nuestro equipo te responde en menos de 24 horas."}
                    </p>
                  </div>
                </div>
                <Link
                  href="#contacto"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-teal-ink hover:underline transition-colors group"
                >
                  {t("contacto").title}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </GravityReveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="w-full"
          >
            <Accordion type="single" collapsible className="space-y-3">
              {f.items.map((item, i) => (
                <motion.div key={i} variants={antiGravityRise}>
                  <AccordionItem
                    value={`faq-${i}`}
                    className="bg-white rounded-2xl border border-slate-200 px-5 sm:px-6 shadow-sm premium-card-lift"
                  >
                    <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline py-5 text-[15px] sm:text-base">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 leading-relaxed pb-5 text-sm sm:text-[15px]">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>

            <div className="lg:hidden mt-8 text-center">
              <Link
                href="#contacto"
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-ink hover:underline transition-colors"
              >
                {t("contacto").title} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
