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
};

export type CreatePaymentResult = {
  provider: "sumup" | "transbank" | "mercadopago";
  redirectUrl: string;
  paymentId?: string;
};

export function getPaymentProvider(): "sumup" | "transbank" | "mercadopago" | null {
  const p = (process.env.PAYMENT_PROVIDER ?? "").trim().toLowerCase();
  if (p === "sumup" || p === "transbank" || p === "mercadopago") return p;
  if (process.env.SUMUP_API_KEY?.trim()) return "sumup";
  if (process.env.TRANSBANK_COMMERCE_CODE?.trim()) return "transbank";
  if (process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()) return "mercadopago";
  return null;
}

export function taxSummary(items: PaymentItem[]): string {
  const exento = items.filter((i) => i.taxType !== "afecto").reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const afecto = items.filter((i) => i.taxType === "afecto").reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const lines: string[] = [];
  if (exento > 0) lines.push(`Exento: $${exento.toLocaleString("es-CL")} CLP`);
  if (afecto > 0) lines.push(`Afecto (IVA en boleta): $${afecto.toLocaleString("es-CL")} CLP`);
  return lines.join(" · ") || "Sin desglose tributario";
}
