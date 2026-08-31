import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { guardPublicApi } from "@/lib/api-guard";
import { clientIp } from "@/lib/rate-limit";
import { enforceBotProtection } from "@/lib/bot-guard";
import { readJsonBody, sanitizeEmail, sanitizeText } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const blocked = guardPublicApi(request, { key: "register", limit: 10, requireJson: true });
    if (blocked) return blocked;

    const parsed = await readJsonBody<{
      name?: string;
      email?: string;
      password?: string;
      turnstileToken?: string;
      _hp?: string;
    }>(request);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const botBlocked = await enforceBotProtection({
      honeypot: parsed.data._hp,
      turnstileToken: parsed.data.turnstileToken,
      ip,
    });
    if (botBlocked) return botBlocked;

    const { name, email: rawEmail, password } = parsed.data;

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son obligatorios" },
        { status: 400 },
      );
    }

    const email = sanitizeEmail(rawEmail);
    if (!email) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 },
      );
    }

    const normalizedEmail = email;
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
        name: sanitizeText(name, 120) || null,
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
