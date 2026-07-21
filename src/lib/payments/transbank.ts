import { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } from "transbank-sdk";
import type { CreatePaymentInput, CreatePaymentResult } from "./types";

function buildTransaction() {
  const commerceCode = process.env.TRANSBANK_COMMERCE_CODE?.trim();
  const apiKey = process.env.TRANSBANK_API_KEY?.trim();
  const env = process.env.TRANSBANK_ENV === "production" ? Environment.Production : Environment.Integration;

  if (commerceCode && apiKey) {
    return new WebpayPlus.Transaction(new Options(commerceCode, apiKey, env));
  }
  return WebpayPlus.Transaction.buildForIntegration(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
  );
}

export async function createTransbankPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const buyOrder = (input.externalReference ?? `UN${Date.now()}`).replace(/[^a-zA-Z0-9]/g, "").slice(0, 26);
  const sessionId = buyOrder;
  const amount = Math.round(input.amount);
  if (amount <= 0) throw new Error("Monto inválido");

  const tx = buildTransaction();
  const response = await tx.create(buyOrder, sessionId, amount, `${siteUrl}/api/payments/transbank/return`);

  const url = response.url;
  const token = response.token;
  if (!url || !token) throw new Error("Transbank no devolvió token");

  return {
    provider: "transbank",
    redirectUrl: url,
    paymentId: token,
  };
}

export async function commitTransbankPayment(token: string) {
  const tx = buildTransaction();
  return tx.commit(token);
}
