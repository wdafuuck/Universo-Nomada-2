import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth-session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashOtp, normalizeEmail, MAX_ATTEMPTS } from "@/lib/otp-auth";
import { sendEmail } from "@/lib/email/send";
import { welcomeDiscountEmailHtml } from "@/lib/email/templates";
import {
  ensureWelcomeDiscountCode,
  WELCOME_DISCOUNT_PERCENT,
} from "@/lib/welcome-discount";

async function findExistingUser(email: string) {
  const exact = await db.user.findUnique({ where: { email } });
  if (exact) return exact;

  const linked = await db.lead.findFirst({
    where: { email, userId: { not: null } },
    select: { userId: true },
  });
  if (linked?.userId) {
    return db.user.findUnique({ where: { id: linked.userId } });
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    if (!rateLimit(`otp-verify:${ip}`, 15, 60_000)) {
      return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
    }

    const body = (await request.json()) as {
      email?: string;
      code?: string;
      name?: string;
      welcomeDiscount?: boolean;
    };
    const email = normalizeEmail(body.email ?? "");
    const code = String(body.code ?? "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    const otp = await db.emailOtp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!otp || otp.expiresAt < new Date()) {
      return NextResponse.json({ error: "Código expirado. Solicita uno nuevo." }, { status: 401 });
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Demasiados intentos. Solicita un nuevo código." }, { status: 401 });
    }

    const valid = otp.codeHash === hashOtp(code, email);
    if (!valid) {
      await db.emailOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "Código incorrecto" }, { status: 401 });
    }

    await db.emailOtp.deleteMany({ where: { email } });

    let user = await findExistingUser(email);
    const isNewUser = !user;
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: body.name?.trim() || null,
          role: "user",
        },
      });
    } else if (body.name?.trim() && !user.name) {
      user = await db.user.update({
        where: { id: user.id },
        data: { name: body.name.trim() },
      });
    }

    await db.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    await db.lead.updateMany({
      where: { email, userId: null },
      data: { userId: user.id },
    });

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "user",
    };
    await setSessionCookie(sessionUser);

    let discountCode: string | undefined;
    if (body.welcomeDiscount && isNewUser) {
      discountCode = await ensureWelcomeDiscountCode(db);
      const { html, text } = welcomeDiscountEmailHtml({
        name: user.name,
        code: discountCode,
        percent: WELCOME_DISCOUNT_PERCENT,
      });
      // No await: en móvil el correo hacía timeout y mostraba "error al verificar"
      void sendEmail({
        to: email,
        subject: `Tu ${WELCOME_DISCOUNT_PERCENT}% de descuento — código ${discountCode}`,
        html,
        text,
      }).then((sent) => {
        if (!sent.ok) {
          console.error(
            "[otp/verify] welcome discount email failed:",
            "error" in sent ? sent.error : "unknown",
          );
        }
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Sesión iniciada",
      user: sessionUser,
      discountCode,
    });
  } catch (e) {
    console.error("[otp/verify]", e);
    return NextResponse.json({ error: "Error al verificar código" }, { status: 500 });
  }
}
