import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { leadToMemberTrip } from "@/lib/member-trips";

type Params = { params: Promise<{ id: string }> };

/** Vista “como la ve el cliente” en Mi cuenta. Solo lectura — no muta pagos ni estado. */
export async function GET(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  try {
    const trip = leadToMemberTrip(lead);
    if (!trip) {
      return NextResponse.json(
        { error: "Este registro no aparece como viaje en Mi cuenta (origen o estado)." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      trip,
      customer: {
        name: lead.nombre,
        email: lead.email,
      },
    });
  } catch (e) {
    console.error("[admin/leads/member-preview]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al generar vista previa" },
      { status: 500 },
    );
  }
}
