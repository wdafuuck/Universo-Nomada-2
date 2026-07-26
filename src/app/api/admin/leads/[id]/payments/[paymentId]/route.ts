import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import {
  checkInFromLeadCart,
  deleteLeadPayment,
  listLeadPayments,
  paymentPanelSummary,
} from "@/lib/lead-payments";

type Params = { params: Promise<{ id: string; paymentId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, paymentId: paymentIdRaw } = await params;
  const leadId = Number(id);
  const paymentId = Number(paymentIdRaw);
  if (!Number.isFinite(leadId) || !Number.isFinite(paymentId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  try {
    const sync = await deleteLeadPayment(leadId, paymentId);
    const payments = await listLeadPayments(leadId);
    const checkIn = checkInFromLeadCart(lead.cartJson);

    return NextResponse.json({
      ok: true,
      ...sync,
      checkIn,
      payments,
      summary: paymentPanelSummary({
        cartTotal: sync.cartTotal,
        amountPaid: sync.amountPaid,
        checkIn,
        status: sync.status,
        paymentMethod: lead.paymentMethod,
        paymentPlan: lead.paymentPlan,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar abono";
    const status = msg.includes("no encontrado") ? 404 : 500;
    console.error("[admin/leads/payments DELETE]", e);
    return NextResponse.json({ error: msg }, { status });
  }
}
