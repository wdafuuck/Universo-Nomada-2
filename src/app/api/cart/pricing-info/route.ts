import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  calculateDepositAmount,
  canUseDepositForCart,
  chargeAmount,
  normalizeCartItems,
  type CartLineInput,
} from "@/lib/checkout";
import { resolveDiscountCodeForEmail, toAppliedDiscount } from "@/lib/discount-codes";
import {
  applyRouletteDiscount,
  findActiveRouletteSpin,
  isRouletteDiscountPrize,
  type RoulettePrizeId,
} from "@/lib/roulette";

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`cart-pricing:${clientIp(request)}`, 20, 60_000)) {
      return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
    }

    const { items, discountCode, rouletteSpinId, contactEmail } = await request.json();
    if (!items?.length) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    const cartItems = normalizeCartItems(items as CartLineInput[]);
    const tourIds = [...new Set(cartItems.map((i) => i.tourId))];
    const tours = await db.tour.findMany({
      where: { tourId: { in: tourIds } },
      select: { tourId: true, minDepositPerPerson: true },
    });

    const cartTotal = cartItems.reduce((s, i) => s + i.totalPrice, 0);

    let discountAmount = 0;
    let discountedTotal = cartTotal;
    let appliedCode: string | null = null;
    let roulettePrize: string | null = null;
    let rouletteDiscountAmount = 0;

    const spinId = Number(rouletteSpinId);
    if (Number.isFinite(spinId) && spinId > 0) {
      const spin = await findActiveRouletteSpin(
        db,
        spinId,
        contactEmail ? String(contactEmail) : undefined,
      );
      if (spin && isRouletteDiscountPrize(spin.prize as RoulettePrizeId)) {
        const applied = applyRouletteDiscount(cartTotal, spin.prize as RoulettePrizeId);
        if (applied && applied.discountAmount > 0) {
          roulettePrize = spin.prize;
          rouletteDiscountAmount = applied.discountAmount;
          discountAmount = applied.discountAmount;
          discountedTotal = applied.discountedTotal;
        }
      }
    }

    if (!roulettePrize && discountCode?.trim()) {
      const resolved = await resolveDiscountCodeForEmail(
        db,
        String(discountCode),
        contactEmail ? String(contactEmail) : null,
      );
      if (resolved.ok) {
        const applied = toAppliedDiscount(resolved.row, cartTotal);
        discountAmount = applied.discountAmount;
        discountedTotal = applied.discountedTotal;
        appliedCode = applied.code;
      }
    }

    const depositAmount = calculateDepositAmount(cartItems, tours);
    const reservationTotal = discountedTotal;
    const canUseDeposit =
      canUseDepositForCart(cartItems) && depositAmount > 0 && depositAmount < reservationTotal;

    return NextResponse.json({
      cartTotal,
      discountedTotal,
      discountAmount,
      discountCode: appliedCode,
      roulettePrize,
      rouletteDiscountAmount,
      depositAmount,
      canUseDeposit,
      chargeTotal: chargeAmount(reservationTotal, "total", depositAmount),
      chargeDeposit: chargeAmount(reservationTotal, "deposito", depositAmount),
    });
  } catch (e) {
    console.error("[cart/pricing-info]", e);
    return NextResponse.json({ error: "Error al calcular montos" }, { status: 500 });
  }
}
