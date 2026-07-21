import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`abandon:${clientIp(request)}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { email, nombre, telefono, items, cartTotal } = body;

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (email === "carrito@universonomada.cl") {
      return NextResponse.json({ ok: true, skipped: true });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    const cartJson = JSON.stringify({ items, cartTotal: cartTotal ?? 0 });

    await db.cartAbandonment.upsert({
      where: { email: email.trim().toLowerCase() },
      create: {
        email: email.trim().toLowerCase(),
        nombre: nombre?.trim() ?? "",
        telefono: telefono?.trim() ?? "",
        cartJson,
        cartTotal: Number(cartTotal) || 0,
      },
      update: {
        nombre: nombre?.trim() ?? "",
        telefono: telefono?.trim() ?? "",
        cartJson,
        cartTotal: Number(cartTotal) || 0,
        convertedAt: null,
        reminder1At: null,
        reminderPrizeAt: null,
        reminder2At: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[cart/abandon-track]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
