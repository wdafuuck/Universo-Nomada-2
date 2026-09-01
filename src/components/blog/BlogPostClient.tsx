"use client";

import Link from "next/link";
import { ArrowLeft, Clock, Instagram, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBlogField, type BlogPost } from "@/lib/blog-posts";
import { getBlogCta } from "@/lib/blog-cta";
import { BlogNewsletter } from "@/components/BlogNewsletter";
import { BlogSocialFollow } from "@/components/blog/BlogSocialFollow";
import { BlogCommentForm } from "@/components/blog/BlogCommentForm";
import { UploadAwareImage } from "@/components/UploadAwareImage";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram";
import { buildWhatsAppUrl } from "@/lib/translations";

type RelatedSummary = {
  slug: string;
  title: string;
  image: string;
  readTime: number;
  category?: string;
};

type Props = { post: BlogPost; relatedPosts?: RelatedSummary[] };

export function BlogPostClient({ post, relatedPosts = [] }: Props) {
  const { language, t } = useLanguage();
  const b = t("blog");
  const title = getBlogField(post, language, "title");
  const titleEs = getBlogField(post, "es", "title");
  const content = getBlogField(post, language, "content");
  const category = getBlogField(post, language, "category");
  const cta = getBlogCta(post.slug, titleEs);
  const waUrl = buildWhatsAppUrl(
    `Hola! Leí el artículo "${titleEs}" y me gustaría cotizar un viaje.`,
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-slate-50">
        <div className="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between gap-4">
          <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal text-sm font-medium">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {b.back}
          </Link>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-700 hover:text-pink-800"
            aria-label="Instagram Universo Nómada"
          >
            <Instagram className="h-3.5 w-3.5" aria-hidden /> @universo.nomadaa
          </a>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 py-10">
        <span className="text-teal-dark text-xs font-semibold uppercase tracking-wider">{category}</span>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">{title}</h1>
        <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm">
          <Clock className="h-4 w-4" aria-hidden /> {post.readTime} min · {post.date}
        </div>

        <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden my-8">
          <UploadAwareImage src={post.image} alt={title} fill className="object-cover" priority sizes="800px" />
        </div>

        <div className="prose prose-slate max-w-none">
          {content.split("\n\n").map((para, i) => (
            <p key={i} className="text-slate-600 leading-relaxed mb-4 text-base">{para}</p>
          ))}
        </div>

        <BlogSocialFollow
          title={b.socialTitle}
          description={b.socialDesc}
          categoryLabel={category}
        />

        <aside className="mt-10 p-6 rounded-2xl border border-teal/20 bg-gradient-to-br from-teal/5 to-emerald-50">
          <p className="text-slate-800 text-lg font-bold mb-2">{b.readyTitle}</p>
          <p className="text-slate-700 text-sm leading-relaxed mb-4">{cta.blurb}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={cta.href}
              className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-teal hover:bg-teal/90 text-[#070f1a] font-bold text-sm transition-colors"
            >
              {cta.label}
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl border-2 border-slate-200 text-slate-800 font-bold text-sm hover:bg-white"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Cotizar por WhatsApp
            </a>
          </div>
        </aside>

        <BlogCommentForm
          postSlug={post.slug}
          postTitle={titleEs}
          copy={{
            title: b.commentTitle,
            note: b.commentNote,
            comment: b.commentLabel,
            name: b.commentName,
            email: b.commentEmail,
            submit: b.commentSubmit,
            sending: b.commentSending,
            ok: b.commentSuccess,
            err: b.commentError,
            errFields: b.commentFieldsError,
          }}
        />

        {relatedPosts.length > 0 && (
          <section aria-labelledby="related-posts" className="mt-12 pt-10 border-t border-slate-100">
            <h2 id="related-posts" className="text-xl font-bold text-slate-900 mb-2">
              {b.keepReading}
            </h2>
            <p className="text-sm text-slate-500 mb-5">{b.keepReadingDesc}</p>
            <ul className="grid gap-4 sm:grid-cols-3 list-none p-0 m-0">
              {relatedPosts.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="group flex flex-col h-full rounded-xl border border-slate-200 overflow-hidden hover:border-teal/40 hover:shadow-md transition-all"
                  >
                    <div className="relative h-32 w-full shrink-0">
                      <UploadAwareImage src={r.image} alt={r.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="240px" />
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      {r.category ? (
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-ink mb-1 line-clamp-1">
                          {r.category}
                        </p>
                      ) : null}
                      <p className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-teal line-clamp-3">
                        {r.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-auto pt-2">{r.readTime} min de lectura →</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8">
          <BlogNewsletter variant="light" />
        </div>
      </article>
    </div>
  );
}
