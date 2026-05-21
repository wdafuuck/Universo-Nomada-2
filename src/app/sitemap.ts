import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://universonomada.cl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const destinations = await db.destination.findMany({
    where: { active: true },
    select: { id: true, updatedAt: true },
  });

  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...destinations.map((d) => ({
      url: `${SITE_URL}/detalle-paquete/${d.id}`,
      lastModified: d.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
