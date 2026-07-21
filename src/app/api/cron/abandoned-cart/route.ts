import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendAbandonedCartEmail } from "@/lib/email/abandoned-cart-email";
import { sendTransferDeadlineReminderEmail } from "@/lib/email/transfer-reminder-email";
import { sendGoogleReviewRequestEmail } from "@/lib/email/google-review-request-email";
import { parseCartJson } from "@/lib/cart-items";
import { findActiveRouletteSpinByEmail, type RoulettePrizeId } from "@/lib/roulette";

const HOUR_MS = 60 * 60 * 1000;

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

type StoredCart = {
  items?: { tourName: string; totalPrice: number; checkIn?: string }[];
};

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const cartRows = await db.cartAbandonment.findMany({
    where: { convertedAt: null },
  });

  let sentCart1 = 0;
  let sentCartPrize = 0;
  let sentCart24 = 0;
  let sentTransfer5h = 0;
  let sentReviewRequest = 0;

  for (const row of cartRows) {
    const age = now - row.createdAt.getTime();
    let cart: StoredCart = {};
    try {
      cart = JSON.parse(row.cartJson) as StoredCart;
    } catch {
      continue;
    }
    const items = cart.items ?? [];
    if (items.length === 0) continue;

    const baseParams = {
      to: row.email,
      nombre: row.nombre || "Viajero",
      telefono: row.telefono || undefined,
      cartItems: items,
      cartTotal: row.cartTotal,
    };

    if (!row.reminder1At && age >= HOUR_MS) {
      const result = await sendAbandonedCartEmail({ ...baseParams, reminder: 1 });
      if (result.ok) {
        await db.cartAbandonment.update({
          where: { id: row.id },
          data: { reminder1At: new Date() },
        });
        sentCart1++;
      }
      continue;
    }

    if (!row.reminderPrizeAt && age >= 5 * HOUR_MS) {
      const spin = await findActiveRouletteSpinByEmail(db, row.email);
      if (spin) {
        const result = await sendAbandonedCartEmail({
          ...baseParams,
          reminder: "prize",
          prizeId: spin.prize as RoulettePrizeId,
          prizeExpiresAt: spin.expiresAt,
        });
        if (result.ok) {
          await db.cartAbandonment.update({
            where: { id: row.id },
            data: { reminderPrizeAt: new Date() },
          });
          sentCartPrize++;
        }
      } else {
        await db.cartAbandonment.update({
          where: { id: row.id },
          data: { reminderPrizeAt: new Date() },
        });
      }
      continue;
    }

    if (row.reminder1At && !row.reminder2At && age >= 24 * HOUR_MS) {
      const result = await sendAbandonedCartEmail({ ...baseParams, reminder: 2 });
      if (result.ok) {
        await db.cartAbandonment.update({
          where: { id: row.id },
          data: { reminder2At: new Date() },
        });
        sentCart24++;
      }
    }
  }

  const transferLeads = await db.lead.findMany({
    where: {
      status: "pendiente_transferencia",
      paymentMethod: "transferencia",
      transferReminder5hAt: null,
    },
  });

  for (const lead of transferLeads) {
    const age = now - lead.createdAt.getTime();
    if (age < 5 * HOUR_MS) continue;
    if (!lead.expiresAt || lead.expiresAt.getTime() <= now) continue;

    const email = lead.email?.trim();
    if (!email || email === "carrito@universonomada.cl") continue;

    const items = parseCartJson(lead.cartJson);
    const emailItems = items.length > 0
      ? items
      : [{
          tourName: lead.destino ?? "Paquete Universo Nómada",
          passengers: 1,
          totalPrice: lead.cartTotal ?? lead.amountDue ?? 0,
        }];

    const result = await sendTransferDeadlineReminderEmail({
      to: email,
      customerName: lead.nombre,
      telefono: lead.telefono,
      leadId: String(lead.id),
      amountDue: lead.amountDue ?? 0,
      expiresAt: lead.expiresAt.toISOString(),
      items: emailItems,
    });

    if (result.ok) {
      await db.lead.update({
        where: { id: lead.id },
        data: { transferReminder5hAt: new Date() },
      });
      sentTransfer5h++;
    }
  }

  const threeDaysAgo = new Date(now - 3 * 24 * HOUR_MS);
  const reviewLeads = await db.lead.findMany({
    where: {
      googleReviewRequestAt: null,
      OR: [
        { status: "viajó" },
        { tripEndDate: { lte: threeDaysAgo } },
      ],
    },
    take: 20,
  });

  for (const lead of reviewLeads) {
    const email = lead.email?.trim();
    if (!email || email === "carrito@universonomada.cl") continue;
    if (lead.tripEndDate && lead.tripEndDate.getTime() > threeDaysAgo.getTime() && lead.status !== "viajó") {
      continue;
    }

    const result = await sendGoogleReviewRequestEmail({
      to: email,
      customerName: lead.nombre,
      destination: lead.destino ?? undefined,
    });

    if (result.ok) {
      await db.lead.update({
        where: { id: lead.id },
        data: { googleReviewRequestAt: new Date() },
      });
      sentReviewRequest++;
    }
  }

  return NextResponse.json({
    ok: true,
    processedCarts: cartRows.length,
    processedTransfers: transferLeads.length,
    processedReviewRequests: reviewLeads.length,
    sentCart1,
    sentCartPrize,
    sentCart24,
    sentTransfer5h,
    sentReviewRequest,
  });
}
