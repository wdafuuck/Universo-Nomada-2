import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth-session";
import { normalizeEmail } from "@/lib/otp-auth";
import { totalPassengers } from "@/lib/tour-pricing";
import { guardPublicApi } from "@/lib/api-guard";
import { taxSummary, type PaymentItem } from "@/lib/payments";
import { notifyNewLead } from "@/lib/notify";
import { BANK_TRANSFER } from "@/lib/bank-transfer";
import { buildReservationItems, sendTransferConfirmationEmail } from "@/lib/email/reservation-emails";
import { leadToConfirmation } from "@/lib/reservation-confirmation";
import { checkOutFromCheckIn } from "@/lib/tour-duration";
import {
  calculateDepositAmount,
  calculateVatAmount,
  canUseDepositForCart,
  chargeAmount,
  normalizeCartItems,
  transferExpiresAt,
  type CartLineInput,
} from "@/lib/checkout";
import { resolveDiscountCodeForEmail, toAppliedDiscount } from "@/lib/discount-codes";
import {
  applyRouletteDiscount,
  findActiveRouletteSpin,
  isRouletteDiscountPrize,
  isRouletteGiftPrize,
  roulettePrizeLabel,
  type RoulettePrizeId,
} from "@/lib/roulette";

type CheckoutBody = {
  items: CartLineInput[];
  contact?: { nombre?: string; email?: string; telefono?: string };
  referralCode?: string;
  discountCode?: string;
  rouletteSpinId?: number;
  rouletteGiftTour?: string;
  paymentMethod?: "sumup" | "transferencia";
  paymentPlan?: "total" | "deposito";
};

export async function POST(request: NextRequest) {
  try {
    const blocked = guardPublicApi(request, { key: "cart", limit: 6, requireJson: true });
    if (blocked) return blocked;

    const body = (await request.json()) as CheckoutBody;
    const {
      items: rawItems,
      contact,
      referralCode,
      discountCode: rawDiscountCode,
      rouletteSpinId: rawRouletteSpinId,
      rouletteGiftTour,
      paymentMethod = "sumup",
      paymentPlan = "total",
    } = body;

    if (!rawItems?.length) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    const items = normalizeCartItems(rawItems);

    if (paymentMethod !== "sumup" && paymentMethod !== "transferencia") {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
    }

    const tourIds = [...new Set(items.map((i) => i.tourId))];
    const tours = await db.tour.findMany({ where: { tourId: { in: tourIds } } });
    const taxByTour = Object.fromEntries(tours.map((t) => [t.tourId, t.taxType ?? "exento"]));
    const durationByTour = Object.fromEntries(tours.map((t) => [t.tourId, t.duration ?? ""]));
    const depositTours = tours.map((t) => ({
      tourId: t.tourId,
      minDepositPerPerson: t.minDepositPerPerson ?? 0,
    }));

    const cartTotal = items.reduce((s, i) => s + i.totalPrice, 0);

    let discountAmount = 0;
    let discountedTotal = cartTotal;
    let appliedDiscountCode: string | null = null;
    let rouletteSpinId: number | null = null;
    let roulettePrize: RoulettePrizeId | null = null;
    let rouletteGiftTourName: string | null = rouletteGiftTour?.trim() || null;

    const contactEmail = contact?.email?.trim();
    const spinId = Number(rawRouletteSpinId);

    if (Number.isFinite(spinId) && spinId > 0 && contactEmail) {
      const spin = await findActiveRouletteSpin(db, spinId, contactEmail);
      if (spin) {
        const prize = spin.prize as RoulettePrizeId;
        rouletteSpinId = spin.id;
        roulettePrize = prize;

        if (isRouletteDiscountPrize(prize)) {
          const applied = applyRouletteDiscount(cartTotal, prize);
          if (applied && applied.discountAmount > 0) {
            discountAmount = applied.discountAmount;
            discountedTotal = applied.discountedTotal;
          }
        }

        if (prize === "tour_regalo" && !rouletteGiftTourName) {
          const giftFromCart = items.find(
            (i) => (i as { rouletteGiftTourName?: string }).rouletteGiftTourName,
          ) as { rouletteGiftTourName?: string } | undefined;
          rouletteGiftTourName = giftFromCart?.rouletteGiftTourName?.trim() || null;
        }

        if (prize === "no_luck") {
          roulettePrize = null;
          rouletteSpinId = null;
        }
      }
    }

    if (!roulettePrize && rawDiscountCode?.trim()) {
      const resolved = await resolveDiscountCodeForEmail(
        db,
        String(rawDiscountCode),
        contactEmail || null,
      );
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: resolved.status === 404 ? 400 : resolved.status });
      }
      const applied = toAppliedDiscount(resolved.row, cartTotal);
      if (applied.discountAmount <= 0) {
        return NextResponse.json({ error: "Este código no aplica a tu carrito" }, { status: 400 });
      }
      discountAmount = applied.discountAmount;
      discountedTotal = applied.discountedTotal;
      appliedDiscountCode = applied.code;
    }

    const depositAmount = calculateDepositAmount(items, depositTours);
    const canDeposit = canUseDepositForCart(items) && depositAmount > 0 && depositAmount < discountedTotal;

    if (paymentPlan === "deposito" && !canDeposit) {
      return NextResponse.json(
        { error: "La reserva con abono mínimo no está disponible para este viaje (menos de 2 semanas de anticipación o monto no configurado)." },
        { status: 400 },
      );
    }

    const amount = chargeAmount(discountedTotal, paymentPlan, depositAmount);
    if (amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    const paymentItems: PaymentItem[] = items.map((item) => ({
      title: item.tourName,
      quantity: 1,
      unit_price: item.totalPrice,
      taxType: (taxByTour[item.tourId] === "afecto" ? "afecto" : "exento") as "exento" | "afecto",
    }));

    const vatAmount = calculateVatAmount(paymentItems, amount, discountedTotal);
    const taxLine = taxSummary(paymentItems);
    const planLabel = paymentPlan === "deposito"
      ? `Abono mínimo: $${amount.toLocaleString("es-CL")} (saldo $${(discountedTotal - amount).toLocaleString("es-CL")} antes del viaje)`
      : `Pago total: $${amount.toLocaleString("es-CL")}`;

    const summary = items.map((item) => {
      const pax = totalPassengers(item.passengers);
      const dates = item.checkIn && item.checkOut ? ` (${item.checkIn} → ${item.checkOut})` : "";
      const hotel = item.accommodationName ? ` | ${item.accommodationName}` : "";
      const tax = taxByTour[item.tourId] ?? "exento";
      return `${item.tourName}${dates}${hotel} — ${pax} pax, ${item.roomLabel}, ${item.totalPrice.toLocaleString("es-CL")} CLP [${tax}]`;
    }).join("\n");

    const expiresAt = paymentMethod === "transferencia" ? transferExpiresAt() : null;
    const status = paymentMethod === "transferencia" ? "pendiente_transferencia" : "nuevo";

    const storedItems = items.map((item) => {
      const duration = durationByTour[item.tourId] || undefined;
      const checkOut =
        item.checkOut ||
        (item.checkIn && duration ? checkOutFromCheckIn(item.checkIn, duration) : undefined);
      return { ...item, duration, checkOut };
    });

    const session = getSessionFromRequest(request);
    let userId: string | undefined;
    if (session) {
      userId = session.id;
    } else if (contactEmail) {
      const existingUser = await db.user.findUnique({ where: { email: normalizeEmail(contactEmail) } });
      userId = existingUser?.id;
    }

    const lead = await db.lead.create({
      data: {
        userId: userId ?? null,
        nombre: contact?.nombre ?? "Reserva carrito",
        email: contact?.email ?? "carrito@universonomada.cl",
        telefono: contact?.telefono ?? "pendiente",
        destino: items.map((i) => i.tourName).join(", "),
        mensaje: [
          `[CARRITO] ${paymentMethod.toUpperCase()} · ${paymentPlan.toUpperCase()}`,
          summary,
          "",
          `[TRIBUTARIO] ${taxLine}`,
          paymentMethod === "sumup" ? `[SUMUP IVA] $${vatAmount.toLocaleString("es-CL")} CLP (boleta automática SII)` : "",
          planLabel,
          appliedDiscountCode
            ? `[DESCUENTO] Código ${appliedDiscountCode}: -$${discountAmount.toLocaleString("es-CL")} (total reserva: $${discountedTotal.toLocaleString("es-CL")})`
            : "",
          roulettePrize && discountAmount > 0
            ? `[RULETA] ${roulettePrizeLabel(roulettePrize)}: -$${discountAmount.toLocaleString("es-CL")}`
            : "",
          roulettePrize && isRouletteGiftPrize(roulettePrize)
            ? `[RULETA REGALO] ${roulettePrizeLabel(roulettePrize)}${rouletteGiftTourName ? `: ${rouletteGiftTourName}` : ""}`
            : "",
          paymentMethod === "transferencia" && expiresAt
            ? `[TRANSFERENCIA] Plazo: ${BANK_TRANSFER.transferDeadlineHours}h hasta ${expiresAt.toLocaleString("es-CL")}`
            : "",
        ].filter(Boolean).join("\n"),
        source: "carrito",
        referralCode: referralCode || null,
        discountCode: appliedDiscountCode,
        discountAmount: discountAmount > 0 ? discountAmount : null,
        rouletteSpinId,
        roulettePrize,
        rouletteGiftTour: rouletteGiftTourName,
        status,
        paymentMethod,
        paymentPlan,
        cartTotal: discountedTotal,
        amountDue: amount,
        expiresAt,
        cartJson: JSON.stringify(storedItems),
      },
    });

    if (rouletteSpinId) {
      await db.rouletteSpin.update({
        where: { id: rouletteSpinId },
        data: { redeemed: true, leadId: lead.id },
      });
    }

    const customerEmail = contact?.email?.trim().toLowerCase();
    if (customerEmail && customerEmail !== "carrito@universonomada.cl") {
      await db.cartAbandonment.updateMany({
        where: { email: customerEmail, convertedAt: null },
        data: { convertedAt: new Date() },
      }).catch(() => {});
    }

    void notifyNewLead({ ...lead, source: "carrito" });

    const reservationItems = buildReservationItems(items);
    let emailSent = false;

    if (paymentMethod === "transferencia" && customerEmail && customerEmail !== "carrito@universonomada.cl") {
      const emailResult = await sendTransferConfirmationEmail({
        to: customerEmail,
        customerName: contact?.nombre ?? "Viajero",
        leadId: String(lead.id),
        amountDue: amount,
        cartTotal: discountedTotal,
        paymentPlan,
        expiresAt: expiresAt!.toISOString(),
        items: reservationItems,
        roulettePrize: roulettePrize ?? undefined,
        rouletteGiftTour: rouletteGiftTourName ?? undefined,
      });
      emailSent = emailResult.ok;
      if (emailResult.ok) {
        await db.lead.update({
          where: { id: lead.id },
          data: { confirmationEmailSentAt: new Date() },
        });
      } else if (!emailResult.skipped) {
        console.error("[cart/checkout] email error:", emailResult.error);
      }
    }

    const confirmation = leadToConfirmation(
      { ...lead, confirmationEmailSentAt: emailSent ? new Date() : lead.confirmationEmailSentAt },
      emailSent,
    );

    const base = {
      ok: true,
      leadId: String(lead.id),
      confirmation,
      paymentItems,
      cartTotal: discountedTotal,
      originalCartTotal: cartTotal,
      discountAmount,
      discountCode: appliedDiscountCode,
      amount,
      vatAmount,
      paymentMethod,
      paymentPlan,
      taxLine,
      emailSent,
    };

    if (paymentMethod === "transferencia") {
      return NextResponse.json({
        ...base,
        transfer: {
          expiresAt: expiresAt!.toISOString(),
          bank: BANK_TRANSFER,
          proofMailto: `mailto:${BANK_TRANSFER.email}`,
          proofWhatsApp: BANK_TRANSFER.whatsapp,
        },
      });
    }

    return NextResponse.json(base);
  } catch (e) {
    console.error("[cart/checkout]", e);
    return NextResponse.json({ error: "Error al procesar reserva" }, { status: 500 });
  }
}
