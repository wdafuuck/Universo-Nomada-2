import { db } from "@/lib/db";
import { callGeminiWithSearch } from "@/lib/seo-assistant";

export type DestinationNewsItem = {
  destination: string;
  country?: string;
  severity: "alta" | "media" | "baja" | "info";
  title: string;
  summary: string;
  actionHint?: string;
  sourceHint?: string;
};

export type DestinationNewsReport = {
  date: string; // YYYY-MM-DD (Chile)
  generatedAt: string;
  provider: "gemini" | "rules" | "cache";
  destinations: string[];
  items: DestinationNewsItem[];
  headline: string;
};

const CACHE_KEY_PREFIX = "admin-destination-news:";

function chileDateKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Destinos activos a monitorear (ciudad/país/alrededores). */
export async function listActiveDestinationLabels(): Promise<string[]> {
  const tours = await db.tour.findMany({
    where: { active: true },
    select: { name: true, subtitle: true, tourId: true },
    orderBy: { sortOrder: "asc" },
  });

  const labels = new Set<string>();
  for (const t of tours) {
    const name = t.name?.trim();
    const sub = t.subtitle?.trim();
    if (name) labels.add(name);
    if (sub) labels.add(sub);
    // tokens útiles (ej. "Cusco + Machu Picchu" → ambos)
    for (const part of `${name} ${sub}`.split(/\s*[+,|/]\s*|\s+e\s+|\s+y\s+/i)) {
      const p = part.replace(/\b(grupal|copy|5d|7d|4d|3n)\b/gi, "").trim();
      if (p.length >= 4) labels.add(p);
    }
  }

  // Países / zonas frecuentes del catálogo UN
  for (const extra of [
    "Chile",
    "Perú",
    "Bolivia",
    "Argentina",
    "Brasil",
    "Rapa Nui",
    "Isla de Pascua",
    "San Pedro de Atacama",
    "Salar de Uyuni",
    "Cataratas del Iguazú",
    "Hito Cajón",
    "Machu Picchu",
    "Cusco",
  ]) {
    labels.add(extra);
  }

  return [...labels].slice(0, 40);
}

function rulesFallback(destinations: string[]): DestinationNewsReport {
  const date = chileDateKey();
  return {
    date,
    generatedAt: new Date().toISOString(),
    provider: "rules",
    destinations,
    headline: "Briefing operativo (modo sin IA)",
    items: [
      {
        destination: "General",
        severity: "info",
        title: "Configura GEMINI_API_KEY para el reporte diario con IA",
        summary:
          "Sin clave Gemini el panel muestra este aviso. Con la clave activa, cada día se genera un briefing de cierres, visas, clima extremo y alertas por tus destinos.",
        actionHint: "Revisa SEMATUR / embajadas y WhatsApp de operadores locales mientras tanto.",
      },
      ...destinations.slice(0, 6).map((d) => ({
        destination: d,
        severity: "info" as const,
        title: `Monitoreo pendiente — ${d}`,
        summary: `Verifica accesos, clima y requisitos de ingreso para ${d} antes de confirmar reservas del día.`,
        actionHint: "Consulta operadores locales y fuentes oficiales.",
      })),
    ],
  };
}

function parseReportJson(raw: string, destinations: string[]): DestinationNewsReport | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]) as Partial<DestinationNewsReport>;
    if (!Array.isArray(data.items) || data.items.length === 0) return null;
    const items: DestinationNewsItem[] = data.items
      .filter((i) => i && typeof i === "object" && typeof (i as DestinationNewsItem).title === "string")
      .map((i) => {
        const row = i as DestinationNewsItem;
        const sev = row.severity;
        return {
          destination: String(row.destination ?? "General"),
          country: row.country ? String(row.country) : undefined,
          severity:
            sev === "alta" || sev === "media" || sev === "baja" || sev === "info" ? sev : "info",
          title: String(row.title).slice(0, 160),
          summary: String(row.summary ?? "").slice(0, 600),
          actionHint: row.actionHint ? String(row.actionHint).slice(0, 240) : undefined,
          sourceHint: row.sourceHint ? String(row.sourceHint).slice(0, 160) : undefined,
        };
      });
    if (items.length === 0) return null;
    return {
      date: chileDateKey(),
      generatedAt: new Date().toISOString(),
      provider: "gemini",
      destinations,
      headline: String(data.headline ?? "Briefing diario de destinos").slice(0, 120),
      items,
    };
  } catch {
    return null;
  }
}

async function generateReport(destinations: string[]): Promise<DestinationNewsReport> {
  const today = chileDateKey();
  const prompt = `Eres el analista operativo interno de Universo Nómada (agencia de viajes boutique en Chile).
Fecha (Chile): ${today}.

Genera un BRIEFING INTERNO diario (NO marketing) sobre estos destinos y alrededores:
${destinations.map((d) => `- ${d}`).join("\n")}

Prioriza hechos operativos que un agente debe saber HOY:
- cierres de atractivos (ej. Garganta del Diablo, pasos fronterizos como Hito Cajón)
- bloqueos de caminos / huelgas / erupciones / clima extremo
- cambios de visa, vacuna, formulario de ingreso, tasas
- alertas de seguridad relevantes para turistas
- feriados o eventos que saturen hoteles/vuelos

Responde SOLO JSON válido con esta forma:
{
  "headline": "string corto",
  "items": [
    {
      "destination": "string",
      "country": "string opcional",
      "severity": "alta|media|baja|info",
      "title": "string",
      "summary": "2-4 oraciones en español, concretas",
      "actionHint": "qué debe hacer el agente",
      "sourceHint": "tipo de fuente (oficial/prensa/operador)"
    }
  ]
}

Máximo 12 items. Si no hay alertas fuertes, incluye 4–6 items "info" útiles (temporada, tips de confirmación). No inventes URLs. Sé específico con nombres de lugares.`;

  const { text, provider } = await callGeminiWithSearch(prompt);
  if (provider === "rules") return rulesFallback(destinations);

  const parsed = parseReportJson(text, destinations);
  if (!parsed) {
    const fb = rulesFallback(destinations);
    fb.headline = "No se pudo parsear el briefing IA — modo seguro";
    return fb;
  }
  parsed.provider = "gemini";
  return parsed;
}

async function readCache(date: string): Promise<DestinationNewsReport | null> {
  try {
    const row = await db.siteContent.findUnique({ where: { key: `${CACHE_KEY_PREFIX}${date}` } });
    if (!row?.json) return null;
    const data = JSON.parse(row.json) as DestinationNewsReport;
    if (!data?.items?.length) return null;
    return { ...data, provider: "cache" };
  } catch {
    return null;
  }
}

async function writeCache(report: DestinationNewsReport): Promise<void> {
  const key = `${CACHE_KEY_PREFIX}${report.date}`;
  const json = JSON.stringify({ ...report, provider: report.provider === "cache" ? "gemini" : report.provider });
  await db.siteContent.upsert({
    where: { key },
    create: { key, json },
    update: { json },
  });
}

/**
 * Briefing diario interno. Usa caché del día (Chile) salvo forceRefresh.
 */
export async function getDestinationNewsReport(opts?: {
  forceRefresh?: boolean;
}): Promise<DestinationNewsReport> {
  const date = chileDateKey();
  if (!opts?.forceRefresh) {
    const cached = await readCache(date);
    if (cached) return cached;
  }

  const destinations = await listActiveDestinationLabels();
  const report = await generateReport(destinations);
  try {
    await writeCache(report);
  } catch (e) {
    console.error("[destination-news] cache write", e);
  }
  return report;
}
