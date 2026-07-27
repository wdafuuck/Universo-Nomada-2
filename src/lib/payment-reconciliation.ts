import { db } from "@/lib/db";
import { getRequestTenantId } from "@/lib/tenant";

export type PaymentReconciliationRow = {
  paymentId: number;
  leadId: number;
  amount: number;
  method: string;
  externalId: string;
  paidAt: string;
  leadEmail: string;
  leadStatus: string;
  hasExternalId: boolean;
};

export type PaymentReconciliationReport = {
  tenantId: string;
  generatedAt: string;
  totals: {
    payments: number;
    amountSum: number;
    withExternalId: number;
    withoutExternalId: number;
  };
  rows: PaymentReconciliationRow[];
};

export async function buildPaymentReconciliationReport(
  request?: Request,
  limit = 200,
): Promise<PaymentReconciliationReport> {
  const tenantId = getRequestTenantId(request);
  const payments = await db.leadPayment.findMany({
    orderBy: { paidAt: "desc" },
    take: limit,
    include: {
      lead: { select: { id: true, email: true, status: true, tenantId: true } },
    },
  });

  const scoped = payments.filter((p) => p.lead.tenantId === tenantId);
  const rows: PaymentReconciliationRow[] = scoped.map((p) => ({
    paymentId: p.id,
    leadId: p.leadId,
    amount: p.amount,
    method: p.method,
    externalId: p.externalId || "",
    paidAt: p.paidAt.toISOString(),
    leadEmail: p.lead.email,
    leadStatus: p.lead.status,
    hasExternalId: Boolean(p.externalId?.trim()),
  }));

  const withExt = rows.filter((r) => r.hasExternalId).length;
  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    totals: {
      payments: rows.length,
      amountSum: rows.reduce((s, r) => s + r.amount, 0),
      withExternalId: withExt,
      withoutExternalId: rows.length - withExt,
    },
    rows,
  };
}
