import { NextRequest, NextResponse } from "next/server";
import { createPayment, getPaymentProvider } from "@/lib/payments";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const provider = getPaymentProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "Pasarela no configurada. Define PAYMENT_PROVIDER y credenciales en .env" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const amount = Math.round(Number(body.amount));
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    const leadId = body.externalReference ? Number(body.externalReference) : NaN;

    const result = await createPayment({
      amount,
      email: body.email,
      externalReference: body.externalReference ? String(body.externalReference) : undefined,
      description: body.description,
      items: body.items,
      vatAmount: body.vatAmount != null ? Math.round(Number(body.vatAmount)) : undefined,
    });

    if (provider === "sumup" && result.paymentId && Number.isFinite(leadId)) {
      await db.lead.update({
        where: { id: leadId },
        data: { sumupCheckoutId: result.paymentId },
      }).catch(() => {});
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("[payments/create]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al crear pago" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const provider = getPaymentProvider();
  return NextResponse.json({ provider });
}
