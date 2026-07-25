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
