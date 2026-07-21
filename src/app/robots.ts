import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/mi-cuenta", "/_next/", "/uploads/", "/offline"],
      },
      {
        userAgent: "GPTBot",
        disallow: ["/api/", "/mi-cuenta", "/uploads/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap-index.xml`,
    host: SITE_URL,
  };
}
