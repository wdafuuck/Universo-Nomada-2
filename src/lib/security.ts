import { SITE_URL } from "@/lib/site-url";

const HTML_ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapa HTML en strings de usuario antes de emails/plantillas. */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c] ?? c);
}

/** Limpia strings: trim, longitud máxima, quita caracteres de control. */
export function sanitizeText(input: unknown, maxLen = 500): string {
  if (input == null) return "";
  return String(input)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function sanitizeEmail(input: unknown): string {
  const email = sanitizeText(input, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
}

export function sanitizePhone(input: unknown): string {
  return sanitizeText(input, 30).replace(/[^\d+\s()-]/g, "");
}

/** Bloquea rutas típicas de escaneo automatizado. */
const SCANNER_PATTERNS = [
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/wp-admin/i,
  /^\/wp-login/i,
  /^\/wp-content/i,
  /^\/xmlrpc\.php/i,
  /^\/phpmyadmin/i,
  /^\/admin\.php/i,
  /^\/cgi-bin/i,
  /^\/vendor\/phpunit/i,
];

export function isScannerPath(pathname: string): boolean {
  return SCANNER_PATTERNS.some((p) => p.test(pathname));
}

const ALLOWED_ORIGINS = new Set([
  SITE_URL,
  "http://localhost:3001",
  "http://127.0.0.1:3001",
]);

/** Valida Origin/Referer en mutaciones sensibles (producción). */
export function isAllowedOrigin(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const origin = request.headers.get("origin")?.trim();
  const referer = request.headers.get("referer")?.trim();

  if (origin) {
    try {
      const u = new URL(origin);
      return ALLOWED_ORIGINS.has(u.origin) || u.hostname.endsWith(".vercel.app");
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const u = new URL(referer);
      return ALLOWED_ORIGINS.has(u.origin) || u.hostname.endsWith(".vercel.app");
    } catch {
      return false;
    }
  }

  return false;
}

export function hasJsonContentType(request: Request): boolean {
  const ct = request.headers.get("content-type") ?? "";
  return ct.includes("application/json");
}

const MAX_BODY_BYTES = 512_000; // 500 KB

export async function readJsonBody<T>(request: Request): Promise<{ data: T } | { error: string; status: number }> {
  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > MAX_BODY_BYTES) {
    return { error: "Cuerpo de solicitud demasiado grande", status: 413 };
  }

  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return { error: "Cuerpo de solicitud demasiado grande", status: 413 };
    }
    const data = JSON.parse(raw) as T;
    return { data };
  } catch {
    return { error: "JSON inválido", status: 400 };
  }
}
