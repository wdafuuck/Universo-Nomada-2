import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import {
  buildCartJsonFromLines,
  destinationFromCart,
  parseCartJsonRaw,
  serializeCartLines,
  tripEndDateFromCartLines,
  type EditableCartLine,
} from "@/lib/admin-lead-edit";
import { normalizeEmail } from "@/lib/otp-auth";
import { reconcileLeadPaidAmount, updateLeadCartTotal } from "@/lib/lead-payments";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUS = [
  "nuevo",
  "pendiente_transferencia",
  "contactado",
  "cotizado",
  "reservado",
  "viajo",
  "cancelado",
] as const;

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const existing = await db.lead.findUnique({ where: { id: leadId } });
  if (!existing) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const body = await request.json();

  if (body.status && !VALID_STATUS.includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.nombre !== undefined) updateData.nombre = String(body.nombre).trim();
  if (body.email !== undefined) updateData.email = normalizeEmail(String(body.email));
  if (body.telefono !== undefined) updateData.telefono = String(body.telefono).trim();
  if (body.destino !== undefined) updateData.destino = String(body.destino).trim() || null;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.cartTotal !== undefined) updateData.cartTotal = Number(body.cartTotal) || 0;
  // amountDue se sincroniza vía ledger más abajo (no escribir a ciegas)
  const requestedPaid =
    body.amountDue !== undefined ? Math.max(0, Number(body.amountDue) || 0) : null;
  if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod || null;
  if (body.paymentPlan !== undefined) updateData.paymentPlan = body.paymentPlan || null;
  if (body.assignedToUserId !== undefined) {
    updateData.assignedToUserId = body.assignedToUserId ? String(body.assignedToUserId) : null;
  }

  if (body.tripEndDate !== undefined) {
    updateData.tripEndDate = body.tripEndDate ? new Date(String(body.tripEndDate)) : null;
  } else if (body.status === "viajo" && !existing.tripEndDate) {
    const autoEnd = tripEndDateFromCartLines(parseCartJsonRaw(existing.cartJson));
    updateData.tripEndDate = autoEnd ?? new Date();
  }

  if (Array.isArray(body.cartItems)) {
    const cartItems = body.cartItems as EditableCartLine[];
    updateData.cartJson = existing.cartJson
      ? serializeCartLines(cartItems, existing.cartJson)
      : buildCartJsonFromLines(cartItems);
    if (body.destino === undefined) {
      updateData.destino = destinationFromCart(cartItems);
    }
    if (body.tripEndDate === undefined) {
      const autoEnd = tripEndDateFromCartLines(cartItems);
      if (autoEnd) updateData.tripEndDate = autoEnd;
    }
  }

  const nextCartTotal = Number(updateData.cartTotal ?? existing.cartTotal ?? 0);
  const nextAmountPaid = requestedPaid ?? Number(existing.amountDue ?? 0);
  const nextStatus = String(updateData.status ?? existing.status);
  if (nextCartTotal > 0 && nextAmountPaid >= nextCartTotal && !["cancelado", "viajo"].includes(nextStatus)) {
    updateData.status = "reservado";
  }

  const lead = await db.lead.update({
    where: { id: leadId },
    data: updateData,
  });

  if (body.status !== undefined && body.status !== existing.status) {
    await db.leadEvent.create({
      data: {
        leadId,
        type: "status_change",
        message: `${existing.status} → ${body.status}`,
        metaJson: JSON.stringify({ by: admin.id, from: existing.status, to: body.status }),
      },
    });
  }

  if (
    body.assignedToUserId !== undefined &&
    String(body.assignedToUserId || "") !== String(existing.assignedToUserId || "")
  ) {
    await db.leadEvent.create({
      data: {
        leadId,
        type: "assignment",
        message: body.assignedToUserId
          ? `Asignado a ${body.assignedToUserId}`
          : "Sin asignar",
        metaJson: JSON.stringify({ by: admin.id, assignedToUserId: body.assignedToUserId ?? null }),
      },
    });
  }

  if (body.cartTotal !== undefined) {
    await updateLeadCartTotal(leadId, Number(body.cartTotal) || 0);
  }
  if (requestedPaid != null) {
    await reconcileLeadPaidAmount(leadId, requestedPaid, {
      method: String(body.paymentMethod || existing.paymentMethod || "admin"),
      note: "Ajuste desde admin de leads",
    });
  }

  const fresh = await db.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      notes: { orderBy: { createdAt: "desc" }, take: 50 },
      events: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  return NextResponse.json({ lead: fresh ?? lead });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const existing = await db.lead.findUnique({ where: { id: leadId } });
  if (!existing) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  await db.lead.delete({ where: { id: leadId } });
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id: Number(id) },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      notes: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      events: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!lead) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    lead,
    cartItems: parseCartJsonRaw(lead.cartJson),
    documents: await db.tripDocument.findMany({
      where: { leadId: lead.id },
      orderBy: { createdAt: "desc" },
    }),
  });
}
