import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { requireAdmin, requireUser } from "@/lib/auth-session";
import { getUploadsDir } from "@/lib/uploads-dir";
import {
  isSensitiveUploadPath,
  normalizeUploadRelPath,
  verifyUploadSignature,
} from "@/lib/signed-file-url";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/otp-auth";

export const dynamic = "force-dynamic";

function contentTypeFor(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

async function userOwnsUpload(userId: string, email: string, relPath: string): Promise<boolean> {
  const fileUrl = `/${relPath}`;
  const doc = await db.tripDocument.findFirst({
    where: { fileUrl },
    select: { leadId: true, lead: { select: { userId: true, email: true } } },
  });
  if (!doc?.lead) return false;
  const e = normalizeEmail(email);
  return doc.lead.userId === userId || normalizeEmail(doc.lead.email) === e;
}

/**
 * Sirve archivos sensibles (PDF etc.) solo con:
 * - firma HMAC válida, o
 * - sesión admin, o
 * - dueño del viaje (documento de trip).
 * Imágenes públicas también pueden pasar por aquí; se permiten sin firma.
 */
export async function GET(request: NextRequest) {
  const rel = normalizeUploadRelPath(request.nextUrl.searchParams.get("path") ?? "");
  if (!rel) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
  }

  const sensitive = isSensitiveUploadPath(rel);
  const exp = request.nextUrl.searchParams.get("exp");
  const sig = request.nextUrl.searchParams.get("sig");
  const signedOk = verifyUploadSignature(rel, exp, sig);

  if (sensitive && !signedOk) {
    const admin = await requireAdmin(request);
    if (!admin) {
      const user = await requireUser(request);
      if (!user || !(await userOwnsUpload(user.id, user.email, rel))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }
  }

  const filename = rel.slice("uploads/".length);
  const abs = path.join(getUploadsDir(), filename);

  try {
    const st = await stat(abs);
    if (!st.isFile()) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    const stream = createReadStream(abs);
    const webStream = Readable.toWeb(stream) as unknown as ReadableStream;
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentTypeFor(filename),
        "Content-Length": String(st.size),
        "Cache-Control": sensitive
          ? "private, no-store"
          : "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
        ...(sensitive
          ? { "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"` }
          : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}
