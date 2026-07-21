"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { FlowField } from "@/components/motion/FlowField";
import { gravityDrop, staggerContainer } from "@/lib/motion-presets";
import type { PolicyBlock, PolicyDocument } from "@/lib/legal-policies";

function PolicyBlockContent({ block }: { block: PolicyBlock }) {
  return (
    <div className="space-y-3">
      {block.paragraphs?.map((p) => (
        <p key={p} className="text-slate-600 text-sm sm:text-base leading-relaxed">
          {p}
        </p>
      ))}
      {block.bullets && block.bullets.length > 0 && (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm sm:text-base leading-relaxed">
          {block.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {block.subsections?.map((sub) => (
        <div key={sub.title} className="ml-1 sm:ml-2 space-y-2">
          <p className="text-slate-800 text-sm sm:text-base font-semibold">{sub.title}</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm sm:text-base leading-relaxed">
            {sub.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
      {block.note && (
        <p className="text-slate-500 text-sm italic border-l-2 border-teal/40 pl-4">{block.note}</p>
      )}
    </div>
  );
}

export function LegalPolicyPage({ doc }: { doc: PolicyDocument }) {
  const { language, t } = useLanguage();
  const p = t("policies") as {
    backHome: string;
    spanishNote?: string;
    updated: string;
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <FlowField variant="cool" className="opacity-40 fixed inset-0" />
      <header className="relative bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white overflow-hidden">
        <FlowField variant="aurora" intensity="medium" />
        <motion.div
          className="relative z-10 max-w-3xl mx-auto px-5 py-8 sm:py-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={gravityDrop}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-teal-300 text-sm font-medium mb-8"
            >
              <ArrowLeft className="h-4 w-4" /> {p.backHome}
            </Link>
          </motion.div>
          <motion.p variants={gravityDrop} className="text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Universo Nómada®
          </motion.p>
          <motion.h1 variants={gravityDrop} className="text-2xl sm:text-3xl font-bold leading-tight">
            {doc.title}
          </motion.h1>
          {language !== "es" && p.spanishNote && (
            <motion.p variants={gravityDrop} className="mt-4 text-white/60 text-sm italic">
              {p.spanishNote}
            </motion.p>
          )}
        </motion.div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-5 py-10 sm:py-12">
        <motion.article
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 premium-card-lift"
        >
          {doc.intro && (
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{doc.intro}</p>
          )}
          {doc.blocks.map((block, i) => (
            <motion.section
              key={block.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 120, damping: 20 }}
            >
              <h2 className="text-slate-900 font-bold text-base sm:text-lg mb-3">{block.title}</h2>
              <PolicyBlockContent block={block} />
            </motion.section>
          ))}
          {doc.contact && (
            <section className="rounded-xl bg-emerald-50 border border-emerald-100 p-5">
              <h2 className="text-emerald-950 font-bold text-base sm:text-lg mb-2">{doc.contact.title}</h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3">{doc.contact.body}</p>
              <a
                href={`mailto:${doc.contact.email}`}
                className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-900 font-semibold text-sm transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {doc.contact.email}
              </a>
            </section>
          )}
        </motion.article>
        <p className="mt-8 text-center text-xs text-slate-400">{p.updated}</p>
      </main>
    </div>
  );
}
