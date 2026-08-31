import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leadToConfirmation } from "@/lib/reservation-confirmation";
import { getSessionFromRequest, requireAdmin } from "@/lib/auth-session";
import { verifyReservationAccessToken } from "@/lib/reservation-access";
import { normalizeEmail } from "@/lib/otp-auth";
import { guardPublicApi } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ leadId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const blocked = guardPublicApi(request, { key: "reservations", limit: 30 });
    if (blocked) return blocked;

    const { leadId } = await params;
    const id = Number(leadId);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead || lead.source !== "carrito") {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const admin = await requireAdmin(request);
    const session = getSessionFromRequest(request);
    const token = request.nextUrl.searchParams.get("t");
    const emailParam = request.nextUrl.searchParams.get("email");

    const allowed =
      Boolean(admin)
      || (session && (session.id === lead.userId || normalizeEmail(session.email) === normalizeEmail(lead.email)))
      || verifyReservationAccessToken(id, token)
      || (emailParam != null && normalizeEmail(emailParam) === normalizeEmail(lead.email));

    if (!allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.json({
      confirmation: leadToConfirmation(lead),
      accessToken: verifyReservationAccessToken(id, token) ? token : undefined,
    });
  } catch (e) {
    console.error("[reservations/get]", e);
    return NextResponse.json({ error: "Error al cargar la reserva" }, { status: 500 });
  }
}
