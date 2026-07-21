import { DEFAULT_TOURS } from "@/lib/default-tours";
import { SEASONAL_LANDINGS } from "@/lib/seasonal-landings";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const entries: string[] = [];

  const add = (pageUrl: string, imageUrl: string, title: string) => {
    entries.push(`  <url>
    <loc>${xmlEscape(pageUrl)}</loc>
    <image:image>
      <image:loc>${xmlEscape(absoluteUrl(imageUrl))}</image:loc>
      <image:title>${xmlEscape(title)}</image:title>
    </image:image>
  </url>`);
  };

  add(SITE_URL, "/images/familia-universo-nomada-v2.jpg", "Universo Nómada — Agencia de viajes boutique");

  for (const tour of DEFAULT_TOURS) {
    add(
      absoluteUrl(`/detalle-paquete/${tour.tourId}`),
      tour.image,
      `${tour.name} — ${tour.subtitle}`,
    );
  }

  for (const landing of SEASONAL_LANDINGS) {
    if (landing.image) {
      add(absoluteUrl(`/viajes/${landing.slug}`), landing.image, landing.title);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
