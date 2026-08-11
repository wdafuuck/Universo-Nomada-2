"use client";

import { Building2, Users, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildWhatsAppUrl } from "@/lib/translations";

export function CorporateSection() {
  const { t } = useLanguage();
  const c = t("corporate") as {
    label: string;
    title: string;
    subtitle: string;
    items: readonly { title: string; desc: string }[];
    cta: string;
    whatsappMsg: string;
  };

  const icons = [Building2, Users, Sparkles];

  return (
    <section id="empresas" className="py-16 sm:py-20 bg-gradient-to-br from-slate-900 via-[#0f2440] to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-teal-ink text-xs font-bold uppercase tracking-[0.2em]">{c.label}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white">{c.title}</h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">{c.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {c.items.map((item, i) => {
            const Icon = icons[i] ?? Building2;
            return (
              <div key={item.title} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <Icon className="h-8 w-8 text-teal mb-4" />
                <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <a
            href={buildWhatsAppUrl(c.whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center min-h-[52px] px-8 py-4 rounded-full bg-teal hover:bg-teal-dark text-[#070f1a] font-bold transition-colors"
          >
            {c.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
