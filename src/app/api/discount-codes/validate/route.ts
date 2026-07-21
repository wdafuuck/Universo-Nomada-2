import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { findValidDiscountCode, toAppliedDiscount } from "@/lib/discount-codes";

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`discount-validate:${clientIp(request)}`, 30, 60_000)) {
      return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
    }

    const { code, cartTotal } = await request.json();
    const total = Number(cartTotal);
    if (!code?.trim() || !Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: "Código o monto inválido" }, { status: 400 });
    }

    const row = await findValidDiscountCode(db, String(code));
    if (!row) {
      return NextResponse.json({ error: "Código inválido o expirado" }, { status: 404 });
    }

    const applied = toAppliedDiscount(row, total);
    if (applied.discountAmount <= 0) {
      return NextResponse.json({ error: "Este código no aplica a tu carrito" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, discount: applied });
  } catch (e) {
    console.error("[discount-codes/validate]", e);
    return NextResponse.json({ error: "Error al validar código" }, { status: 500 });
  }
}
