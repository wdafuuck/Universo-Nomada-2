import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-session";
import { getGa4Realtime, getGa4Summary } from "@/lib/ga4-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const daysRaw = Number(request.nextUrl.searchParams.get("days") ?? "28");
  const days = [7, 14, 28, 90].includes(daysRaw) ? daysRaw : 28;
  const withSummary = request.nextUrl.searchParams.get("summary") === "1";

  try {
    const [realtime, summary] = await Promise.all([
      getGa4Realtime(),
      withSummary ? getGa4Summary(days) : Promise.resolve(null),
    ]);
    return NextResponse.json({ realtime, summary });
  } catch (e) {
    console.error("[admin/analytics/realtime]", e);
    return NextResponse.json({ error: "No se pudo leer GA4" }, { status: 500 });
  }
}
