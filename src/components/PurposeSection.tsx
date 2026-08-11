"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles, Users, Gem, Mountain } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const icons = [Sparkles, Users, Gem, Mountain];

export function PurposeSection() {
  const { t } = useLanguage();
  const p = t("purpose");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="experiencias" className="py-20 sm:py-28 bg-[#0a1018] relative">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <span className="text-teal-ink text-xs font-semibold tracking-[0.25em] uppercase">{p.label}</span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight">{p.title}</h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {p.items.map((item: { title: string; desc: string }, i: number) => {
            const Icon = icons[i] ?? Sparkles;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-teal/20 transition-all duration-500"
              >
                <div className="h-12 w-12 rounded-xl bg-teal/10 flex items-center justify-center mb-6 group-hover:bg-teal/20 transition-colors">
                  <Icon className="h-6 w-6 text-teal" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
