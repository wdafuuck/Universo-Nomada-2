import type { MetadataRoute } from "next";
import { fetchBlogPosts } from "@/lib/blog-store";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { SEASONAL_LANDINGS } from "@/lib/seasonal-landings";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await fetchBlogPosts();
  const now = new Date();

  const blogEntries = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const tourEntries = DEFAULT_TOURS.map((tour) => ({
    url: `${SITE_URL}/detalle-paquete/${tour.tourId}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const seasonalEntries = SEASONAL_LANDINGS.map((l) => ({
    url: `${SITE_URL}/viajes/${l.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.88,
  }));

  const legalEntries = [
    "/politicas-cancelacion",
    "/terminos-vuelos",
    "/politica-seguridad",
    "/politica-privacidad",
    "/terminos-condiciones",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.35,
  }));

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    ...seasonalEntries,
    ...tourEntries,
    ...blogEntries,
    ...legalEntries,
  ];
}
