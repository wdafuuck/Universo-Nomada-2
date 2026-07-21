import { NextRequest, NextResponse } from "next/server";

type PayItem = { title: string; quantity: number; unit_price: number; currency_id?: string };

/** Crea preferencia Checkout Pro de Mercado Pago (CLP). */
export async function POST(request: NextRequest) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "Mercado Pago no configurado. Agrega MERCADOPAGO_ACCESS_TOKEN al .env" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const email = typeof body.email === "string" ? body.email : undefined;
    const externalReference = body.externalReference ? String(body.externalReference) : undefined;

    let items: PayItem[] = Array.isArray(body.items)
      ? body.items
          .filter((i: PayItem) => i?.title && i.unit_price > 0)
          .map((i: PayItem) => ({
            title: String(i.title).slice(0, 256),
            quantity: Math.max(1, Number(i.quantity) || 1),
            unit_price: Math.round(Number(i.unit_price)),
            currency_id: "CLP",
          }))
      : [];

    if (!items.length) {
      const amount = Math.round(Number(body.amount));
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
      }
      items = [{
        title: body.title ?? "Reserva Universo Nómada",
        quantity: 1,
        unit_price: amount,
        currency_id: "CLP",
      }];
    }

    const webhookUrl = process.env.MERCADOPAGO_WEBHOOK_URL?.trim()
      || `${siteUrl}/api/payments/mercadopago/webhook`;

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        payer: email ? { email } : undefined,
        external_reference: externalReference,
        notification_url: webhookUrl,
        back_urls: {
          success: `${siteUrl}/?pago=ok`,
          failure: `${siteUrl}/?pago=error`,
          pending: `${siteUrl}/?pago=pendiente`,
        },
        auto_return: "approved",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[mercadopago]", err);
      return NextResponse.json({ error: "Error al crear pago" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
      id: data.id,
    });
  } catch {
    return NextResponse.json({ error: "Error al procesar pago" }, { status: 500 });
  }
}
