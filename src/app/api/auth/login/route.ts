import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth-session";
import { guardPublicApi } from "@/lib/api-guard";
import { readJsonBody, sanitizeEmail } from "@/lib/security";
import { hashPassword, isLegacyPasswordHash, verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const blocked = guardPublicApi(request, { key: "login", limit: 20, requireJson: true });
    if (blocked) return blocked;

    const parsed = await readJsonBody<{ email?: string; password?: string }>(request);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    const { email: rawEmail, password } = parsed.data;

    const email = sanitizeEmail(rawEmail);
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    const ok = await verifyPassword(String(password), user.password);
    if (!ok) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    if (isLegacyPasswordHash(user.password)) {
      await db.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(String(password)) },
      });
    }

    const sessionUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    await setSessionCookie(sessionUser);

    return NextResponse.json({
      message: "Inicio de sesión exitoso",
      user: sessionUser,
    });
  } catch {
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
