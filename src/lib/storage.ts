"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

const STORAGE_BUCKET = "media";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

type UploadResult = { url: string } | { error: string };

/**
 * Uploads an image File to the Supabase Storage bucket under the given prefix
 * (e.g. "promotions" or "destinations"). Returns the public URL on success.
 *
 * Requires an authenticated admin session.
 */
export async function uploadImage(
  file: File,
  prefix: string,
): Promise<UploadResult> {
  try {
    await requireAdmin();

    if (!file || file.size === 0) return { error: "Archivo vacío" };
    if (file.size > MAX_BYTES) return { error: "El archivo supera 5 MB" };
    if (!ALLOWED_TYPES.has(file.type)) {
      return { error: "Formato no soportado (usa JPG, PNG, WEBP o GIF)" };
    }

    const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const safePrefix = prefix.replace(/[^a-z0-9_-]/gi, "");
    const objectKey = `${safePrefix}/${crypto.randomUUID()}.${ext}`;

    const supabase = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(objectKey, new Uint8Array(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("[uploadImage] supabase storage error:", error);
      return { error: `Error subiendo imagen: ${error.message}` };
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectKey);
    return { url: data.publicUrl };
  } catch (err) {
    console.error("[uploadImage] unexpected error:", err);
    const message = err instanceof Error ? err.message : "Error inesperado";
    return { error: message };
  }
}

/**
 * Deletes an object from Storage given its public URL (best-effort).
 * Ignored if the URL is not a Supabase storage URL for the configured bucket.
 */
export async function deleteImage(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl) return;
  await requireAdmin();

  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const objectKey = publicUrl.slice(idx + marker.length);
  if (!objectKey) return;

  const supabase = createAdminClient();
  await supabase.storage.from(STORAGE_BUCKET).remove([objectKey]);
}
