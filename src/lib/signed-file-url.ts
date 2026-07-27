import { createHmac, timingSafeEqual } from "node:crypto";
import { getSessionSecret } from "@/lib/env";

const DEFAULT_TTL_SEC = 60 * 60; // 1 hora

function secret(): string {
  return getSessionSecret();
}

export function isSensitiveUploadPath(filePath: string): boolean {
  const p = filePath.split("?")[0].toLowerCase();
  return /\.(pdf|doc|docx|xls|xlsx|zip|rar|7z|csv)$/i.test(p);
}

/** Normaliza a path relativo tipo uploads/foo.pdf (sin leading slash). */
export function normalizeUploadRelPath(input: string): string | null {
  let p = input.trim();
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) {
    try {
      p = new URL(p).pathname;
    } catch {
      return null;
    }
  }
  p = p.replace(/^\/+/, "");
  if (!p.startsWith("uploads/")) return null;
  if (p.includes("..") || p.includes("\0")) return null;
  return p;
}

export function signUploadPath(
  relPath: string,
  ttlSec = DEFAULT_TTL_SEC,
): { exp: number; sig: string } {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${relPath}:${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return { exp, sig };
}

export function verifyUploadSignature(
  relPath: string,
  expRaw: string | null,
  sigRaw: string | null,
): boolean {
  if (!expRaw || !sigRaw) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac("sha256", secret()).update(`${relPath}:${exp}`).digest("base64url");
  try {
    const a = Buffer.from(sigRaw);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** URL lista para <a href> — imágenes públicas sin firma; sensibles con firma. */
export function publicOrSignedFileUrl(fileUrl: string, ttlSec = DEFAULT_TTL_SEC): string {
  const rel = normalizeUploadRelPath(fileUrl);
  if (!rel) return fileUrl;
  if (!isSensitiveUploadPath(rel)) {
    return `/${rel}`;
  }
  const { exp, sig } = signUploadPath(rel, ttlSec);
  return `/api/secure-file?path=${encodeURIComponent(rel)}&exp=${exp}&sig=${sig}`;
}
