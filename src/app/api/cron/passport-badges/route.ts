import { NextRequest, NextResponse } from "next/server";
import { processCompletedTripsForBadges } from "@/lib/passport-award";

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Marca viajes terminados como viajo y otorga insignias de pasaporte. */
export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processCompletedTripsForBadges(80);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/passport-badges]", e);
    return NextResponse.json({ error: "Error al procesar insignias" }, { status: 500 });
  }
}
