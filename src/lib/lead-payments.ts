import { db } from "@/lib/db";
import { paymentSummary } from "@/lib/reservation-payment";
import { getFirstCartLineMeta } from "@/lib/trip-dates";

export type LeadPaymentRow = {
  id: number;
  leadId: number;
  amount: number;
  paidAt: Date;
  method: string;
  note: string;
  createdAt: Date;
};

/** Suma abonos y sincroniza Lead.amountDue (= monto pagado). Marca reservado si queda saldado. */
export async function syncLeadPaidFromPayments(leadId: number): Promise<{
  amountPaid: number;
  cartTotal: number;
  balanceDue: number;
  isFullyPaid: boolean;
  status: string;
}> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Reserva no encontrada");

  const agg = await db.leadPayment.aggregate({
    where: { leadId },
    _sum: { amount: true },
  });
  const amountPaid = Math.max(0, agg._sum.amount ?? 0);
  const cartTotal = Math.max(0, lead.cartTotal ?? 0);
  const balanceDue = Math.max(0, cartTotal - amountPaid);

  const data: { amountDue: number; status?: string } = { amountDue: amountPaid };
  if (
    cartTotal > 0
    && amountPaid >= cartTotal
    && !["cancelado", "viajo"].includes(lead.status)
  ) {
    data.status = "reservado";
  }

  const updated = await db.lead.update({
    where: { id: leadId },
    data,
  });

  return {
    amountPaid,
    cartTotal,
    balanceDue,
    isFullyPaid: cartTotal > 0 && balanceDue <= 0,
    status: updated.status,
  };
}

/**
 * Si hay amountDue histórico sin filas en LeadPayment, crea un abono de migración
 * para no perder el monto ya registrado.
 *
 * Importante: en checkout con transferencia, `amountDue` es el monto A TRANSFERIR
 * (aún no pagado). No seedeamos esos leads ni estados pendientes.
 */
export async function ensurePaymentsSeededFromAmountDue(leadId: number): Promise<void> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const count = await db.leadPayment.count({ where: { leadId } });
  if (count > 0) return;

  // Nunca interpretar "pendiente" como pagado
  if (
    lead.status === "pendiente_transferencia"
    || lead.status === "pendiente_pago"
    || lead.status === "nuevo"
    || lead.status === "cancelado"
  ) {
    return;
  }

  // Carrito sin reserva confirmada: amountDue suele ser el cargo pendiente
  if (lead.source === "carrito" && lead.status !== "reservado" && lead.status !== "viajo") {
    return;
  }

  const paid = Math.max(0, lead.amountDue ?? 0);
  if (paid <= 0) return;

  await db.leadPayment.create({
    data: {
      leadId,
      amount: paid,
      paidAt: lead.createdAt,
      method: lead.paymentMethod || "transferencia",
      note: "Abono inicial (registrado antes del historial de pagos)",
    },
  });
}

export async function listLeadPayments(leadId: number): Promise<LeadPaymentRow[]> {
  await ensurePaymentsSeededFromAmountDue(leadId);
  return db.leadPayment.findMany({
    where: { leadId },
    orderBy: [{ paidAt: "asc" }, { id: "asc" }],
  });
}

export async function addLeadPayment(input: {
  leadId: number;
  amount: number;
  paidAt?: Date;
  method?: string;
  note?: string;
}): Promise<{ payment: LeadPaymentRow; summary: Awaited<ReturnType<typeof syncLeadPaidFromPayments>> }> {
  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El monto del abono debe ser mayor a 0");
  }

  await ensurePaymentsSeededFromAmountDue(input.leadId);

  const payment = await db.leadPayment.create({
    data: {
      leadId: input.leadId,
      amount,
      paidAt: input.paidAt ?? new Date(),
      method: (input.method || "transferencia").trim() || "transferencia",
      note: (input.note || "").trim(),
    },
  });

  const summary = await syncLeadPaidFromPayments(input.leadId);
  return { payment, summary };
}

export async function deleteLeadPayment(
  leadId: number,
  paymentId: number,
): Promise<Awaited<ReturnType<typeof syncLeadPaidFromPayments>>> {
  const existing = await db.leadPayment.findFirst({
    where: { id: paymentId, leadId },
  });
  if (!existing) throw new Error("Abono no encontrado");

  await db.leadPayment.delete({ where: { id: paymentId } });
  return syncLeadPaidFromPayments(leadId);
}

export async function updateLeadCartTotal(
  leadId: number,
  cartTotal: number,
): Promise<Awaited<ReturnType<typeof syncLeadPaidFromPayments>>> {
  const total = Math.max(0, Math.round(Number(cartTotal)) || 0);
  await db.lead.update({
    where: { id: leadId },
    data: { cartTotal: total },
  });
  await ensurePaymentsSeededFromAmountDue(leadId);
  return syncLeadPaidFromPayments(leadId);
}

export function paymentPanelSummary(input: {
  cartTotal: number;
  amountPaid: number;
  checkIn: string | null;
  status: string;
  paymentMethod: string | null;
  paymentPlan: string | null;
}) {
  return paymentSummary({
    cartTotal: input.cartTotal,
    amountPaid: input.amountPaid,
    paymentPlan: input.paymentPlan,
    paymentMethod: input.paymentMethod,
    status: input.status,
    checkIn: input.checkIn,
    expiresAt: null,
  });
}

export function checkInFromLeadCart(cartJson: string | null): string | null {
  return getFirstCartLineMeta(cartJson).checkIn;
}
