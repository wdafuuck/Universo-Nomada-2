import { parseCartJson } from "@/lib/cart-items";
import type { ReservationLineItem } from "@/lib/email/templates";
import { hoursUntil } from "@/lib/email/templates";

export type ReservationConfirmation = {
  leadId: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: "transferencia" | "sumup";
  paymentPlan: "total" | "deposito";
  amountPaid: number;
  cartTotal: number;
  balanceDue: number;
  expiresAt: string | null;
  hoursLeft: number | null;
  items: ReservationLineItem[];
  emailSent: boolean;
  emailConfigured: boolean;
};

type LeadRow = {
  id: number;
  nombre: string;
  email: string;
  paymentMethod: string | null;
  paymentPlan: string | null;
  cartTotal: number | null;
  amountDue: number | null;
  expiresAt: Date | null;
  cartJson: string | null;
  destino: string | null;
  confirmationEmailSentAt: Date | null;
};

export function isEmailConfigured(): boolean {
  if (process.env.RESEND_API_KEY?.trim()) return true;
  return Boolean(
    process.env.SMTP_HOST?.trim()
    && process.env.SMTP_USER?.trim()
    && process.env.SMTP_PASS?.trim(),
  );
}

export function leadToConfirmation(
  lead: LeadRow,
  emailSent = Boolean(lead.confirmationEmailSentAt),
): ReservationConfirmation {
  const items = parseCartJson(lead.cartJson);
  const fallbackItems: ReservationLineItem[] = items.length > 0 ? items : [{
    tourName: lead.destino ?? "Paquete Universo Nómada",
    passengers: 1,
    totalPrice: lead.cartTotal ?? lead.amountDue ?? 0,
  }];

  const cartTotal = lead.cartTotal ?? lead.amountDue ?? 0;
  const amountPaid = lead.amountDue ?? 0;
  const paymentPlan = lead.paymentPlan === "deposito" ? "deposito" : "total";
  const expiresAt = lead.expiresAt?.toISOString() ?? null;

  return {
    leadId: String(lead.id),
    customerName: lead.nombre,
    customerEmail: lead.email,
    paymentMethod: lead.paymentMethod === "transferencia" ? "transferencia" : "sumup",
    paymentPlan,
    amountPaid,
    cartTotal,
    balanceDue: Math.max(0, cartTotal - amountPaid),
    expiresAt,
    hoursLeft: expiresAt ? hoursUntil(expiresAt) : null,
    items: fallbackItems,
    emailSent,
    emailConfigured: isEmailConfigured(),
  };
}
