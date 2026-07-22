import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardPublicApi } from "@/lib/api-guard";
import { readJsonBody, sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { otpEmailHtml } from "@/lib/email/templates";
import {
  generateOtpCode,
  hashOtp,
  normalizeEmail,
  otpExpiresAt,
} from "@/lib/otp-auth";
import { ensureWelcomeDiscountCode, WELCOME_DISCOUNT_CODE } from "@/lib/welcome-discount";
import { notifyNewLead } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const blocked = guardPublicApi(request, { key: "welcome-signup", limit: 5, requireJson: true });
    if (blocked) return blocked;

    const parsed = await readJsonBody<{
      nombre?: string;
      email?: string;
      telefono?: string;
      referralCode?: string;
    }>(request);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const nombre = sanitizeText(parsed.data.nombre, 120);
    const email = normalizeEmail(sanitizeEmail(parsed.data.email) || "");
    const telefono = sanitizePhone(parsed.data.telefono);
    const referralCode = sanitizeText(parsed.data.referralCode, 40) || null;

    if (!nombre || !email || !telefono) {
      return NextResponse.json(
        { error: "Nombre, email y teléfono son obligatorios" },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        {
          error: "Usuario ya registrado",
          code: "already_registered",
          message: "Usuario ya registrado. Inicia sesión para ver tus beneficios.",
        },
        { status: 409 },
      );
    }

    if (!rateLimit(`otp-email:${email}`, 3, 10 * 60_000)) {
      return NextResponse.json(
        { error: "Ya enviamos varios códigos. Revisa tu bandeja o espera unos minutos." },
        { status: 429 },
      );
    }

    const discountCode = await ensureWelcomeDiscountCode(db);

    const lead = await db.lead.create({
      data: {
        nombre,
        email,
        telefono,
        mensaje: `[BIENVENIDA] Registro popup — código ${discountCode}`,
        source: "popup-bienvenida",
        referralCode,
        status: "nuevo",
      },
    });
    void notifyNewLead(lead);

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

    const devSkipped = !emailResult.ok && "skipped" in emailResult && emailResult.skipped;
    if (!emailResult.ok && !devSkipped) {
      console.error("[welcome-signup] email error:", "error" in emailResult ? emailResult.error : "unknown");
      return NextResponse.json(
        { error: "No pudimos enviar el correo. Intenta más tarde." },
        { status: 500 },
      );
    }

    if (devSkipped) {
      console.log(`[welcome-signup/dev] Código para ${email}: ${code}`);
    }

    return NextResponse.json({
      ok: true,
      needsOtp: true,
      discountCode,
      message: devSkipped
        ? "Modo desarrollo: revisa el toast o la consola con el código"
        : "Te enviamos un código a tu correo",
      devCode: devSkipped ? code : undefined,
    });
  } catch (e) {
    console.error("[welcome-signup]", e);
    return NextResponse.json({ error: "Error al registrarte" }, { status: 500 });
  }
}

/** Respuesta estática del código (por si el cliente lo pide tras OTP). */
export async function GET() {
  return NextResponse.json({
    code: WELCOME_DISCOUNT_CODE,
    percent: 5,
  });
}
