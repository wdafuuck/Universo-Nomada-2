import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/otp-auth";
import {
  findActiveRouletteSpin,
  getRouletteDiscount,
  isRouletteDiscountPrize,
  roulettePrizeLabel,
  type RoulettePrizeId,
} from "@/lib/roulette";

export async function GET(request: NextRequest) {
  try {
    const spinId = Number(request.nextUrl.searchParams.get("spinId"));
    const email = request.nextUrl.searchParams.get("email") ?? undefined;

    if (!Number.isFinite(spinId)) {
      return NextResponse.json({ error: "spinId inválido" }, { status: 400 });
    }

    const spin = await findActiveRouletteSpin(db, spinId, email);
    if (!spin) {
      return NextResponse.json({ active: false });
    }

    const prize = spin.prize as RoulettePrizeId;
    const discount = getRouletteDiscount(prize);

    return NextResponse.json({
      active: true,
      spinId: spin.id,
      prize,
      prizeLabel: roulettePrizeLabel(prize),
      expiresAt: spin.expiresAt.toISOString(),
      email: spin.email,
      nombre: spin.nombre,
      hasDiscount: isRouletteDiscountPrize(prize),
      discountType: discount?.type ?? null,
      discountValue: discount?.value ?? null,
    });
  } catch (e) {
    console.error("[roulette/status]", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const normalized = normalizeEmail(String(email ?? ""));
    if (!normalized) {
      return NextResponse.json({ active: false });
    }

    const spin = await db.rouletteSpin.findUnique({ where: { email: normalized } });
    if (!spin || spin.redeemed || spin.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ active: false });
    }

    const prize = spin.prize as RoulettePrizeId;
    const discount = getRouletteDiscount(prize);

    return NextResponse.json({
      active: true,
      spinId: spin.id,
      prize,
      prizeLabel: roulettePrizeLabel(prize),
      expiresAt: spin.expiresAt.toISOString(),
      email: spin.email,
      nombre: spin.nombre,
      hasDiscount: isRouletteDiscountPrize(prize),
      discountType: discount?.type ?? null,
      discountValue: discount?.value ?? null,
    });
  } catch (e) {
    console.error("[roulette/status]", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
