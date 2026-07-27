"use client";

import Link from "next/link";
import { ArrowLeft, Clock, Instagram } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBlogField, type BlogPost } from "@/lib/blog-posts";
import { getBlogCta } from "@/lib/blog-cta";
import { BlogNewsletter } from "@/components/BlogNewsletter";
import { UploadAwareImage } from "@/components/UploadAwareImage";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram";

type Props = { post: BlogPost };

export function BlogPostClient({ post }: Props) {
  const { language, t } = useLanguage();
  const b = t("blog");
  const cta = getBlogCta(post.slug);

  const title = getBlogField(post, language, "title");
  const content = getBlogField(post, language, "content");
  const category = getBlogField(post, language, "category");

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-slate-50">
        <div className="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between gap-4">
          <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> {b.back}
          </Link>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-600 hover:text-pink-700"
          >
            <Instagram className="h-3.5 w-3.5" /> @universo.nomadaa
          </a>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 py-10">
        <span className="text-teal text-xs font-semibold uppercase tracking-wider">{category}</span>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">{title}</h1>
        <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm">
          <Clock className="h-4 w-4" /> {post.readTime} min · {post.date}
        </div>

        <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden my-8">
          <UploadAwareImage src={post.image} alt={title} fill className="object-cover" priority sizes="800px" />
        </div>

        <div className="prose prose-slate max-w-none">
          {content.split("\n\n").map((para, i) => (
            <p key={i} className="text-slate-600 leading-relaxed mb-4 text-base">{para}</p>
          ))}
        </div>

        {cta && (
          <aside className="mt-10 p-6 rounded-2xl border border-teal/20 bg-gradient-to-br from-teal/5 to-emerald-50">
            <p className="text-slate-700 text-sm leading-relaxed mb-4">{cta.blurb}</p>
            <Link
              href={cta.href}
              className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-teal hover:bg-teal/90 text-[#070f1a] font-bold text-sm transition-colors"
            >
              {cta.label}
            </Link>
          </aside>
        )}

        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
          <p className="text-slate-700 text-sm leading-relaxed mb-4">{b.instagramDesc}</p>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-pink-600 hover:text-pink-700 text-sm"
          >
            <Instagram className="h-4 w-4" /> @universo.nomadaa — {b.instagramCta}
          </a>
        </div>

        <div className="mt-8">
          <BlogNewsletter variant="light" />
        </div>
      </article>
    </div>
  );
}
