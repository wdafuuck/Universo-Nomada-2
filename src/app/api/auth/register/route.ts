import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`register:${clientIp(request)}`, 10, 60_000)) {
      return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son obligatorios" },
        { status: 400 },
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 409 },
      );
    }

    const hashedPassword = await hashPassword(String(password));

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const role = adminEmail && normalizedEmail === adminEmail ? "admin" : "user";

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name || null,
        password: hashedPassword,
        role,
      },
    });

    return NextResponse.json(
      {
        message: "Cuenta creada exitosamente",
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 },
    );
  }
}
