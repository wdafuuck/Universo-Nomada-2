import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildReservationItems, sendCardConfirmationEmail } from "@/lib/email/reservation-emails";
import type { RoulettePrizeId } from "@/lib/roulette";
import { parseCartJson } from "@/lib/email/cart-json";
import { getSumUpCheckoutById, getSumUpCheckoutByReference, isSumUpCheckoutPaid } from "@/lib/payments/sumup-status";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

async function trySendCardEmail(leadId: number) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.confirmationEmailSentAt) return;
  if (lead.paymentMethod !== "sumup") return;

  const email = lead.email?.trim();
  if (!email || email === "carrito@universonomada.cl") return;

  const parsedItems = parseCartJson(lead.cartJson);
  const items = parsedItems.length > 0
    ? parsedItems
    : [{
        tourName: lead.destino ?? "Paquete Universo Nómada",
        passengers: 1,
        totalPrice: lead.cartTotal ?? lead.amountDue ?? 0,
      }];

  const result = await sendCardConfirmationEmail({
    to: email,
    customerName: lead.nombre,
    leadId: String(lead.id),
    amountPaid: lead.amountDue ?? 0,
    cartTotal: lead.cartTotal ?? lead.amountDue ?? 0,
    paymentPlan: (lead.paymentPlan === "deposito" ? "deposito" : "total"),
    items,
    roulettePrize: (lead.roulettePrize as RoulettePrizeId | null) ?? undefined,
    rouletteGiftTour: lead.rouletteGiftTour ?? undefined,
  });

  if (result.ok) {
    await db.lead.update({
      where: { id: leadId },
      data: {
        confirmationEmailSentAt: new Date(),
        status: lead.status === "nuevo" ? "reservado" : lead.status,
      },
    });
  }
}

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  const redirect = `${siteUrl()}/reserva/confirmacion?reserva=${ref}&pago=ok`;

  if (!ref) {
    return NextResponse.redirect(redirect);
  }

  const leadId = Number(ref);
  if (!Number.isFinite(leadId)) {
    return NextResponse.redirect(`${siteUrl()}/?pago=error`);
  }

  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.redirect(`${siteUrl()}/?pago=error`);
    }

    let checkout = lead.sumupCheckoutId
      ? await getSumUpCheckoutById(lead.sumupCheckoutId)
      : null;

    if (!isSumUpCheckoutPaid(checkout)) {
      checkout = await getSumUpCheckoutByReference(ref);
    }

    if (isSumUpCheckoutPaid(checkout)) {
      await db.lead.update({
        where: { id: leadId },
        data: { status: "reservado" },
      });
      void trySendCardEmail(leadId);
    } else {
      // Pago aún no confirmado en SumUp — igual mostramos pantalla de reserva pendiente
      console.warn("[sumup/return] checkout not paid yet for lead", leadId);
    }
  } catch (e) {
    console.error("[sumup/return]", e);
  }

  return NextResponse.redirect(redirect);
}

export async function POST(request: NextRequest) {
  /** Permite reenviar email de tarjeta si el pago ya fue confirmado (p. ej. desde la web). */
  try {
    const { leadId } = await request.json();
    const id = Number(leadId);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "leadId inválido" }, { status: 400 });
    }

    const checkout = await getSumUpCheckoutByReference(String(id));
    if (!isSumUpCheckoutPaid(checkout)) {
      return NextResponse.json({ error: "Pago no confirmado aún" }, { status: 400 });
    }

    await trySendCardEmail(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
