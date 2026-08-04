import sharp from "sharp";

export type OptimizePurpose = "hero" | "content" | "thumb" | "blog";

const MAX_EDGE: Record<OptimizePurpose, number> = {
  hero: 1920,
  content: 1400,
  /** Portadas blog: ~800px en UI → 1600 cubre retina sin sobrar peso */
  blog: 1600,
  thumb: 800,
};

/** Techo de peso deseado (bytes) por propósito — se baja calidad hasta acercarse. */
const TARGET_MAX_BYTES: Record<OptimizePurpose, number> = {
  hero: 320_000,
  content: 220_000,
  blog: 180_000,
  thumb: 90_000,
};

const DEFAULT_QUALITY: Record<OptimizePurpose, number> = {
  hero: 72,
  content: 74,
  blog: 78,
  thumb: 70,
};

export type OptimizeResult = {
  data: Buffer;
  contentType: string;
  ext: string;
  width?: number;
  height?: number;
  qualityUsed: number;
};

/**
 * Optimiza buffer a WebP (o JPEG si preferJpeg).
 * Para blog: máximo esfuerzo de compresión + techo de peso sin “aplastar” la foto.
 */
export async function optimizeImageBuffer(
  buffer: Buffer,
  opts?: { purpose?: OptimizePurpose; quality?: number; preferJpeg?: boolean },
): Promise<OptimizeResult> {
  const purpose = opts?.purpose ?? "content";
  const max = MAX_EDGE[purpose];
  const targetBytes = TARGET_MAX_BYTES[purpose];
  const startQuality = opts?.quality ?? DEFAULT_QUALITY[purpose];

  const meta = await sharp(buffer, { failOn: "none" }).metadata();
  const base = sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true });

  if (opts?.preferJpeg && !meta.hasAlpha) {
    const data = await base
      .clone()
      .jpeg({ quality: startQuality, mozjpeg: true, chromaSubsampling: "4:2:0" })
      .toBuffer();
    const outMeta = await sharp(data).metadata();
    return {
      data,
      contentType: "image/jpeg",
      ext: "jpg",
      width: outMeta.width,
      height: outMeta.height,
      qualityUsed: startQuality,
    };
  }

  // Escalera: calidad alta → baja hasta cumplir techo (o un mínimo visual)
  const qualities =
    purpose === "blog"
      ? uniqueQualities([startQuality, 78, 74, 70, 66, 62])
      : uniqueQualities([startQuality, startQuality - 4, startQuality - 8].filter((q) => q >= 60));

  let best: { data: Buffer; quality: number } | null = null;

  for (const quality of qualities) {
    const data = await base
      .clone()
      .webp({
        quality,
        effort: purpose === "blog" ? 6 : 5,
        smartSubsample: true,
        // Alpha raro en fotos de viaje; si hay, WebP lo conserva
      })
      .toBuffer();

    if (!best || data.length < best.data.length) {
      best = { data, quality };
    }
    if (data.length <= targetBytes) {
      best = { data, quality };
      break;
    }
  }

  const chosen = best!;
  const outMeta = await sharp(chosen.data).metadata();
  return {
    data: chosen.data,
    contentType: "image/webp",
    ext: "webp",
    width: outMeta.width,
    height: outMeta.height,
    qualityUsed: chosen.quality,
  };
}

function uniqueQualities(list: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const q of list) {
    const n = Math.min(90, Math.max(55, Math.round(q)));
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

export function isAllowedPublicImagePath(src: string): boolean {
  if (!src.startsWith("/uploads/") && !src.startsWith("/images/")) return false;
  if (src.includes("..") || src.includes("\0")) return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(src);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
