import { NextRequest, NextResponse } from "next/server";
import { getDestinationNewsReport } from "@/lib/destination-news";

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Regenera el briefing diario de destinos (caché del día Chile). */
export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await getDestinationNewsReport({ forceRefresh: true });
    return NextResponse.json({
      ok: true,
      date: report.date,
      provider: report.provider,
      items: report.items.length,
      headline: report.headline,
    });
  } catch (e) {
    console.error("[cron/destination-news]", e);
    return NextResponse.json({ error: "Error al generar briefing" }, { status: 500 });
  }
}
