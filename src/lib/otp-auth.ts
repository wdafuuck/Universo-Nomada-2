import { createHash, randomInt } from "node:crypto";
import { getSessionSecret } from "@/lib/env";
import { normalizeEmail } from "@/lib/normalize-email";
import type { SendEmailResult } from "@/lib/email/send";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutos
const MAX_ATTEMPTS = 5;

function secret() {
  return getSessionSecret();
}

export { normalizeEmail };

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export function hashOtp(code: string, email: string): string {
  return createHash("sha256").update(`${code}:${normalizeEmail(email)}:${secret()}`).digest("hex");
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

/** Si el correo falla, devolver el OTP en la respuesta (toast) mientras Resend/SMTP no funcionan. */
export function allowOtpCodeInResponse(): boolean {
  return process.env.OTP_RETURN_CODE_ON_EMAIL_FAIL === "true";
}

export function resolveOtpDelivery(
  emailResult: SendEmailResult,
  code: string,
  email: string,
  logPrefix: string,
):
  | { ok: false; error: string }
  | { ok: true; message: string; devCode?: string } {
  const skipped = !emailResult.ok && "skipped" in emailResult && Boolean(emailResult.skipped);
  const failed = !emailResult.ok && !skipped;

  if (failed && !allowOtpCodeInResponse()) {
    console.error(`[${logPrefix}] email error:`, "error" in emailResult ? emailResult.error : "unknown");
    return { ok: false, error: "No pudimos enviar el correo. Intenta más tarde." };
  }

  const showCode = skipped || (failed && allowOtpCodeInResponse());
  if (showCode) {
    console.log(`[${logPrefix}] Código OTP para ${email}: ${code}`);
  }
  if (failed && showCode) {
    console.warn(`[${logPrefix}] Correo falló; código mostrado en cliente (OTP_RETURN_CODE_ON_EMAIL_FAIL)`);
  }

  return {
    ok: true,
    message: showCode
      ? failed
        ? "No pudimos enviar el correo. Usa el código que aparece en pantalla."
        : "Revisa el toast o la consola con el código"
      : "Te enviamos un código a tu correo",
    devCode: showCode ? code : undefined,
  };
}

export { MAX_ATTEMPTS };
