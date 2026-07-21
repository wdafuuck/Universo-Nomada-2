/** Validación centralizada de variables de entorno — producción lista. */

export type EnvValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

const REQUIRED_PROD = ["DATABASE_URL", "SESSION_SECRET", "NEXT_PUBLIC_SITE_URL"] as const;

const RECOMMENDED_PROD = [
  "CRON_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "GOOGLE_PLACES_API_KEY",
] as const;

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET es obligatorio en producción (mínimo 32 caracteres aleatorios). " +
        "Genera uno con: openssl rand -base64 48",
    );
  }

  const dev = process.env.SESSION_SECRET?.trim() || "dev-only-session-secret-no-usar-en-prod";
  console.warn("[env] SESSION_SECRET débil o ausente — solo válido en desarrollo.");
  return dev;
}

export function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === "production") {
    console.error("[env] CRON_SECRET no definido — el cron de emails no funcionará.");
  }
  return secret ?? null;
}

export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    for (const key of REQUIRED_PROD) {
      if (!process.env[key]?.trim()) errors.push(`${key} es obligatorio en producción.`);
    }

    const session = process.env.SESSION_SECRET?.trim();
    if (session && session.length < 32) {
      errors.push("SESSION_SECRET debe tener al menos 32 caracteres en producción.");
    }

    for (const key of RECOMMENDED_PROD) {
      if (!process.env[key]?.trim()) warnings.push(`${key} no configurado — algunas funciones quedarán limitadas.`);
    }

    const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
    if (dbUrl.startsWith("file:")) {
      errors.push("DATABASE_URL no puede ser SQLite en producción. Usa PostgreSQL.");
    }
  } else {
    if (!process.env.DATABASE_URL?.trim()) {
      warnings.push("DATABASE_URL no definido — inicia PostgreSQL con: docker compose up -d");
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/** Lanza en producción si el entorno no es válido. */
export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  const result = validateEnv();
  for (const w of result.warnings) console.warn(`[env] ${w}`);
  if (!result.ok) {
    throw new Error(`Entorno inválido:\n${result.errors.map((e) => `  - ${e}`).join("\n")}`);
  }
}
