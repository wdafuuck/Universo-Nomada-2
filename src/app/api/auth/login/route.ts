import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth-session";
import { guardPublicApi } from "@/lib/api-guard";
import { clientIp } from "@/lib/rate-limit";
import { checkLoginLockout, clearLoginLockout, recordLoginFailure } from "@/lib/auth-lockout";
import { readJsonBody, sanitizeEmail } from "@/lib/security";
import { enforceBotProtection } from "@/lib/bot-guard";
import { hashPassword, isLegacyPasswordHash, verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const blocked = guardPublicApi(request, { key: "login", limit: 15, requireJson: true });
    if (blocked) return blocked;

    const parsed = await readJsonBody<{
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

    const { email: rawEmail, password } = parsed.data;

    const email = sanitizeEmail(rawEmail);
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const lock = checkLoginLockout(email, ip);
    if (lock.locked) {
      return NextResponse.json(
        { error: "Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo." },
        { status: 429, headers: { "Retry-After": String(lock.retryAfterSec) } },
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      const fail = recordLoginFailure(email, ip);
      if (fail.locked) {
        return NextResponse.json(
          { error: "Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo." },
          { status: 429, headers: { "Retry-After": String(fail.retryAfterSec) } },
        );
      }
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    const ok = await verifyPassword(String(password), user.password);
    if (!ok) {
      const fail = recordLoginFailure(email, ip);
      if (fail.locked) {
        return NextResponse.json(
          { error: "Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo." },
          { status: 429, headers: { "Retry-After": String(fail.retryAfterSec) } },
        );
      }
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    clearLoginLockout(email, ip);

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
