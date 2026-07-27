import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-session";
import { fetchBlogArticlesAdmin } from "@/lib/blog-store";
import { notifyIndexNow, pingSitemapEngines } from "@/lib/indexnow";
import { absoluteUrl } from "@/lib/site-url";

/** Indexa todos los artículos publicados (IndexNow + ping sitemap). */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const articles = await fetchBlogArticlesAdmin();
    const published = articles.filter((a) => a.active);
    const urls = [
      absoluteUrl("/blog"),
      absoluteUrl("/sitemap.xml"),
      ...published.map((a) => absoluteUrl(`/blog/${a.slug}`)),
    ];

    const indexNow = await notifyIndexNow(urls);
    const sitemapPing = await pingSitemapEngines();

    return NextResponse.json({
      articles: published.length,
      urls: urls.length,
      indexNow,
      sitemapPing,
      tip:
        "Google indexa sobre todo vía Search Console → Sitemaps. IndexNow acelera Bing/Yandex.",
    });
  } catch (e) {
    console.error("[admin/blog/index-all]", e);
    return NextResponse.json({ error: "No se pudo indexar" }, { status: 500 });
  }
}
