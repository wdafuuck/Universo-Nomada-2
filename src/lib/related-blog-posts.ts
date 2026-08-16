import type { BlogPost } from "@/lib/blog-posts";
import { getBlogField } from "@/lib/blog-posts";
import type { DestinationHub } from "@/lib/destination-hubs";
import { fetchBlogPosts } from "@/lib/blog-store";

/** Palabras demasiado genéricas para matching de relacionados. */
const STOPWORDS = new Set([
  "como",
  "para",
  "que",
  "cuales",
  "cual",
  "todo",
  "toda",
  "todos",
  "todas",
  "viaje",
  "viajes",
  "viajero",
  "viajeros",
  "guia",
  "completa",
  "consejos",
  "universo",
  "nomada",
  "nomadas",
  "hacer",
  "tus",
  "sus",
  "una",
  "unos",
  "unas",
  "sobre",
  "entre",
  "desde",
  "hasta",
  "este",
  "esta",
  "estos",
  "estas",
  "cuando",
  "donde",
  "porque",
]);

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Quita marca/emoji del título para UI y SERP más limpios. */
export function cleanBlogTitle(title: string): string {
  return title
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/gu, "")
    .replace(/\s*[|·–—-]\s*Universo\s+N[oó]mada®?\s*$/i, "")
    .replace(/\s*\|\s*Universo\s+N[oó]mada®?\s*$/i, "")
    .trim();
}

function tokenize(s: string): string[] {
  return norm(s)
    .split(/[\s-]+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

function scorePost(post: BlogPost, terms: string[], categoryNorm?: string): number {
  const title = getBlogField(post, "es", "title");
  const category = getBlogField(post, "es", "category");
  const excerpt = getBlogField(post, "es", "excerpt");
  const blob = norm(`${post.slug} ${title} ${category} ${excerpt}`);
  let score = 0;

  if (categoryNorm && norm(category) === categoryNorm) {
    score += 12;
  }

  for (const t of terms) {
    if (!t || t.length < 3) continue;
    if (blob.includes(t)) score += t.length >= 6 ? 4 : 2;
  }
  return score;
}

/** Blogs relacionados a un hub de destino (enlaces internos). */
export async function getRelatedBlogPostsForHub(
  hub: DestinationHub,
  limit = 4,
): Promise<BlogPost[]> {
  const posts = await fetchBlogPosts();
  const terms = [
    hub.slug,
    ...hub.keywords.map(norm),
    ...tokenize(hub.title),
  ].map(norm);
  return posts
    .map((p) => ({ p, score: scorePost(p, terms) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

/**
 * Otros artículos relacionados a uno dado.
 * Prioriza misma categoría + keywords del título/slug; si no hay match, rellena con recientes.
 */
export async function getRelatedBlogPosts(
  slug: string,
  limit = 3,
): Promise<BlogPost[]> {
  const posts = await fetchBlogPosts();
  const current = posts.find((p) => p.slug === slug);
  const others = posts.filter((p) => p.slug !== slug);

  if (!current) return others.slice(0, limit);

  const category = getBlogField(current, "es", "category");
  const categoryNorm = norm(category);
  const terms = [
    ...tokenize(getBlogField(current, "es", "title")),
    ...tokenize(current.slug.replace(/-/g, " ")),
    ...tokenize(category),
  ];

  const ranked = others
    .map((p) => ({ p, score: scorePost(p, terms, categoryNorm) }))
    .sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date));

  const withScore = ranked.filter((x) => x.score > 0).map((x) => x.p);
  if (withScore.length >= limit) return withScore.slice(0, limit);

  const seen = new Set(withScore.map((p) => p.slug));
  const fillers = others.filter((p) => !seen.has(p.slug));
  return [...withScore, ...fillers].slice(0, limit);
}

/** Título meta más “clic” para SERP (~55–60 chars + marca). */
export function blogSerpTitle(titleEs: string): string {
  const brand = " | Universo Nómada";
  const max = 58;
  let core = cleanBlogTitle(titleEs);
  if (core.length > max) {
    core = `${core.slice(0, max - 1).trimEnd()}…`;
  }
  return `${core}${brand}`;
}

/**
 * Description SERP con gancho de clic.
 * Las queries informativas (qué es / diferencia / significado) suelen tener CTR bajo;
 * el CTA invita a la guía completa.
 */
export function blogSerpDescription(excerptEs: string): string {
  const base = excerptEs.trim().replace(/\s+/g, " ");
  const cta = " Guía completa de Universo Nómada.";
  if (base.length >= 145) return `${base.slice(0, 152).trimEnd()}…`;
  if (base.length + cta.length <= 160) return base + cta;
  return base;
}
