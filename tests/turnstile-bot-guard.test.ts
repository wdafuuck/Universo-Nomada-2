import { describe, expect, it, vi, afterEach } from "vitest";
import { isHoneypotTripped, honeypotTrapResponse } from "@/lib/bot-guard";
import { isTurnstileEnabled, verifyTurnstileToken } from "@/lib/turnstile";

describe("bot-guard", () => {
  it("detecta honeypot relleno", () => {
    expect(isHoneypotTripped("")).toBe(false);
    expect(isHoneypotTripped("spam")).toBe(true);
  });

  it("honeypot devuelve 200 silencioso", async () => {
    const res = honeypotTrapResponse();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

describe("turnstile", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("deshabilitado sin keys — pasa verificación", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    expect(isTurnstileEnabled()).toBe(false);
    const result = await verifyTurnstileToken(undefined);
    expect(result.ok).toBe(true);
  });

  it("habilitado sin token — rechaza", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-test");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-test");
    expect(isTurnstileEnabled()).toBe(true);
    const result = await verifyTurnstileToken("");
    expect(result.ok).toBe(false);
  });
});
