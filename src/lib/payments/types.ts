export type PaymentItem = {
  title: string;
  quantity: number;
  unit_price: number;
  taxType?: "exento" | "afecto";
};

export type CreatePaymentInput = {
  amount: number;
  currency?: string;
  email?: string;
  externalReference?: string;
  description?: string;
  items?: PaymentItem[];
  returnUrl?: string;
  vatAmount?: number;
  /** Si se omite, se elige según taxType del carrito o PAYMENT_PROVIDER. */
  provider?: "sumup" | "transbank" | "mercadopago";
};

export type CreatePaymentResult = {
  provider: "sumup" | "transbank" | "mercadopago";
  redirectUrl: string;
  paymentId?: string;
};

export type CardPaymentProvider = "sumup" | "mercadopago";

export type CartTaxHint = "exento" | "afecto" | "mixto";

function hasSumUp(): boolean {
  return Boolean(process.env.SUMUP_API_KEY?.trim() && process.env.SUMUP_MERCHANT_CODE?.trim());
}

function hasMercadoPago(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
}

function hasTransbank(): boolean {
  return Boolean(process.env.TRANSBANK_COMMERCE_CODE?.trim());
}

/** Provider único forzado por env (compatibilidad). */
export function getPaymentProvider(): "sumup" | "transbank" | "mercadopago" | null {
  const p = (process.env.PAYMENT_PROVIDER ?? "").trim().toLowerCase();
  if (p === "sumup" || p === "transbank" || p === "mercadopago") return p;
  if (hasSumUp()) return "sumup";
  if (hasTransbank()) return "transbank";
  if (hasMercadoPago()) return "mercadopago";
  return null;
}

export function listConfiguredCardProviders(): CardPaymentProvider[] {
  const out: CardPaymentProvider[] = [];
  if (hasSumUp()) out.push("sumup");
  if (hasMercadoPago()) out.push("mercadopago");
  return out;
}

export function cartTaxHint(items: PaymentItem[] | undefined | null): CartTaxHint {
  const list = items ?? [];
  const hasAfecto = list.some((i) => i.taxType === "afecto");
  const hasExento = list.some((i) => i.taxType !== "afecto");
  if (hasAfecto && !hasExento) return "afecto";
  if (hasExento && !hasAfecto) return "exento";
  if (hasAfecto && hasExento) return "mixto";
  return "exento";
}

/**
 * Nacional (afecto): SumUp y Mercado Pago — el cliente elige.
 * Internacional (exento) o mixto con exento: solo SumUp (cobros exentos).
 */
export function allowedCardProviders(
  items: PaymentItem[] | undefined | null,
): CardPaymentProvider[] {
  const configured = listConfiguredCardProviders();
  if (configured.length === 0) return [];

  const hint = cartTaxHint(items);
  if (hint === "afecto") {
    return configured;
  }

  // Internacional / mixto: solo SumUp (exento)
  if (configured.includes("sumup")) return ["sumup"];
  return configured.slice(0, 1);
}

/**
 * Default cuando el cliente no elige:
 * nacional → Mercado Pago si está, si no SumUp;
 * internacional → SumUp.
 */
export function resolveCardPaymentProvider(
  items: PaymentItem[] | undefined | null,
): CardPaymentProvider | null {
  const allowed = allowedCardProviders(items);
  if (allowed.length === 0) return null;
  if (allowed.length === 1) return allowed[0];

  const hint = cartTaxHint(items);
  if (hint === "afecto") {
    return allowed.includes("mercadopago") ? "mercadopago" : allowed[0];
  }
  return allowed.includes("sumup") ? "sumup" : allowed[0];
}

export function isCardProviderAllowed(
  provider: string | null | undefined,
  items: PaymentItem[] | undefined | null,
): provider is CardPaymentProvider {
  if (provider !== "sumup" && provider !== "mercadopago") return false;
  return allowedCardProviders(items).includes(provider);
}

export function taxSummary(items: PaymentItem[]): string {
  const exento = items.filter((i) => i.taxType !== "afecto").reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const afecto = items.filter((i) => i.taxType === "afecto").reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const lines: string[] = [];
  if (exento > 0) lines.push(`Exento: $${exento.toLocaleString("es-CL")} CLP`);
  if (afecto > 0) lines.push(`Afecto (IVA en boleta): $${afecto.toLocaleString("es-CL")} CLP`);
  return lines.join(" · ") || "Sin desglose tributario";
}
