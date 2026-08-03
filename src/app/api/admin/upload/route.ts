import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth-session";
import { ensureUploadsDir } from "@/lib/uploads-dir";
import { optimizeImageBuffer } from "@/lib/image-optimize";

const IMAGE_MAX_INPUT = 25 * 1024 * 1024;
const PDF_MAX = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const purpose = String(formData.get("purpose") ?? "public").trim().toLowerCase();

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      return NextResponse.json({ error: "Solo imágenes JPG, PNG, WebP, GIF o PDF" }, { status: 400 });
    }

    const sensitive = isPdf || purpose === "private" || purpose === "document";

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

    if (isPdf) {
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
      await writeFile(path.join(uploadDir, filename), raw);
      return NextResponse.json({ url: `/uploads/${filename}`, sensitive });
    }

    // Hero/banner: un poco más de resolución; resto content
    const isHero = purpose === "hero" || purpose === "banner" || purpose === "slide";
    const optimized = await optimizeImageBuffer(raw, {
      purpose: isHero ? "hero" : "content",
      quality: isHero ? 72 : 74,
    });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${optimized.ext}`;
    await writeFile(path.join(uploadDir, filename), optimized.data);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      sensitive,
      bytes: optimized.data.length,
      contentType: optimized.contentType,
    });
  } catch (e) {
    console.error("[admin/upload]", e);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}
