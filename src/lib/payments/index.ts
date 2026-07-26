import { createMercadoPagoPayment } from "./mercadopago";
import { createSumUpPayment } from "./sumup";
import { createTransbankPayment } from "./transbank";
import {
  allowedCardProviders,
  getPaymentProvider,
  resolveCardPaymentProvider,
  type CreatePaymentInput,
  type CreatePaymentResult,
} from "./types";

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const allowed = allowedCardProviders(input.items);
  const fromItems = resolveCardPaymentProvider(input.items);
  const forced = input.provider;
  const fallback = getPaymentProvider();

  let provider: "sumup" | "transbank" | "mercadopago" | null = null;
  if (forced === "transbank") {
    provider = "transbank";
  } else if (forced === "sumup" || forced === "mercadopago") {
    if (allowed.length > 0 && !allowed.includes(forced)) {
      throw new Error(
        forced === "mercadopago"
          ? "Mercado Pago no disponible para viajes internacionales (exentos). Usa SumUp."
          : "Pasarela no permitida para este carrito",
      );
    }
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
  allowedCardProviders,
  cartTaxHint,
  isCardProviderAllowed,
  resolveCardPaymentProvider,
  taxSummary,
} from "./types";
export type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentItem,
  CardPaymentProvider,
  CartTaxHint,
} from "./types";
