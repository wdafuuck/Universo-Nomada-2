import { NextRequest, NextResponse } from "next/server";
import { requireFullAdmin } from "@/lib/auth-session";
import { getDestinationNewsReport } from "@/lib/destination-news";
import { isGeminiConfigured } from "@/lib/seo-assistant";

/** Briefing interno de destinos — solo admin completo (no marketing/ops). */
export async function GET(request: NextRequest) {
  const admin = await requireFullAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const force = request.nextUrl.searchParams.get("refresh") === "1";
    const report = await getDestinationNewsReport({ forceRefresh: force });
    return NextResponse.json({
      report,
      geminiConfigured: isGeminiConfigured(),
    });
  } catch (e) {
    console.error("[admin/destination-news GET]", e);
    return NextResponse.json({ error: "Error al obtener noticias" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireFullAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const report = await getDestinationNewsReport({ forceRefresh: true });
    return NextResponse.json({
      report,
      geminiConfigured: isGeminiConfigured(),
    });
  } catch (e) {
    console.error("[admin/destination-news POST]", e);
    return NextResponse.json({ error: "Error al regenerar noticias" }, { status: 500 });
  }
}
