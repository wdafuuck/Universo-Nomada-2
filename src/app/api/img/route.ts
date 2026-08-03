import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { isAllowedPublicImagePath } from "@/lib/image-optimize";

export const runtime = "nodejs";

/**
 * Optimiza /uploads y /images on-the-fly (WebP).
 * GET /api/img?src=/uploads/foo.jpg&w=1200&q=75
 */
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src")?.trim() ?? "";
  const wRaw = Number(request.nextUrl.searchParams.get("w") ?? "1200");
  const qRaw = Number(request.nextUrl.searchParams.get("q") ?? "75");
  const width = Number.isFinite(wRaw) ? Math.min(Math.max(Math.round(wRaw), 64), 1920) : 1200;
  const quality = Number.isFinite(qRaw) ? Math.min(Math.max(Math.round(qRaw), 40), 90) : 75;

  if (!isAllowedPublicImagePath(src)) {
    return NextResponse.json({ error: "src inválido" }, { status: 400 });
  }

  let filePath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
  try {
    await stat(filePath);
  } catch {
    if (src.startsWith("/uploads/")) {
      const uploadRoot =
        process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "public", "uploads");
      filePath = path.join(uploadRoot, path.basename(src));
    }
  }

  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  try {
    const sharp = (await import("sharp")).default;
    const raw = await readFile(filePath);
    const data = await sharp(raw)
      .rotate()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        Vary: "Accept",
      },
    });
  } catch (e) {
    console.error("[api/img]", e);
    return NextResponse.json({ error: "Error al optimizar" }, { status: 500 });
  }
}
