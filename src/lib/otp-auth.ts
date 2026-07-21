import { createHash, randomInt } from "node:crypto";
import { getSessionSecret } from "@/lib/env";
import { normalizeEmail } from "@/lib/normalize-email";

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

export { MAX_ATTEMPTS };
