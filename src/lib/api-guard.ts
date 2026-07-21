import { NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hasJsonContentType, isAllowedOrigin } from "@/lib/security";

type GuardOpts = {
  /** Prefijo para rate limit, ej. "login" */
  key: string;
  limit?: number;
  windowMs?: number;
  /** Requiere Content-Type application/json */
  requireJson?: boolean;
  /** Valida Origin en producción */
  checkOrigin?: boolean;
};

/**
 * Guardia unificada para rutas API públicas.
 * Retorna NextResponse si debe bloquearse; null si puede continuar.
 */
export function guardPublicApi(request: Request, opts: GuardOpts): NextResponse | null {
  const ip = clientIp(request);
  const bucket = `${opts.key}:${ip}`;

  if (!rateLimit(bucket, opts.limit ?? 30, opts.windowMs ?? 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  if (opts.checkOrigin !== false && request.method !== "GET" && !isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  if (opts.requireJson && !hasJsonContentType(request)) {
    return NextResponse.json({ error: "Content-Type debe ser application/json" }, { status: 415 });
  }

  return null;
}

/** Guardia para rutas admin autenticadas — rate limit más estricto. */
export function guardAdminApi(request: Request, action = "admin"): NextResponse | null {
  const ip = clientIp(request);
  if (!rateLimit(`${action}:${ip}`, 120, 60_000)) {
    return NextResponse.json({ error: "Límite de solicitudes admin alcanzado" }, { status: 429 });
  }
  return null;
}
