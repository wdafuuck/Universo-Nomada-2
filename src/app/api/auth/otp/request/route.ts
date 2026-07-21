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
} from "@/lib/otp-auth";

import { guardPublicApi } from "@/lib/api-guard";
import { readJsonBody } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const blocked = guardPublicApi(request, { key: "otp-req", limit: 5, requireJson: true });
    if (blocked) return blocked;

    const parsed = await readJsonBody<{ email?: string }>(request);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    const email = normalizeEmail(parsed.data.email ?? "");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ingresa un correo v?lido" }, { status: 400 });
    }

    if (!rateLimit(`otp-email:${email}`, 3, 10 * 60_000)) {
      return NextResponse.json({ error: "Ya enviamos varios c?digos. Revisa tu bandeja o espera unos minutos." }, { status: 429 });
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
      subject: `${code} ? Tu c?digo Universo N?mada`,
      html,
      text,
    });

    if (!emailResult.ok) {
      if ("skipped" in emailResult && emailResult.skipped) {
        console.log(`[otp/dev] C?digo para ${email}: ${code}`);
      } else {
        console.error("[otp/request] email error:", "error" in emailResult ? emailResult.error : "unknown");
        return NextResponse.json({ error: "No pudimos enviar el correo. Intenta m?s tarde." }, { status: 500 });
      }
    }

    const devSkipped = !emailResult.ok && "skipped" in emailResult && emailResult.skipped;

    // Sin SMTP/Resend: en desarrollo igual permitimos continuar con el c?digo en consola/toast
    return NextResponse.json({
      ok: true,
      message: devSkipped
        ? "Modo desarrollo: revisa la consola del servidor o el toast con el c?digo"
        : "Te enviamos un c?digo a tu correo",
      devCode: devSkipped ? code : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[otp/request]", message, e);
    return NextResponse.json(
      { error: process.env.NODE_ENV !== "production" ? `Error al enviar c?digo: ${message}` : "Error al enviar c?digo" },
      { status: 500 },
    );
  }
}
