import type { BlogPost } from "@/lib/blog-posts";
import { getBlogField } from "@/lib/blog-posts";
import type { DestinationHub } from "@/lib/destination-hubs";
import { fetchBlogPosts } from "@/lib/blog-store";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function scorePost(post: BlogPost, terms: string[]): number {
  const blob = norm(`${post.slug} ${getBlogField(post, "es", "title")} ${getBlogField(post, "es", "category")}`);
  let score = 0;
  for (const t of terms) {
    if (!t || t.length < 3) continue;
    if (blob.includes(t)) score += t.length >= 6 ? 3 : 2;
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
    ...norm(hub.title).split(/\s+/),
  ].map(norm);
  return posts
    .map((p) => ({ p, score: scorePost(p, terms) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

/** Otros artículos relacionados a uno dado. */
export async function getRelatedBlogPosts(
  slug: string,
  limit = 3,
): Promise<BlogPost[]> {
  const posts = await fetchBlogPosts();
  const current = posts.find((p) => p.slug === slug);
  if (!current) return posts.filter((p) => p.slug !== slug).slice(0, limit);
  const terms = norm(getBlogField(current, "es", "title"))
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 8);
  terms.push(...norm(current.slug).split("-").filter((w) => w.length > 3));
  return posts
    .filter((p) => p.slug !== slug)
    .map((p) => ({ p, score: scorePost(p, terms) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

/** Título meta más “clic” para SERP (~55–60 chars + marca). */
export function blogSerpTitle(titleEs: string): string {
  const brand = " | Universo Nómada";
  const max = 58;
  let core = titleEs.trim();
  if (core.length > max) {
    core = `${core.slice(0, max - 1).trimEnd()}…`;
  }
  return `${core}${brand}`;
}

/** Description SERP con CTA suave. */
export function blogSerpDescription(excerptEs: string): string {
  const base = excerptEs.trim().replace(/\s+/g, " ");
  const cta = " Cotiza con Universo Nómada.";
  if (base.length >= 140) return base.slice(0, 155);
  if (base.length + cta.length <= 160) return base + cta;
  return base;
}
