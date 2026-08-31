import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";

/** Campo trampa: bots lo rellenan, humanos no lo ven. */
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** Respuesta silenciosa para bots (no revelar el honeypot). */
export function honeypotTrapResponse(): NextResponse {
  return NextResponse.json({ ok: true, message: "Recibido" }, { status: 200 });
}

export async function enforceBotProtection(opts: {
  honeypot?: unknown;
  turnstileToken?: string | null;
  ip?: string;
}): Promise<NextResponse | null> {
  if (isHoneypotTripped(opts.honeypot)) {
    return honeypotTrapResponse();
  }

  const turnstile = await verifyTurnstileToken(opts.turnstileToken, opts.ip);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.error }, { status: 403 });
  }

  return null;
}

const SCANNER_UA =
  /sqlmap|nikto|masscan|acunetix|netsparker|zgrab|gobuster|dirbuster|nmap|havij|wpscan/i;

/** Bloquea user-agents de escaneo en mutaciones API. */
export function isSuspiciousApiBot(request: Request): boolean {
  const ua = request.headers.get("user-agent")?.trim() ?? "";
  if (!ua) return true;
  return SCANNER_UA.test(ua);
}
