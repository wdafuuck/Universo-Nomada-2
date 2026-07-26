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

/**
 * SumUp → cobros exentos (internacionales).
 * Mercado Pago → cobros afectos (IVA).
 * Carrito mixto: gana el mayor monto; empate → SumUp si hay exento.
 */
export function resolveCardPaymentProvider(
  items: PaymentItem[] | undefined | null,
): CardPaymentProvider | null {
  const configured = listConfiguredCardProviders();
  if (configured.length === 0) return null;
  if (configured.length === 1) return configured[0];

  const list = items ?? [];
  let exento = 0;
  let afecto = 0;
  for (const i of list) {
    const total = Math.max(0, (i.unit_price || 0) * (i.quantity || 0));
    if (i.taxType === "afecto") afecto += total;
    else exento += total;
  }

  if (afecto > 0 && exento <= 0) {
    return configured.includes("mercadopago") ? "mercadopago" : configured[0];
  }
  if (exento > 0 && afecto <= 0) {
    return configured.includes("sumup") ? "sumup" : configured[0];
  }

  if (afecto > exento) {
    return configured.includes("mercadopago") ? "mercadopago" : configured[0];
  }
  return configured.includes("sumup") ? "sumup" : configured[0];
}

export function taxSummary(items: PaymentItem[]): string {
  const exento = items.filter((i) => i.taxType !== "afecto").reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const afecto = items.filter((i) => i.taxType === "afecto").reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const lines: string[] = [];
  if (exento > 0) lines.push(`Exento: $${exento.toLocaleString("es-CL")} CLP`);
  if (afecto > 0) lines.push(`Afecto (IVA en boleta): $${afecto.toLocaleString("es-CL")} CLP`);
  return lines.join(" · ") || "Sin desglose tributario";
}
