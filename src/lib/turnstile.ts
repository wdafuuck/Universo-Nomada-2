/** Cloudflare Turnstile — verificación anti-bot en servidor. */

export function isTurnstileEnabled(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
}

export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

type VerifyResult = { ok: true } | { ok: false; error: string };

export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<VerifyResult> {
  if (!isTurnstileEnabled()) return { ok: true };

  const response = token?.trim();
  if (!response) {
    return { ok: false, error: "Completa la verificación anti-bot antes de continuar." };
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response,
        remoteip: remoteIp,
      }),
    });

    const data = (await res.json()) as { success?: boolean };
    if (data.success) return { ok: true };

    return { ok: false, error: "Verificación anti-bot fallida. Recarga e intenta de nuevo." };
  } catch {
    return { ok: false, error: "No se pudo validar la verificación anti-bot." };
  }
}
