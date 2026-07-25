import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth-session";
import { ensureUploadsDir } from "@/lib/uploads-dir";

const IMAGE_MAX_INPUT = 25 * 1024 * 1024;
const PDF_MAX = 15 * 1024 * 1024;

async function optimizeImage(
  buffer: Buffer,
  mimeType: string,
): Promise<{ data: Buffer; ext: string }> {
  const meta = await sharp(buffer).metadata();
  const preserveAlpha =
    meta.hasAlpha === true ||
    mimeType === "image/png" ||
    mimeType === "image/webp" ||
    mimeType === "image/gif";

  const pipeline = sharp(buffer)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true });

  if (preserveAlpha) {
    const data = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    return { data, ext: "png" };
  }

  const data = await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  return { data, ext: "jpg" };
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      return NextResponse.json({ error: "Solo imágenes JPG, PNG, WebP, GIF o PDF" }, { status: 400 });
    }

    if (isPdf && file.size > PDF_MAX) {
      return NextResponse.json({ error: "El PDF no puede superar 15 MB" }, { status: 400 });
    }

    if (isImage && file.size > IMAGE_MAX_INPUT) {
      return NextResponse.json(
        { error: "La imagen es muy pesada (máx. 25 MB). Comprímela un poco e intenta de nuevo." },
        { status: 400 },
      );
    }

    const uploadDir = await ensureUploadsDir();

    const raw = Buffer.from(await file.arrayBuffer());
    const optimized = isPdf ? null : await optimizeImage(raw, file.type);
    const filename = isPdf
      ? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${optimized!.ext}`;
    const output = isPdf ? raw : optimized!.data;

    await writeFile(path.join(uploadDir, filename), output);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (e) {
    console.error("[admin/upload]", e);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}
