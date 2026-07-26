import { NextRequest, NextResponse } from "next/server";
import {
  createPayment,
  getPaymentProvider,
  listConfiguredCardProviders,
  resolveCardPaymentProvider,
  type PaymentItem,
} from "@/lib/payments";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const available = listConfiguredCardProviders();
  if (available.length === 0 && !getPaymentProvider()) {
    return NextResponse.json(
      { error: "Pasarela no configurada. Define credenciales SumUp y/o Mercado Pago en .env" },
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
    if (!Number.isFinite(leadId)) {
      return NextResponse.json({ error: "Referencia de reserva inválida" }, { status: 400 });
    }

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const expected = Math.max(0, lead.amountDue ?? lead.cartTotal ?? 0);
    const cartTotal = Math.max(0, lead.cartTotal ?? 0);
    if (amount !== expected && amount !== cartTotal) {
      return NextResponse.json(
        { error: "El monto no coincide con la reserva" },
        { status: 400 },
      );
    }

    const email = String(body.email ?? lead.email ?? "").trim();
    if (email && lead.email && email.toLowerCase() !== lead.email.toLowerCase()) {
      return NextResponse.json({ error: "Email no coincide con la reserva" }, { status: 400 });
    }

    const items = Array.isArray(body.items) ? (body.items as PaymentItem[]) : undefined;
    const requested =
      body.provider === "sumup" || body.provider === "mercadopago" || body.provider === "transbank"
        ? body.provider
        : lead.paymentMethod === "sumup" || lead.paymentMethod === "mercadopago"
          ? lead.paymentMethod
          : undefined;

    const result = await createPayment({
      amount,
      email: email || lead.email,
      externalReference: String(leadId),
      description: body.description,
      items,
      vatAmount: body.vatAmount != null ? Math.round(Number(body.vatAmount)) : undefined,
      provider: requested,
    });

    await db.lead.update({
      where: { id: leadId },
      data: {
        paymentMethod: result.provider,
        ...(result.provider === "sumup" && result.paymentId
          ? { sumupCheckoutId: result.paymentId }
          : {}),
      },
    }).catch(() => {});

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
  const providers = listConfiguredCardProviders();
  const defaultProvider = getPaymentProvider();
  return NextResponse.json({
    provider: defaultProvider,
    providers,
    /** Regla de negocio documentada para el frontend */
    routing: {
      exento: "sumup",
      afecto: "mercadopago",
    },
    resolveExample: resolveCardPaymentProvider([
      { title: "demo", quantity: 1, unit_price: 1, taxType: "exento" },
    ]),
  });
}
