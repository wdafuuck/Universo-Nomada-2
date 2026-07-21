import { describe, expect, it, vi } from "vitest";
import { escapeHtml, sanitizeEmail, sanitizeText, isScannerPath } from "@/lib/security";
import { validateEnv } from "@/lib/env";
import { googleReviews } from "@/lib/google-reviews";

describe("security", () => {
  it("escapeHtml neutraliza tags", () => {
    expect(escapeHtml('<script>alert("x")</script>')).not.toContain("<script>");
  });

  it("sanitizeText limita longitud", () => {
    expect(sanitizeText("a".repeat(100), 10)).toHaveLength(10);
  });

  it("sanitizeEmail valida formato", () => {
    expect(sanitizeEmail("hola@universonomada.cl")).toBe("hola@universonomada.cl");
    expect(sanitizeEmail("no-es-email")).toBe("");
  });

  it("isScannerPath bloquea rutas de escaneo", () => {
    expect(isScannerPath("/.env")).toBe(true);
    expect(isScannerPath("/api/health")).toBe(false);
  });
});

describe("env", () => {
  it("validateEnv exige PostgreSQL en producción", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "file:./prisma/dev.db");
    vi.stubEnv("SESSION_SECRET", "x".repeat(40));
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://universonomada.cl");

    const result = validateEnv();
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("SQLite"))).toBe(true);

    vi.unstubAllEnvs();
  });
});

describe("google-reviews fallback", () => {
  it("solo contiene reseñas con nombre y texto reales", () => {
    for (const r of googleReviews) {
      expect(r.name.length).toBeGreaterThan(2);
      expect(r.text.length).toBeGreaterThan(20);
      expect(r.name).not.toBe("Cliente verificado");
    }
  });
});
