import { SITE_URL } from "@/lib/site-url";

export type IndexNowResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  submitted: number;
  batches: number;
  statusCodes: number[];
  endpoints?: Record<string, number>;
};

const INDEXNOW_ENDPOINTS = [
  { id: "indexnow", url: "https://api.indexnow.org/indexnow" },
  { id: "bing", url: "https://www.bing.com/indexnow" },
  { id: "yandex", url: "https://yandex.com/indexnow" },
] as const;

/**
 * Notifica a buscadores compatibles con IndexNow (Bing, Yandex, etc.).
 * Google descubre URLs nuevas vía sitemap en Search Console (ya enviado).
 */
export async function notifyIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY?.trim();
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];

  if (!key) {
    return {
      ok: false,
      skipped: true,
      reason: "INDEXNOW_KEY no configurada",
      submitted: 0,
      batches: 0,
      statusCodes: [],
    };
  }
  if (unique.length === 0) {
    return {
      ok: false,
      skipped: true,
      reason: "Sin URLs",
      submitted: 0,
      batches: 0,
      statusCodes: [],
    };
  }

  const host = new URL(SITE_URL).host;
  const statusCodes: number[] = [];
  const endpoints: Record<string, number> = {};
  const chunkSize = 100;
  let batches = 0;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const urlList = unique.slice(i, i + chunkSize);
    batches += 1;
    const body = JSON.stringify({
      host,
      key,
      keyLocation: `${SITE_URL}/${key}.txt`,
      urlList,
    });

    await Promise.all(
      INDEXNOW_ENDPOINTS.map(async ({ id, url }) => {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body,
          });
          statusCodes.push(res.status);
          // Conservar el mejor status por endpoint
          const prev = endpoints[id] ?? 0;
          if (res.status === 200 || res.status === 202 || prev === 0) {
            endpoints[id] = res.status;
          }
        } catch (e) {
          console.warn(`[indexnow] ${id} failed:`, e);
          statusCodes.push(0);
          if (endpoints[id] === undefined) endpoints[id] = 0;
        }
      }),
    );
  }

  const ok = Object.values(endpoints).some((c) => c === 200 || c === 202);
  return { ok, submitted: unique.length, batches, statusCodes, endpoints };
}

/** Avisa a Google/Bing que el sitemap cambió (best-effort; Google ya tiene el sitemap en GSC). */
export async function pingSitemapEngines(): Promise<{ google: number; bing: number }> {
  const sitemap = `${SITE_URL}/sitemap.xml`;
  const out = { google: 0, bing: 0 };
  try {
    const g = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`, {
      method: "GET",
      redirect: "manual",
    });
    out.google = g.status;
  } catch {
    out.google = 0;
  }
  try {
    const b = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`, {
      method: "GET",
      redirect: "manual",
    });
    out.bing = b.status;
  } catch {
    out.bing = 0;
  }
  return out;
}

/**
 * Tras crear/editar/eliminar un blog publicado:
 * IndexNow (Bing/Yandex) + ping sitemap (Google/Bing).
 * Fire-and-forget desde las rutas admin.
 */
export async function notifyBlogSearchEngines(opts: {
  slug?: string | null;
  /** Si true, también avisa /blog y /sitemap.xml */
  includeHub?: boolean;
}): Promise<void> {
  const urls: string[] = [];
  if (opts.slug) urls.push(`${SITE_URL}/blog/${opts.slug}`);
  if (opts.includeHub !== false) {
    urls.push(`${SITE_URL}/blog`, `${SITE_URL}/sitemap.xml`);
  }
  try {
    await Promise.all([notifyIndexNow(urls), pingSitemapEngines()]);
  } catch (e) {
    console.warn("[indexnow] notifyBlogSearchEngines:", e);
  }
}
