/** Validación de tipo real por magic bytes (no confiar en Content-Type del cliente). */

export type AllowedUploadMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "application/pdf";

function startsWith(buf: Buffer, sig: number[] | string): boolean {
  const bytes = typeof sig === "string" ? Buffer.from(sig, "ascii") : Buffer.from(sig);
  return buf.length >= bytes.length && buf.subarray(0, bytes.length).equals(bytes);
}

/** Detecta MIME real desde los primeros bytes del buffer. */
export function detectBufferMime(buf: Buffer): AllowedUploadMime | null {
  if (buf.length < 4) return null;

  if (startsWith(buf, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (startsWith(buf, "GIF87a") || startsWith(buf, "GIF89a")) return "image/gif";
  if (startsWith(buf, "RIFF") && buf.length >= 12 && buf.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  if (startsWith(buf, "%PDF")) return "application/pdf";

  return null;
}

const IMAGE_MIMES = new Set<AllowedUploadMime>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isImageMime(mime: AllowedUploadMime): boolean {
  return IMAGE_MIMES.has(mime);
}

export function isPdfMime(mime: AllowedUploadMime): boolean {
  return mime === "application/pdf";
}

/**
 * Valida que el contenido real coincida con lo declarado.
 * Rechaza ejecutables disfrazados (PHP, scripts, etc.).
 */
export function validateUploadBuffer(
  buf: Buffer,
  declaredType: string,
): { ok: true; mime: AllowedUploadMime } | { ok: false; error: string } {
  const detected = detectBufferMime(buf);
  if (!detected) {
    return { ok: false, error: "Tipo de archivo no permitido o contenido inválido" };
  }

  const declared = declaredType.toLowerCase().split(";")[0]?.trim() ?? "";
  const isDeclaredPdf = declared === "application/pdf";
  const isDeclaredImage = declared.startsWith("image/");

  if (isPdfMime(detected) && !isDeclaredPdf && !isDeclaredImage) {
    // PDF con tipo raro pero contenido PDF → aceptar por contenido
  } else if (isImageMime(detected) && isDeclaredPdf) {
    return { ok: false, error: "El archivo no es un PDF válido" };
  } else if (isPdfMime(detected) && isDeclaredImage) {
    return { ok: false, error: "El archivo no es una imagen válida" };
  }

  return { ok: true, mime: detected };
}
