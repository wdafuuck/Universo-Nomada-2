import { createMercadoPagoPayment } from "./mercadopago";
import { createSumUpPayment } from "./sumup";
import { createTransbankPayment } from "./transbank";
import { getPaymentProvider, type CreatePaymentInput, type CreatePaymentResult } from "./types";

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const provider = getPaymentProvider();
  if (!provider) {
    throw new Error("Ninguna pasarela configurada. Usa PAYMENT_PROVIDER=sumup|transbank|mercadopago");
  }

  switch (provider) {
    case "sumup":
      return createSumUpPayment(input);
    case "transbank":
      return createTransbankPayment(input);
    case "mercadopago":
      return createMercadoPagoPayment(input);
  }
}

export { getPaymentProvider, taxSummary } from "./types";
export type { CreatePaymentInput, CreatePaymentResult, PaymentItem } from "./types";
