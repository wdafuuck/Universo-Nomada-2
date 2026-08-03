"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBlogField } from "@/lib/blog-posts";
import { useBlogPosts } from "@/hooks/use-blog-posts";
import { BlogNewsletter } from "@/components/BlogNewsletter";
import { FlowField } from "@/components/motion/FlowField";
import { gravityDrop, gravitySpring, staggerContainer } from "@/lib/motion-presets";

export function BlogSection() {
  const { language, t } = useLanguage();
  const b = t("blog");
  const { posts } = useBlogPosts();
  const featured = posts.slice(0, 2);

  return (
    <section id="blog" className="relative py-16 sm:py-20 overflow-hidden bg-emerald-950">
      <Image
        src="/images/experiencia_andes.webp"
        alt=""
        fill
        className="object-cover object-center opacity-25"
        sizes="100vw"
        quality={80}
      />
      <FlowField variant="cool" className="opacity-20" intensity="subtle" />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/90 via-teal-950/75 to-emerald-950/95 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <motion.div variants={gravityDrop}>
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-[0.2em]">🦙 {b.label}</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">{b.title}</h2>
            <p className="mt-2 text-white/70 max-w-xl">{b.subtitle}</p>
            <p className="mt-3 text-white/55 text-sm max-w-xl leading-relaxed">{b.manifesto}</p>
          </motion.div>
          <motion.div variants={gravityDrop}>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-teal-300 font-semibold text-sm hover:gap-3 transition-all"
            >
              {b.viewAll} <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-8">
          {b.pillars.map((pillar: string, i: number) => (
            <motion.span
              key={pillar}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-emerald-200 border border-white/15"
            >
              {pillar}
            </motion.span>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-1">
            <BlogNewsletter variant="dark" compact />
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {featured.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, ...gravitySpring }}
                whileHover={{ y: -6, transition: gravitySpring }}
              >
                <Link href={`/blog/${post.slug}`} className="group block h-full">
                  <article className="h-full bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/15 hover:bg-white/15 hover:border-teal/30 hover:shadow-2xl transition-colors duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={post.image}
                        alt={getBlogField(post, language, "title")}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {getBlogField(post, language, "category")}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                        <Clock className="h-3 w-3" />
                        {post.readTime} min
                      </div>
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-teal-300 transition-colors">
                        {getBlogField(post, language, "title")}
                      </h3>
                      <p className="mt-2 text-white/65 text-sm line-clamp-3 leading-relaxed">
                        {getBlogField(post, language, "excerpt")}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-teal-300 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        {b.readMore} <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
