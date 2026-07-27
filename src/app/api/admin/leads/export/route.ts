import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { getRequestTenantId } from "@/lib/tenant";

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenantId = getRequestTenantId(request);
  const leads = await db.lead.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { email: true, name: true } },
      payments: { select: { amount: true, method: true, paidAt: true, externalId: true } },
    },
  });

  const header = [
    "id",
    "createdAt",
    "nombre",
    "email",
    "telefono",
    "destino",
    "status",
    "source",
    "cartTotal",
    "amountPaid",
    "paymentMethod",
    "assignedTo",
    "paymentsCount",
    "paymentsSum",
  ];

  const rows = leads.map((l) => {
    const paySum = l.payments.reduce((s, p) => s + p.amount, 0);
    return [
      l.id,
      l.createdAt.toISOString(),
      l.nombre,
      l.email,
      l.telefono,
      l.destino ?? "",
      l.status,
      l.source,
      l.cartTotal ?? "",
      l.amountDue ?? "",
      l.paymentMethod ?? "",
      l.assignedTo?.email ?? "",
      l.payments.length,
      paySum,
    ]
      .map(csvEscape)
      .join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${tenantId}.csv"`,
    },
  });
}
