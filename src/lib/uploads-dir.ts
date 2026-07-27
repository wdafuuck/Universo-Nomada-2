import path from "path";
import { mkdir } from "fs/promises";

/**
 * Directorio persistente de uploads.
 * En standalone Next cambia cwd a `.next/standalone`; no escribir ahí
 * (el próximo deploy pisa esa carpeta).
 */
export function getUploadsDir(): string {
  if (process.env.UPLOAD_DIR?.trim()) {
    return path.resolve(process.env.UPLOAD_DIR.trim());
  }

  const cwd = process.cwd();
  const projectRoot = /[/\\]\.next[/\\]standalone$/.test(cwd)
    ? path.resolve(cwd, "..", "..")
    : cwd;

  return path.join(projectRoot, "public", "uploads");
}

export async function ensureUploadsDir(): Promise<string> {
  const dir = getUploadsDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

/** Abs path for a relative uploads/foo.bar path. */
export function absoluteUploadPath(relOrUrl: string): string | null {
  const cleaned = relOrUrl.replace(/^\//, "");
  if (!cleaned.startsWith("uploads/") || cleaned.includes("..")) return null;
  const filename = cleaned.slice("uploads/".length);
  if (!filename || filename.includes("/") || filename.includes("\\")) return null;
  return path.join(getUploadsDir(), filename);
}
