import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-session";
import { getTrafficOverview } from "@/lib/traffic-overview";
import {
  buildSeoSystemPrompt,
  callGeminiFree,
  fetchCompetitorSnapshot,
} from "@/lib/seo-assistant";

type Body = {
  message?: string;
  competitorUrls?: string[];
  days?: number;
};

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message || message.length > 4000) {
    return NextResponse.json({ error: "Escribe un mensaje (máx. 4000 caracteres)" }, { status: 400 });
  }

  const urls = (body.competitorUrls ?? [])
    .map((u) => String(u).trim())
    .filter(Boolean)
    .slice(0, 3);

  const days = [7, 14, 28, 90].includes(Number(body.days)) ? Number(body.days) : 28;

  try {
    const [overview, competitors] = await Promise.all([
      getTrafficOverview(days),
      Promise.all(urls.map((u) => fetchCompetitorSnapshot(u))),
    ]);

    const overviewSummary = [
      `Periodo: ${overview.periodDays} días`,
      `Leads periodo: ${overview.leadsPeriod} (prev: ${overview.leadsPrevPeriod}, cambio: ${overview.leadsChangePct ?? "n/a"}%)`,
      `Leads totales históricos: ${overview.leadsTotal}`,
      `Checkouts/carrito periodo: ${overview.checkoutsPeriod}`,
      `Destinos top: ${overview.byDestination.map((d) => `${d.name}(${d.count})`).join(", ") || "—"}`,
      `Fuentes: ${overview.bySource.map((s) => `${s.name}(${s.count})`).join(", ") || "—"}`,
      `Tours activos: ${overview.activeTours}, blog: ${overview.activeBlogPosts}, promos: ${overview.activePromos}`,
      `Tips internos: ${overview.recommendations.join(" | ")}`,
    ].join("\n");

    const prompt = buildSeoSystemPrompt({ message, overviewSummary, competitors });
    const { text, provider } = await callGeminiFree(prompt);

    return NextResponse.json({
      reply: text,
      provider,
      competitors,
      sharedNote: overview.sharedNote,
    });
  } catch (e) {
    console.error("[admin/seo/chat]", e);
    return NextResponse.json({ error: "Error en el asistente SEO" }, { status: 500 });
  }
}
