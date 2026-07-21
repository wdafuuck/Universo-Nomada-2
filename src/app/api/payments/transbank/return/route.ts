import { NextRequest, NextResponse } from "next/server";
import { commitTransbankPayment } from "@/lib/payments/transbank";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token_ws")
    ?? (await request.formData().catch(() => null))?.get("token_ws")?.toString();

  if (!token) {
    return NextResponse.redirect(`${siteUrl()}/?pago=error`);
  }

  try {
    const result = await commitTransbankPayment(token);
    const buyOrder = result.buy_order as string | undefined;
    const approved = result.response_code === 0;

    const leadId = buyOrder ? Number(buyOrder) : NaN;
    if (Number.isFinite(leadId)) {
      await db.lead.updateMany({
        where: { id: leadId },
        data: { status: approved ? "pagado" : "pendiente_pago" },
      }).catch(() => {});
    }

    return NextResponse.redirect(`${siteUrl()}/?pago=${approved ? "ok" : "error"}`);
  } catch {
    return NextResponse.redirect(`${siteUrl()}/?pago=error`);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
