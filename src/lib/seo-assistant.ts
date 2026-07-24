import { SITE_URL } from "@/lib/site-url";

/** Free-tier friendly models; first that responds wins. */
const GEMINI_MODELS = ["gemini-flash-latest", "gemini-2.0-flash"] as const;

export type CompetitorSnapshot = {
  url: string;
  ok: boolean;
  title: string | null;
  description: string | null;
  h1: string[];
  h2: string[];
  wordEstimate: number;
  error?: string;
};

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchAll(html: string, re: RegExp): string[] {
  const out: string[] = [];
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = r.exec(html)) !== null) {
    const t = stripTags(m[1] ?? "").slice(0, 160);
    if (t) out.push(t);
    if (out.length >= 12) break;
  }
  return out;
}

/** Analiza HTML público de un competidor (gratis, sin APIs de pago). */
export async function fetchCompetitorSnapshot(rawUrl: string): Promise<CompetitorSnapshot> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { url, ok: false, title: null, description: null, h1: [], h2: [], wordEstimate: 0, error: "URL inválida" };
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "UniversoNomadaBot/1.0 (+https://universonomada.cl; SEO research)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });

    if (!res.ok) {
      return {
        url,
        ok: false,
        title: null,
        description: null,
        h1: [],
        h2: [],
        wordEstimate: 0,
        error: `HTTP ${res.status}`,
      };
    }

    const html = (await res.text()).slice(0, 400_000);
    const title =
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim().slice(0, 200) ?? null;
    const description =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim().slice(0, 320) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1]?.trim().slice(0, 320) ??
      null;
    const h1 = matchAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h2 = matchAll(html, /<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const text = stripTags(html);
    const wordEstimate = text.split(/\s+/).filter(Boolean).length;

    return { url, ok: true, title, description, h1, h2, wordEstimate };
  } catch (e) {
    return {
      url,
      ok: false,
      title: null,
      description: null,
      h1: [],
      h2: [],
      wordEstimate: 0,
      error: e instanceof Error ? e.message : "No se pudo leer el sitio",
    };
  }
}

export async function callGeminiFree(prompt: string): Promise<{ text: string; provider: "gemini" | "rules" }> {
  const key = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GEMINI_API_KEY?.trim();
  if (!key) {
    return { text: buildRulesFallback(prompt, "missing_key"), provider: "rules" };
  }

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
  });

  let lastReason: "api_error" | "quota" | "empty" = "api_error";

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(45000),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => "");
        console.error("[seo-ai] Gemini error", model, res.status, err.slice(0, 300));
        if (res.status === 429) lastReason = "quota";
        continue;
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("\n").trim();
      if (!text) {
        lastReason = "empty";
        continue;
      }
      return { text, provider: "gemini" };
    } catch (e) {
      console.error("[seo-ai] Gemini fail", model, e);
    }
  }

  return { text: buildRulesFallback(prompt, lastReason), provider: "rules" };
}

function buildRulesFallback(
  prompt: string,
  reason: "missing_key" | "quota" | "api_error" | "empty" = "missing_key",
): string {
  const lower = prompt.toLowerCase();
  const reasonLine =
    reason === "missing_key"
      ? "Para activar la IA gratis: crea una API key en https://aistudio.google.com/apikey y pon `GEMINI_API_KEY` en el `.env` del servidor (plan free de Google AI Studio)."
      : reason === "quota"
        ? "Gemini respondió cuota agotada (429) en los modelos disponibles. Espera unos minutos o revisa límites en AI Studio; mientras tanto, plan por reglas:"
        : "Gemini no respondió (error de API o respuesta vacía). Revisa logs `[seo-ai]` en el servidor. Mientras tanto, plan por reglas:";

  const lines = [
    "## Recomendaciones Universo Nómada (modo reglas)",
    "",
    reasonLine,
    "",
    "### Dónde atacar esta semana",
    "1. **Rapa Nui / Tapati 2027** — landing `/viajes/tapati-2027` + Reels + Search Ads cuando activen campaña.",
    "2. **Atacama + Uyuni grupal** — `/viajes/atacama-grupal` + historias de viajeros.",
    "3. **Ballenas + Elqui** — temporada: blog + WhatsApp sticky.",
    "",
    "### Qué mejorar en la web",
    "- Completar paquetes activos (fotos, incluye/excluye, FAQ).",
    "- 1 artículo de blog/semana con CTA al paquete.",
    "- Pedir reseñas Google post-viaje (Rocío en Business Profile).",
    "- Probar checkout (SumUp + transferencia) antes de Ads fuertes.",
    "",
    "### Competencia (qué copiar bien)",
    "- Títulos claros con destino + beneficio (no genéricos «agencia de viajes»).",
    "- Prueba social (estrellas, SERNATUR, fotos reales).",
    "- CTAs visibles en móvil (WhatsApp + Cotizar).",
    "",
  ];

  if (lower.includes("compet") || lower.includes("http")) {
    lines.push(
      "Pegaste URLs de competencia: con Gemini activo compararíamos title/meta/H1 automáticamente. Mientras, abre esas URLs y anota sus títulos y CTAs; nosotros debemos superar claridad + confianza SERNATUR.",
    );
  }

  lines.push("", `Sitio propio: ${SITE_URL}`, "Equipo: Ricardo + Rocío = misma estrategia.");
  return lines.join("\n");
}

export function buildSeoSystemPrompt(input: {
  message: string;
  overviewSummary: string;
  competitors: CompetitorSnapshot[];
}): string {
  const compBlock =
    input.competitors.length === 0
      ? "(sin URLs de competencia en este mensaje)"
      : input.competitors
          .map((c) =>
            [
              `URL: ${c.url}`,
              c.ok ? "OK" : `ERROR: ${c.error ?? "?"}`,
              `Title: ${c.title ?? "—"}`,
              `Meta: ${c.description ?? "—"}`,
              `H1: ${c.h1.join(" | ") || "—"}`,
              `H2: ${c.h2.slice(0, 6).join(" | ") || "—"}`,
              `Palabras ~${c.wordEstimate}`,
            ].join("\n"),
          )
          .join("\n\n");

  return `Eres el estratega SEO y crecimiento de Universo Nómada®, agencia de viajes boutique en Chile (Viña del Mar / La Serena).
Ricardo y Rocío son pareja y operan como UN solo negocio: da recomendaciones para ambos, sin separar “su cuenta / mi cuenta”.

Sitio: ${SITE_URL}
Instagram: @universo.nomadaa
Registro SERNATUR vigente. Pagos web (SumUp + transferencia). Meta Ads lo opera Rocío; Search Console/GA Ricardo (acceso cruzado).

DATOS INTERNOS DE TRÁFICO/LEADS:
${input.overviewSummary}

COMPETENCIA ANALIZADA (HTML público):
${compBlock}

MENSAJE DEL EQUIPO:
${input.message}

Responde en español de Chile, concreto y accionable:
1) Diagnóstico breve
2) Qué atacar YA (3 acciones prioritarias)
3) Qué mejorar en la web (SEO on-page, blog, landings)
4) Qué aprender de la competencia (sin copiar ilegalmente: estructura, CTAs, ángulos)
5) Plan 7 días (checklist)

No inventes precios ni datos de tráfico que no estén arriba. Si falta Gemini, igual da el mejor plan posible.`;
}
