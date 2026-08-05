"use client";

import { useDeferredValue, useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Instagram, Search, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBlogField, type BlogPost } from "@/lib/blog-posts";
import { BlogNewsletter } from "@/components/BlogNewsletter";
import { UploadAwareImage } from "@/components/UploadAwareImage";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram";

const PAGE_SIZE = 9;

type Props = { posts: BlogPost[] };

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function BlogListClient({ posts }: Props) {
  const { language, t } = useLanguage();
  const b = t("blog");
  const searchPlaceholder =
    (b as { searchPlaceholder?: string }).searchPlaceholder ?? "Buscar por título, destino o tema…";
  const searchClear = (b as { searchClear?: string }).searchClear ?? "Limpiar filtros";
  const allCategories = (b as { allCategories?: string }).allCategories ?? "Todas";
  const resultsTemplate = (b as { resultsCount?: string }).resultsCount ?? "{count} artículos";
  const noResults =
    (b as { noResults?: string }).noResults ?? "No encontramos artículos para esa búsqueda.";
  const prevPage = (b as { prevPage?: string }).prevPage ?? "Anterior";
  const nextPage = (b as { nextPage?: string }).nextPage ?? "Siguiente";
  const pageOf = (b as { pageOf?: string }).pageOf ?? "Página {page} de {total}";

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("cat") ?? "");
  const [page, setPage] = useState(() => {
    const n = Number(searchParams.get("page") ?? "1");
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  });

  const deferredQuery = useDeferredValue(query);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of posts) {
      const cat = getBlogField(post, language, "category").trim() || "General";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
      .map(([name, count]) => ({ name, count }));
  }, [posts, language]);

  const filtered = useMemo(() => {
    const q = norm(deferredQuery);
    return posts.filter((post) => {
      const cat = getBlogField(post, language, "category").trim() || "General";
      if (category && cat !== category) return false;
      if (!q) return true;
      const blob = norm(
        [
          getBlogField(post, language, "title"),
          getBlogField(post, language, "excerpt"),
          cat,
          post.slug,
        ].join(" "),
      );
      return blob.includes(q);
    });
  }, [posts, language, category, deferredQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("cat", category);
    if (safePage > 1) params.set("page", String(safePage));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [query, category, safePage, pathname, router]);

  const selectCategory = (name: string) => {
    startTransition(() => {
      setCategory((prev) => (prev === name ? "" : name));
      setPage(1);
    });
  };

  const onSearch = (value: string) => {
    setQuery(value);
    startTransition(() => setPage(1));
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setPage(1);
  };

  const resultsLabel = resultsTemplate.replace("{count}", String(filtered.length));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-5 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-teal-300 text-sm font-medium mb-8"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Universo Nómada
          </Link>
          <p className="text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] mb-3">{b.label}</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{b.title}</h1>
          <p className="mt-4 text-white/75 text-lg leading-relaxed">{b.subtitle}</p>
          <p className="mt-3 text-white/55 text-sm leading-relaxed max-w-2xl">{b.manifesto}</p>
          <div className="flex flex-wrap gap-2 mt-6">
            {b.pillars.map((pillar: string) => (
              <span
                key={pillar}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-emerald-100"
              >
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
            <Instagram className="h-4 w-4" aria-hidden /> @universo.nomadaa — {b.instagramCta}
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-10">
        <BlogNewsletter variant="light" />

        <div className="mt-10 space-y-5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full h-12 rounded-full border border-slate-200 bg-white pl-12 pr-12 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            />
            {query.trim() ? (
              <button
                type="button"
                onClick={() => onSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label={searchClear}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Categorías">
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              className={`min-h-[40px] px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                !category
                  ? "bg-teal text-[#070f1a] shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-teal"
              }`}
            >
              {allCategories} ({posts.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => selectCategory(c.name)}
                className={`min-h-[40px] px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  category === c.name
                    ? "bg-teal text-[#070f1a] shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-teal"
                }`}
              >
                {c.name} ({c.count})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <p>{resultsLabel}</p>
            {(query.trim() || category) && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-semibold text-teal hover:underline"
              >
                {searchClear}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6 mt-6">
          {pageItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <Search className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
              <p className="text-slate-600 font-medium">
                {noResults}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold text-teal hover:underline"
              >
                {searchClear}
              </button>
            </div>
          )}

          {pageItems.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article className="flex flex-col sm:flex-row gap-5 bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-md transition-all p-4 sm:p-0">
                <div className="relative w-full sm:w-48 h-36 sm:h-auto shrink-0 rounded-xl sm:rounded-none overflow-hidden">
                  <UploadAwareImage
                    src={post.image}
                    alt={getBlogField(post, language, "title")}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="200px"
                  />
                </div>
                <div className="flex-1 py-2 sm:py-5 sm:pr-5">
                  <span className="text-teal text-xs font-semibold">
                    {getBlogField(post, language, "category")}
                  </span>
                  <h2 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-teal transition-colors">
                    {getBlogField(post, language, "title")}
                  </h2>
                  <p className="mt-2 text-slate-500 text-sm line-clamp-2">
                    {getBlogField(post, language, "excerpt")}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-slate-400 text-xs">
                    <Clock className="h-3 w-3" aria-hidden /> {post.readTime} min · {post.date}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <nav
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            aria-label="Paginación"
          >
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1 min-h-[44px] px-4 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-teal"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {prevPage}
            </button>
            <span className="text-sm text-slate-500 font-medium tabular-nums">
              {pageOf
                .replace("{page}", String(safePage))
                .replace("{total}", String(totalPages))}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1 min-h-[44px] px-4 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-teal"
            >
              {nextPage}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}
