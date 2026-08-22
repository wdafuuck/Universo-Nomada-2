import path from "path";
import { absoluteUploadPath, getUploadsDir } from "@/lib/uploads-dir";

/** Raíz del repo (no el cwd de standalone). */
export function getProjectRoot(): string {
  const cwd = process.cwd();
  return /[/\\]\.next[/\\]standalone$/.test(cwd) ? path.resolve(cwd, "..", "..") : cwd;
}

/**
 * Resuelve /uploads/foo.webp o /images/bar.jpg a path absoluto en disco.
 */
export function resolvePublicImagePath(src: string): string | null {
  if (src.startsWith("/uploads/")) {
    return absoluteUploadPath(src);
  }
  if (src.startsWith("/images/")) {
    const rel = src.replace(/^\//, "");
    if (rel.includes("..")) return null;
    return path.join(getProjectRoot(), "public", rel);
  }
  return null;
}

export function getImgCacheDir(): string {
  if (process.env.IMG_CACHE_DIR?.trim()) {
    return path.resolve(process.env.IMG_CACHE_DIR.trim());
  }
  return path.join(getUploadsDir(), ".img-cache");
}

export function contentTypeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

/** Valida que un buffer en caché sea WebP legible (evita HIT corruptos). */
export function isValidWebpBuffer(buf: Buffer): boolean {
  return buf.length >= 16 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
}
