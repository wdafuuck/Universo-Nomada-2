import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import {
  addLeadPayment,
  checkInFromLeadCart,
  listLeadPayments,
  paymentPanelSummary,
  updateLeadCartTotal,
} from "@/lib/lead-payments";

type Params = { params: Promise<{ id: string }> };

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
    const payments = await listLeadPayments(leadId);
    const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
    const cartTotal = Math.max(0, lead.cartTotal ?? 0);
    const checkIn = checkInFromLeadCart(lead.cartJson);
    const summary = paymentPanelSummary({
      cartTotal,
      amountPaid,
      checkIn,
      status: lead.status,
      paymentMethod: lead.paymentMethod,
      paymentPlan: lead.paymentPlan,
    });

    return NextResponse.json({
      leadId,
      cartTotal,
      amountPaid,
      checkIn,
      destino: lead.destino,
      status: lead.status,
      payments,
      summary,
    });
  } catch (e) {
    console.error("[admin/leads/payments GET]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al listar abonos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
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
    const body = await request.json();
    const action = String(body.action ?? (body.amount !== undefined ? "add_payment" : "update_total"));

    let sync;
    let payment: Awaited<ReturnType<typeof addLeadPayment>>["payment"] | null = null;

    if (action === "update_total" || (body.cartTotal !== undefined && body.amount === undefined)) {
      sync = await updateLeadCartTotal(leadId, Number(body.cartTotal));
    } else {
      const paidAt = body.paidAt ? new Date(String(body.paidAt)) : undefined;
      if (paidAt && Number.isNaN(paidAt.getTime())) {
        return NextResponse.json({ error: "Fecha de abono inválida" }, { status: 400 });
      }
      const result = await addLeadPayment({
        leadId,
        amount: Number(body.amount),
        paidAt,
        method: body.method ? String(body.method) : undefined,
        note: body.note ? String(body.note) : undefined,
      });
      payment = result.payment;
      sync = result.summary;

      if (body.cartTotal !== undefined) {
        sync = await updateLeadCartTotal(leadId, Number(body.cartTotal));
      }
    }

    const payments = await listLeadPayments(leadId);
    const updatedLead = await db.lead.findUnique({ where: { id: leadId } });
    const checkIn = checkInFromLeadCart(updatedLead?.cartJson ?? null);

    return NextResponse.json({
      ok: true,
      payment,
      ...sync,
      checkIn,
      payments,
      summary: paymentPanelSummary({
        cartTotal: sync.cartTotal,
        amountPaid: sync.amountPaid,
        checkIn,
        status: sync.status,
        paymentMethod: updatedLead?.paymentMethod ?? lead.paymentMethod,
        paymentPlan: updatedLead?.paymentPlan ?? lead.paymentPlan,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al registrar abono";
    const status = msg.includes("mayor a 0") ? 400 : 500;
    console.error("[admin/leads/payments POST]", e);
    return NextResponse.json({ error: msg }, { status });
  }
}
