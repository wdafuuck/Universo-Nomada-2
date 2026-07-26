import { createMercadoPagoPayment } from "./mercadopago";
import { createSumUpPayment } from "./sumup";
import { createTransbankPayment } from "./transbank";
import {
  getPaymentProvider,
  resolveCardPaymentProvider,
  type CreatePaymentInput,
  type CreatePaymentResult,
} from "./types";

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const fromItems = resolveCardPaymentProvider(input.items);
  const forced = input.provider;
  const fallback = getPaymentProvider();

  let provider: "sumup" | "transbank" | "mercadopago" | null = null;
  if (forced === "sumup" || forced === "mercadopago" || forced === "transbank") {
    provider = forced;
  } else if (fromItems) {
    provider = fromItems;
  } else {
    provider = fallback;
  }

  if (!provider) {
    throw new Error("Ninguna pasarela configurada. Configura SumUp y/o Mercado Pago en .env");
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

export {
  getPaymentProvider,
  listConfiguredCardProviders,
  resolveCardPaymentProvider,
  taxSummary,
} from "./types";
export type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentItem,
  CardPaymentProvider,
} from "./types";
