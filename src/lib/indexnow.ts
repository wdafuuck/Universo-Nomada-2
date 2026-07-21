import { SITE_URL } from "@/lib/site-url";

/** Notifica a buscadores (Bing IndexNow, compatible con varios) tras publicar contenido. */
export async function notifyIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key || urls.length === 0) return;

  const host = new URL(SITE_URL).host;
  const body = {
    host,
    key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList: urls.slice(0, 100),
  };

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.warn("[indexnow] ping failed:", e);
  }
}
