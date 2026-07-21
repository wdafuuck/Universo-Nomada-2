import type { CreatePaymentInput, CreatePaymentResult } from "./types";

export async function createSumUpPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const apiKey = process.env.SUMUP_API_KEY?.trim();
  const merchantCode = process.env.SUMUP_MERCHANT_CODE?.trim();
  if (!apiKey || !merchantCode) {
    throw new Error("SumUp no configurado (SUMUP_API_KEY y SUMUP_MERCHANT_CODE)");
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const ref = input.externalReference ?? `un-${Date.now()}`;
  const returnUrl = input.returnUrl ?? `${siteUrl}/api/payments/sumup/return?ref=${encodeURIComponent(ref)}`;

  const payload: Record<string, unknown> = {
    merchant_code: merchantCode,
    amount: input.amount,
    currency: input.currency ?? "CLP",
    checkout_reference: ref.slice(0, 64),
    description: (input.description ?? "Reserva Universo Nómada").slice(0, 255),
    redirect_url: returnUrl,
    hosted_checkout: { enabled: true },
  };

  if (input.vatAmount != null && input.vatAmount >= 0) {
    payload.vat_amount = input.vatAmount;
  }

  const res = await fetch("https://api.sumup.com/v0.1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[sumup]", err);
    throw new Error("Error al crear checkout SumUp");
  }

  const data = await res.json();
  const url = data.hosted_checkout_url as string | undefined;
  if (!url) throw new Error("SumUp no devolvió URL de pago");

  return { provider: "sumup", redirectUrl: url, paymentId: data.id };
}
