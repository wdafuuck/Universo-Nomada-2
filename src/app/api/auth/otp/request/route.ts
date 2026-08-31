import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { otpEmailHtml } from "@/lib/email/templates";
import {
  generateOtpCode,
  hashOtp,
  normalizeEmail,
  otpExpiresAt,
  resolveOtpDelivery,
} from "@/lib/otp-auth";

import { guardPublicApi } from "@/lib/api-guard";
import { readJsonBody } from "@/lib/security";
import { enforceBotProtection } from "@/lib/bot-guard";
import { clientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const blocked = guardPublicApi(request, { key: "otp-req", limit: 5, requireJson: true });
    if (blocked) return blocked;

    const parsed = await readJsonBody<{ email?: string; turnstileToken?: string; _hp?: string }>(request);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const botBlocked = await enforceBotProtection({
      honeypot: parsed.data._hp,
      turnstileToken: parsed.data.turnstileToken,
      ip: clientIp(request),
    });
    if (botBlocked) return botBlocked;

    const email = normalizeEmail(parsed.data.email ?? "");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ingresa un correo válido" }, { status: 400 });
    }

    if (!rateLimit(`otp-email:${email}`, 3, 10 * 60_000)) {
      return NextResponse.json(
        { error: "Ya enviamos varios códigos. Revisa tu bandeja o espera unos minutos." },
        { status: 429 },
      );
    }

    const code = generateOtpCode();
    const expiresAt = otpExpiresAt();

    await db.emailOtp.deleteMany({ where: { email } });
    await db.emailOtp.create({
      data: {
        email,
        codeHash: hashOtp(code, email),
        expiresAt,
      },
    });

    const { html, text } = otpEmailHtml(code);
    const emailResult = await sendEmail({
      to: email,
      subject: `${code} — Tu código Universo Nómada`,
      html,
      text,
    });

    const delivery = resolveOtpDelivery(emailResult, code, email, "otp/request");
    if (!delivery.ok) {
      return NextResponse.json({ error: delivery.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: delivery.message,
      devCode: delivery.devCode,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[otp/request]", message, e);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV !== "production"
            ? `Error al enviar código: ${message}`
            : "Error al enviar código",
      },
      { status: 500 },
    );
  }
}
