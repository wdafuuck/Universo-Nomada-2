import type { MetadataRoute } from "next";
import { fetchBlogPosts } from "@/lib/blog-store";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { DESTINATION_HUBS } from "@/lib/destination-hubs";
import { SEASONAL_LANDINGS } from "@/lib/seasonal-landings";
import { SITE_URL } from "@/lib/site-url";

/** Siempre leer blogs desde DB (no congelar el sitemap en el build). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const hubEntries = DESTINATION_HUBS.map((hub) => ({
    url: `${SITE_URL}/viajes/${hub.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: hub.slug === "chile" ? 0.95 : 0.9,
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
    "/accesibilidad",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.35,
  }));

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/viajes`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    ...hubEntries,
    ...seasonalEntries,
    ...tourEntries,
    ...blogEntries,
    ...legalEntries,
  ];
}
