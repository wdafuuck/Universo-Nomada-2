import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-session";
import { getTrafficOverview } from "@/lib/traffic-overview";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const daysRaw = Number(request.nextUrl.searchParams.get("days") ?? "28");
  const days = [7, 14, 28, 90].includes(daysRaw) ? daysRaw : 28;

  try {
    const overview = await getTrafficOverview(days);
    return NextResponse.json(overview);
  } catch (e) {
    console.error("[admin/analytics]", e);
    return NextResponse.json({ error: "No se pudieron cargar métricas" }, { status: 500 });
  }
}
