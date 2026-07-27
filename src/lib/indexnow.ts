import { SITE_URL } from "@/lib/site-url";

export type IndexNowResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  submitted: number;
  batches: number;
  statusCodes: number[];
};

/**
 * Notifica a buscadores compatibles con IndexNow (Bing, Yandex, etc.).
 * Google usa principalmente el sitemap de Search Console.
 */
export async function notifyIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY?.trim();
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];

  if (!key) {
    return { ok: false, skipped: true, reason: "INDEXNOW_KEY no configurada", submitted: 0, batches: 0, statusCodes: [] };
  }
  if (unique.length === 0) {
    return { ok: false, skipped: true, reason: "Sin URLs", submitted: 0, batches: 0, statusCodes: [] };
  }

  const host = new URL(SITE_URL).host;
  const statusCodes: number[] = [];
  const chunkSize = 100;
  let batches = 0;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const urlList = unique.slice(i, i + chunkSize);
    batches += 1;
    try {
      const res = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host,
          key,
          keyLocation: `${SITE_URL}/${key}.txt`,
          urlList,
        }),
      });
      statusCodes.push(res.status);
    } catch (e) {
      console.warn("[indexnow] ping failed:", e);
      statusCodes.push(0);
    }
  }

  const ok = statusCodes.every((c) => c === 200 || c === 202);
  return { ok, submitted: unique.length, batches, statusCodes };
}

/** Avisa a Google/Bing que el sitemap cambió (best-effort). */
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
