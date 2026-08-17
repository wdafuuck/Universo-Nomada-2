import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredTripDocuments } from "@/lib/trip-document-retention";
import { TRIP_DOCUMENT_RETENTION_DAYS } from "@/lib/trip-documents";

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Elimina documentos de viaje vencidos (7 días post-viaje). */
export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await cleanupExpiredTripDocuments();
  return NextResponse.json({
    ok: true,
    deleted,
    retentionDays: TRIP_DOCUMENT_RETENTION_DAYS,
  });
}
