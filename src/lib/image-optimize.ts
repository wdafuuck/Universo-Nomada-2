import sharp from "sharp";

export type OptimizePurpose = "hero" | "content" | "thumb";

const MAX_EDGE: Record<OptimizePurpose, number> = {
  hero: 1920,
  content: 1400,
  thumb: 800,
};

/**
 * Optimiza buffer a WebP (con alpha si hace falta) o JPEG.
 * Usado en upload admin y en /api/img.
 */
export async function optimizeImageBuffer(
  buffer: Buffer,
  opts?: { purpose?: OptimizePurpose; quality?: number; preferJpeg?: boolean },
): Promise<{ data: Buffer; contentType: string; ext: string }> {
  const purpose = opts?.purpose ?? "content";
  const quality = opts?.quality ?? (purpose === "hero" ? 72 : 75);
  const max = MAX_EDGE[purpose];

  const meta = await sharp(buffer).metadata();
  const pipeline = sharp(buffer)
    .rotate()
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true });

  if (opts?.preferJpeg && !meta.hasAlpha) {
    const data = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    return { data, contentType: "image/jpeg", ext: "jpg" };
  }

  const data = await pipeline.webp({ quality, effort: 4 }).toBuffer();
  return { data, contentType: "image/webp", ext: "webp" };
}

export function isAllowedPublicImagePath(src: string): boolean {
  if (!src.startsWith("/uploads/") && !src.startsWith("/images/")) return false;
  if (src.includes("..") || src.includes("\0")) return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(src);
}
