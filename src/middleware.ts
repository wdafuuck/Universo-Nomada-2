import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isScannerPath } from "@/lib/security";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isScannerPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // Bloquea acceso directo a uploads ejecutables
  if (pathname.startsWith("/uploads/") && /\.(php|exe|sh|bat|js|html)$/i.test(pathname)) {
    return new NextResponse(null, { status: 403 });
  }

  const response = NextResponse.next();

  // Refuerzo por request (complementa next.config headers)
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.delete("X-Powered-By");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|manifest.json|images/).*)"],
};
