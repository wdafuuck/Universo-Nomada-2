import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site-url";
import { hasGa4Credentials } from "@/lib/ga4-data";

export type RecentLeadRow = {
  id: number;
  nameMasked: string;
  destino: string | null;
  source: string | null;
  createdAt: string;
};

export type ConnectionCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  href?: string;
};

export type TrafficOverview = {
  periodDays: number;
  leadsTotal: number;
  leadsPeriod: number;
  leadsPrevPeriod: number;
  leadsChangePct: number | null;
  checkoutsPeriod: number;
  /** Ventana corta — sensación de tiempo real de negocio */
  leadsLast1h: number;
  leadsLast24h: number;
  checkoutsLast24h: number;
  recentLeads: RecentLeadRow[];
  byDestination: { name: string; count: number }[];
  bySource: { name: string; count: number }[];
  activeTours: number;
  activeBlogPosts: number;
  activePromos: number;
  recommendations: string[];
  connections: ConnectionCheck[];
  geminiConfigured: boolean;
  ga4PropertyId: string | null;
  ga4Configured: boolean;
  siteUrl: string;
  sharedNote: string;
  generatedAt: string;
};

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function maskName(nombre: string): string {
  const first = nombre.trim().split(/\s+/)[0] || "Viajero";
  if (first.length <= 2) return `${first}***`;
  return `${first.slice(0, 3)}***`;
}

export function getConnectionChecks(): ConnectionCheck[] {
  const gaId = Boolean(process.env.NEXT_PUBLIC_GA_ID?.trim());
  const gtmId = Boolean(process.env.NEXT_PUBLIC_GTM_ID?.trim());
  const ga4Prop = Boolean(process.env.GA4_PROPERTY_ID?.trim());
  const ga4Creds = hasGa4Credentials();
  const gemini = Boolean(
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GEMINI_API_KEY?.trim(),
  );
  const siteVerify = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()
    || process.env.GOOGLE_SITE_VERIFICATION?.trim(),
  );

  return [
    {
      id: "ga",
      label: "Google Analytics (measurement ID)",
      ok: gaId,
      detail: gaId
        ? `GA cargando en el sitio (${process.env.NEXT_PUBLIC_GA_ID?.trim()})`
        : "Falta NEXT_PUBLIC_GA_ID en .env",
      href: "https://analytics.google.com/",
    },
    {
      id: "gtm",
      label: "Google Tag Manager",
      ok: gtmId,
      detail: gtmId
        ? `Contenedor ${process.env.NEXT_PUBLIC_GTM_ID?.trim()}`
        : "Falta NEXT_PUBLIC_GTM_ID (opcional si GA va directo)",
      href: "https://tagmanager.google.com/",
    },
    {
      id: "ga4-api",
      label: "GA4 Data API (usuarios en vivo en este panel)",
      ok: ga4Prop && ga4Creds,
      detail:
        ga4Prop && ga4Creds
          ? "Listo: este panel puede leer usuarios activos"
          : !ga4Prop
            ? "Falta GA4_PROPERTY_ID"
            : "Falta GA4_SERVICE_ACCOUNT_JSON (o GOOGLE_APPLICATION_CREDENTIALS)",
      href: "https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com",
    },
    {
      id: "gemini",
      label: "Asistente SEO (Gemini)",
      ok: gemini,
      detail: gemini ? "Gemini activo" : "Falta GEMINI_API_KEY — el chat usa modo reglas",
      href: "https://aistudio.google.com/apikey",
    },
    {
      id: "gsc-verify",
      label: "Verificación Search Console (meta tag)",
      ok: siteVerify,
      detail: siteVerify
        ? "Meta de verificación presente"
        : "Opcional: NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION (si verificaste por DNS, OK igual)",
      href: "https://search.google.com/search-console",
    },
  ];
}

/** Métricas desde DB del negocio (compartidas Ricardo + Rocío). */
export async function getTrafficOverview(days = 28): Promise<TrafficOverview> {
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);
  const h1 = new Date(now.getTime() - 60 * 60 * 1000);
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const checkoutWhere = {
    OR: [{ cartTotal: { gt: 0 } }, { paymentMethod: { not: null } }],
  };

  const [
    leadsTotal,
    leadsPeriod,
    leadsPrevPeriod,
    checkoutsPeriod,
    leadsLast1h,
    leadsLast24h,
    checkoutsLast24h,
    periodLeads,
    recentRaw,
    activeTours,
    activeBlogPosts,
    activePromos,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { createdAt: { gte: periodStart } } }),
    db.lead.count({ where: { createdAt: { gte: prevStart, lt: periodStart } } }),
    db.lead.count({
      where: { createdAt: { gte: periodStart }, ...checkoutWhere },
    }),
    db.lead.count({ where: { createdAt: { gte: h1 } } }),
    db.lead.count({ where: { createdAt: { gte: h24 } } }),
    db.lead.count({
      where: { createdAt: { gte: h24 }, ...checkoutWhere },
    }),
    db.lead.findMany({
      where: { createdAt: { gte: periodStart } },
      select: { destino: true, source: true },
    }),
    db.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, nombre: true, destino: true, source: true, createdAt: true },
    }),
    db.tour.count({ where: { active: true } }),
    db.blogArticle.count({ where: { active: true } }),
    db.tour.count({ where: { active: true, showInOfertas: true } }),
  ]);

  const destMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();
  for (const l of periodLeads) {
    if (l.destino?.trim()) {
      const d = l.destino.trim();
      destMap.set(d, (destMap.get(d) ?? 0) + 1);
    }
    const s = l.source?.trim() || "web";
    sourceMap.set(s, (sourceMap.get(s) ?? 0) + 1);
  }

  const byDestination = [...destMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const bySource = [...sourceMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const recentLeads: RecentLeadRow[] = recentRaw.map((l) => ({
    id: l.id,
    nameMasked: maskName(l.nombre || "Viajero"),
    destino: l.destino,
    source: l.source,
    createdAt: l.createdAt.toISOString(),
  }));

  const change = pctChange(leadsPeriod, leadsPrevPeriod);
  const recommendations: string[] = [];

  if (leadsLast24h === 0) {
    recommendations.push(
      "Sin leads en 24 h: publicar 1 Reel + story con CTA WhatsApp del destino top.",
    );
  }

  if (leadsPeriod === 0) {
    recommendations.push(
      "Sin cotizaciones en el periodo: 1 guía blog + CTA a /viajes/chile o destino foco.",
    );
  } else if (change !== null && change < 0) {
    recommendations.push(
      "Cotizaciones a la baja vs periodo anterior: reforzar Meta Ads y revisar Search Console.",
    );
  } else {
    recommendations.push("Tendencia de cotizaciones OK: escalar el destino top en ads y contenido.");
  }

  if (byDestination[0]) {
    recommendations.push(
      `Más pedido: «${byDestination[0].name}» (${byDestination[0].count}). Priorizar ficha, fotos y anuncio.`,
    );
  }

  if (activeBlogPosts < 8) {
    recommendations.push("Blog delgado: 1 guía/semana (Rapa Nui, Atacama, Patagonia, viajes Chile).");
  } else {
    recommendations.push("Blog con volumen: enlazar cada post al hub /viajes/[destino] correspondiente.");
  }

  if (checkoutsPeriod === 0) {
    recommendations.push("Sin checkouts en el periodo: revisar pasarela y fricción del carrito móvil.");
  }

  recommendations.push(
    "SEO: pedir indexación de hubs nuevos en GSC y mantener sitemap-index.xml al día.",
  );

  const ga4PropertyId = process.env.GA4_PROPERTY_ID?.trim() || null;

  return {
    periodDays: days,
    leadsTotal,
    leadsPeriod,
    leadsPrevPeriod,
    leadsChangePct: change,
    checkoutsPeriod,
    leadsLast1h,
    leadsLast24h,
    checkoutsLast24h,
    recentLeads,
    byDestination,
    bySource,
    activeTours,
    activeBlogPosts,
    activePromos,
    recommendations,
    connections: getConnectionChecks(),
    geminiConfigured: Boolean(
      process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GEMINI_API_KEY?.trim(),
    ),
    ga4PropertyId,
    ga4Configured: Boolean(ga4PropertyId && hasGa4Credentials()),
    siteUrl: SITE_URL,
    sharedNote:
      "Panel en vivo — Ricardo y Rocío ven la misma información del negocio (auto-actualiza).",
    generatedAt: now.toISOString(),
  };
}
