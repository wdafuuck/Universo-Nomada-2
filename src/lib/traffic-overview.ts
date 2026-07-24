import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site-url";

export type TrafficOverview = {
  periodDays: number;
  leadsTotal: number;
  leadsPeriod: number;
  leadsPrevPeriod: number;
  leadsChangePct: number | null;
  checkoutsPeriod: number;
  byDestination: { name: string; count: number }[];
  bySource: { name: string; count: number }[];
  activeTours: number;
  activeBlogPosts: number;
  activePromos: number;
  recommendations: string[];
  geminiConfigured: boolean;
  ga4PropertyId: string | null;
  siteUrl: string;
  sharedNote: string;
};

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Métricas gratis desde DB del negocio (compartidas Ricardo + Rocío). */
export async function getTrafficOverview(days = 28): Promise<TrafficOverview> {
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

  const [
    leadsTotal,
    leadsPeriod,
    leadsPrevPeriod,
    checkoutsPeriod,
    periodLeads,
    activeTours,
    activeBlogPosts,
    activePromos,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { createdAt: { gte: periodStart } } }),
    db.lead.count({ where: { createdAt: { gte: prevStart, lt: periodStart } } }),
    db.lead.count({
      where: {
        createdAt: { gte: periodStart },
        OR: [{ cartTotal: { gt: 0 } }, { paymentMethod: { not: null } }],
      },
    }),
    db.lead.findMany({
      where: { createdAt: { gte: periodStart } },
      select: { destino: true, source: true },
    }),
    db.tour.count({ where: { active: true } }),
    db.blogArticle.count({ where: { active: true } }),
    db.promotion.count({ where: { active: true } }),
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

  const change = pctChange(leadsPeriod, leadsPrevPeriod);
  const recommendations: string[] = [];

  if (leadsPeriod === 0) {
    recommendations.push(
      "Sin cotizaciones en el periodo: 1 Reel diario + CTA WhatsApp + post blog con botón a cotizar.",
    );
  } else if (change !== null && change < 0) {
    recommendations.push(
      "Cotizaciones a la baja vs periodo anterior: Rocío refuerza Meta; Ricardo revisa Search Console y landings.",
    );
  } else {
    recommendations.push("Tendencia de cotizaciones OK: escalar el destino top en ads y contenido.");
  }

  if (byDestination[0]) {
    recommendations.push(
      `Más pedido: «${byDestination[0].name}» (${byDestination[0].count}). Priorizar esa ficha, fotos y anuncio.`,
    );
  }

  if (activeBlogPosts < 8) {
    recommendations.push("Blog todavía delgado: 1 guía/semana (Tapati, Atacama, Ballenas, Mendoza).");
  }

  if (checkoutsPeriod === 0) {
    recommendations.push("Casi no hay checkouts: probar SumUp/transferencia y simplificar el carrito en móvil.");
  }

  recommendations.push(
    "Ataque semanal: (1) catálogo admin limpio, (2) 3 Reels del destino top, (3) pedir 3 reseñas Google a viajeros recientes.",
  );

  return {
    periodDays: days,
    leadsTotal,
    leadsPeriod,
    leadsPrevPeriod,
    leadsChangePct: change,
    checkoutsPeriod,
    byDestination,
    bySource,
    activeTours,
    activeBlogPosts,
    activePromos,
    recommendations,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GEMINI_API_KEY?.trim()),
    ga4PropertyId: process.env.GA4_PROPERTY_ID?.trim() || null,
    siteUrl: SITE_URL,
    sharedNote:
      "Panel compartido Universo Nómada — Ricardo y Rocío ven la misma información del negocio.",
  };
}
