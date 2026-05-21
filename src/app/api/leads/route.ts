import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

// Bots fill every input on the page. Humans never see this field
// (hidden in CSS), so a non-empty value is a strong spam signal.
const HONEYPOT_FIELD = "_website";

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Silent honeypot: don't tell the bot we rejected it.
    if (body && body[HONEYPOT_FIELD]) {
      return NextResponse.json({ message: "ok" }, { status: 201 });
    }

    // 5 submissions per IP per minute.
    const ip = getClientIp(request);
    const rate = checkRateLimit(`lead:${ip}`, 5, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Demasiados intentos. Vuelve a intentar en unos segundos." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
      );
    }

    const { nombre, email, telefono, destino, mensaje } = body;

    if (!nombre || !email || !telefono) {
      return NextResponse.json(
        { error: "Nombre, email y teléfono son obligatorios" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "El email no es válido" }, { status: 400 });
    }

    const phoneDigits = String(telefono).replace(/\D/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return NextResponse.json(
        { error: "El teléfono no es válido (mín. 7, máx. 15 dígitos)" },
        { status: 400 },
      );
    }

    const lead = await db.lead.create({
      data: {
        nombre,
        email,
        telefono,
        destino: destino || null,
        mensaje: mensaje || null,
      },
    });

    return NextResponse.json(
      { message: "Cotización solicitada exitosamente", lead },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 },
    );
  }
}
