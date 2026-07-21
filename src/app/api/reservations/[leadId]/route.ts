import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leadToConfirmation } from "@/lib/reservation-confirmation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ leadId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { leadId } = await params;
    const id = Number(leadId);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead || lead.source !== "carrito") {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      confirmation: leadToConfirmation(lead),
    });
  } catch (e) {
    console.error("[reservations/get]", e);
    return NextResponse.json({ error: "Error al cargar la reserva" }, { status: 500 });
  }
}
