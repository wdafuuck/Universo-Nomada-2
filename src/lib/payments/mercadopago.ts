import type { CreatePaymentInput, CreatePaymentResult } from "./types";

export async function createMercadoPagoPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("Mercado Pago no configurado");

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const items = input.items?.length
    ? input.items.map((i) => ({
        title: i.title.slice(0, 256),
        quantity: Math.max(1, i.quantity),
        unit_price: Math.round(i.unit_price),
        currency_id: "CLP",
      }))
    : [{
        title: input.description ?? "Reserva Universo Nómada",
        quantity: 1,
        unit_price: Math.round(input.amount),
        currency_id: "CLP",
      }];

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items,
      payer: input.email ? { email: input.email } : undefined,
      external_reference: input.externalReference,
      notification_url: process.env.MERCADOPAGO_WEBHOOK_URL?.trim()
        || `${siteUrl}/api/payments/mercadopago/webhook`,
      back_urls: {
        success: `${siteUrl}/?pago=ok`,
        failure: `${siteUrl}/?pago=error`,
        pending: `${siteUrl}/?pago=pendiente`,
      },
      auto_return: "approved",
    }),
  });

  if (!res.ok) {
    console.error("[mercadopago]", await res.text());
    throw new Error("Error al crear pago Mercado Pago");
  }

  const data = await res.json();
  const redirectUrl = data.init_point ?? data.sandbox_init_point;
  if (!redirectUrl) throw new Error("Mercado Pago sin URL");

  return { provider: "mercadopago", redirectUrl, paymentId: data.id };
}
