import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-session";
import { buildPaymentReconciliationReport } from "@/lib/payment-reconciliation";
import { isFeatureEnabled } from "@/lib/feature-flags";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!isFeatureEnabled("paymentReconciliation")) {
    return NextResponse.json({ error: "Feature deshabilitada" }, { status: 403 });
  }

  const report = await buildPaymentReconciliationReport(request);
  return NextResponse.json(report);
}
