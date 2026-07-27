import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isScannerPath } from "@/lib/security";

function isSensitiveUploadPath(pathname: string): boolean {
  return /\.(pdf|doc|docx|xls|xlsx|zip|rar|7z|csv)$/i.test(pathname.split("?")[0]);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isScannerPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname.startsWith("/uploads/") && /\.(php|exe|sh|bat|js|html)$/i.test(pathname)) {
    return new NextResponse(null, { status: 403 });
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
