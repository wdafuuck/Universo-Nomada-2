import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { isAllowedPublicImagePath } from "@/lib/image-optimize";
import {
  contentTypeFromExt,
  getImgCacheDir,
  isValidWebpBuffer,
  resolvePublicImagePath,
} from "@/lib/public-image-path";

export const runtime = "nodejs";

function cacheKey(src: string, width: number, quality: number, mtimeMs: number): string {
  return createHash("sha1")
    .update(`${src}|${width}|${quality}|${mtimeMs}`)
    .digest("hex");
}

async function serveOriginal(filePath: string, sourceStat: Awaited<ReturnType<typeof stat>>) {
  const raw = await readFile(filePath);
  const ext = path.extname(filePath);
  return new NextResponse(new Uint8Array(raw), {
    status: 200,
    headers: {
      "Content-Type": contentTypeFromExt(ext),
      "Cache-Control": "public, max-age=86400",
      "X-Img-Cache": "ORIGINAL",
      ETag: `"${Number(sourceStat.size)}-${Math.floor(Number(sourceStat.mtimeMs))}"`,
    },
  });
}

/**
 * Optimiza /uploads y /images on-the-fly (WebP) con caché en disco.
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

  const filePath = resolvePublicImagePath(src);
  if (!filePath) {
    return NextResponse.json({ error: "src inválido" }, { status: 400 });
  }

  let sourceStat;
  try {
    sourceStat = await stat(filePath);
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const key = cacheKey(src, width, quality, sourceStat.mtimeMs);
  const cacheDir = getImgCacheDir();
  const cachePath = path.join(cacheDir, `${key}.webp`);

  try {
    const cached = await readFile(cachePath);
    if (isValidWebpBuffer(cached)) {
      return new NextResponse(new Uint8Array(cached), {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Img-Cache": "HIT",
        },
      });
    }
    await unlink(cachePath).catch(() => {});
  } catch {
    // miss
  }

  try {
    const sharp = (await import("sharp")).default;
    const raw = await readFile(filePath);
    const data = await sharp(raw)
      .rotate()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();

    try {
      await mkdir(cacheDir, { recursive: true });
      await writeFile(cachePath, data);
    } catch {
      // caché best-effort
    }

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Img-Cache": "MISS",
      },
    });
  } catch (e) {
    console.error("[api/img] fallback original", filePath, e);
    try {
      return await serveOriginal(filePath, sourceStat);
    } catch (readErr) {
      console.error("[api/img]", readErr);
      return NextResponse.json({ error: "Error al optimizar" }, { status: 500 });
    }
  }
}
