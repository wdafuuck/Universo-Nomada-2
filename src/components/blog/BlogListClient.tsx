"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Instagram } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBlogField, type BlogPost } from "@/lib/blog-posts";
import { BlogNewsletter } from "@/components/BlogNewsletter";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram";

type Props = { posts: BlogPost[] };

export function BlogListClient({ posts }: Props) {
  const { language, t } = useLanguage();
  const b = t("blog");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-5 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-teal-300 text-sm font-medium mb-8">
            <ArrowLeft className="h-4 w-4" /> Universo Nómada
          </Link>
          <p className="text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] mb-3">{b.label}</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{b.title}</h1>
          <p className="mt-4 text-white/75 text-lg leading-relaxed">{b.subtitle}</p>
          <p className="mt-3 text-white/55 text-sm leading-relaxed max-w-2xl">{b.manifesto}</p>
          <div className="flex flex-wrap gap-2 mt-6">
            {b.pillars.map((pillar: string) => (
              <span key={pillar} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-emerald-100">
                {pillar}
              </span>
            ))}
          </div>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-pink-300 hover:text-pink-200 transition-colors"
          >
            <Instagram className="h-4 w-4" /> @universo.nomadaa — {b.instagramCta}
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-10">
        <BlogNewsletter variant="light" />

        <div className="space-y-6 mt-10">
          {posts.length === 0 && (
            <p className="text-slate-400 text-center py-8">Pronto publicaremos nuevas historias.</p>
          )}
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article className="flex flex-col sm:flex-row gap-5 bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-md transition-all p-4 sm:p-0">
                <div className="relative w-full sm:w-48 h-36 sm:h-auto shrink-0 rounded-xl sm:rounded-none overflow-hidden">
                  <Image
                    src={post.image}
                    alt={getBlogField(post, language, "title")}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="200px"
                  />
                </div>
                <div className="flex-1 py-2 sm:py-5 sm:pr-5">
                  <span className="text-teal text-xs font-semibold">{getBlogField(post, language, "category")}</span>
                  <h2 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-teal transition-colors">
                    {getBlogField(post, language, "title")}
                  </h2>
                  <p className="mt-2 text-slate-500 text-sm line-clamp-2">{getBlogField(post, language, "excerpt")}</p>
                  <div className="mt-3 flex items-center gap-2 text-slate-400 text-xs">
                    <Clock className="h-3 w-3" /> {post.readTime} min · {post.date}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
