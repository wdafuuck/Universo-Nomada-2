import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isScannerPath } from "@/lib/security";
import { isSuspiciousApiBot } from "@/lib/bot-guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function isSensitiveUploadPath(pathname: string): boolean {
  return /\.(pdf|doc|docx|xls|xlsx|zip|rar|7z|csv)$/i.test(pathname.split("?")[0]);
}

/** Rutas API exentas del rate limit global (webhooks, cron, health). */
function isApiRateLimitExempt(pathname: string): boolean {
  if (pathname === "/api/health") return true;
  if (pathname.startsWith("/api/cron/")) return true;
  if (pathname === "/api/payments/mercadopago/webhook") return true;
  if (pathname === "/api/payments/sumup/return") return true;
  if (pathname === "/api/payments/transbank/return") return true;
  return false;
}

function apiRateLimitResponse(ip: string, pathname: string): NextResponse | null {
  if (!pathname.startsWith("/api/") || isApiRateLimitExempt(pathname)) return null;

  const isAdmin = pathname.startsWith("/api/admin/");
  const bucket = isAdmin ? `api-admin:${ip}` : `api-global:${ip}`;
  const limit = isAdmin ? 180 : 120;

  if (!rateLimit(bucket, limit, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isScannerPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname.startsWith("/uploads/") && /\.(php|exe|sh|bat|js|html)$/i.test(pathname)) {
    return new NextResponse(null, { status: 403 });
  }

  const limited = apiRateLimitResponse(clientIp(request), pathname);
  if (limited) return limited;

  if (
    pathname.startsWith("/api/") &&
    !isApiRateLimitExempt(pathname) &&
    (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") &&
    isSuspiciousApiBot(request)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // PDF/docs → API Node (firma o sesión). Evita crypto en Edge.
  if (pathname.startsWith("/uploads/") && isSensitiveUploadPath(pathname)) {
    const rel = pathname.replace(/^\/+/, "");
    if (rel.includes("..")) {
      return new NextResponse(null, { status: 400 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/api/secure-file";
    url.searchParams.set("path", rel);
    // Conserva exp/sig si venían en la URL original
    return NextResponse.rewrite(url);
  }

  const response = NextResponse.next();
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.delete("X-Powered-By");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|manifest.json|images/).*)"],
};
