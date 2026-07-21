import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  "streetviewpixels-pa.googleapis.com",
  "maps.googleapis.com",
]);

/** Proxy same-origin para fotos de Google (evita bloqueos en móvil / CORP). */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("u");
  if (!raw) {
    return NextResponse.json({ error: "missing u" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { Accept: "image/*", "User-Agent": "UniversoNomada/1.0" },
      next: { revalidate: 86400 },
    });
    if (!upstream.ok || !upstream.body) {
      return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
