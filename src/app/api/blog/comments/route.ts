import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardPublicApi } from "@/lib/api-guard";
import { readJsonBody, sanitizeEmail, sanitizeText, escapeHtml } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const blocked = guardPublicApi(request, {
      key: "blog-comment",
      limit: 6,
      windowMs: 60_000,
      requireJson: true,
    });
    if (blocked) return blocked;

    const parsed = await readJsonBody<{
      postSlug?: string;
      postTitle?: string;
      name?: string;
      email?: string;
      comment?: string;
      website?: string;
    }>(request);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    // Honeypot: bots que rellenan "website" → respuesta OK sin guardar
    if (sanitizeText(parsed.data.website, 40)) {
      return NextResponse.json({ ok: true, id: "ignored" }, { status: 201 });
    }

    const postSlug = sanitizeText(parsed.data.postSlug, 120);
    const postTitle = sanitizeText(parsed.data.postTitle, 200);
    const name = sanitizeText(parsed.data.name, 80);
    const email = sanitizeEmail(parsed.data.email);
    const comment = sanitizeText(parsed.data.comment, 2000);

    if (!postSlug) {
      return NextResponse.json({ error: "Artículo no válido" }, { status: 400 });
    }
    if (name.length < 2) {
      return NextResponse.json({ error: "Indica tu nombre" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Indica un correo válido" }, { status: 400 });
    }
    if (comment.length < 3) {
      return NextResponse.json({ error: "Escribe un comentario un poco más largo" }, { status: 400 });
    }

    const saved = await db.blogComment.create({
      data: {
        postSlug,
        postTitle,
        name,
        email,
        comment,
      },
    });

    const to = process.env.LEAD_NOTIFY_EMAIL?.trim() || "contacto@universonomada.cl";
    const subject = `💬 Comentario en blog: ${postTitle || postSlug}`;
    const text = [
      "Nuevo comentario en el blog de Universo Nómada",
      "",
      `Artículo: ${postTitle || postSlug}`,
      `Slug: ${postSlug}`,
      `Nombre: ${name}`,
      `Email: ${email}`,
      "",
      comment,
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#0E6B5C">💬 Nuevo comentario en el blog</h2>
        <p><strong>Artículo:</strong> ${escapeHtml(postTitle || postSlug)}</p>
        <p><strong>Nombre:</strong> ${escapeHtml(name)}<br/>
        <strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="white-space:pre-line;border-left:3px solid #0E6B5C;padding-left:12px">${escapeHtml(comment)}</p>
      </div>`;

    try {
      const { sendEmail } = await import("@/lib/email/send");
      await sendEmail({ to, subject, html, text });
    } catch (e) {
      console.error("[blog/comments] notify:", e);
    }

    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
  } catch (e) {
    console.error("[blog/comments]", e);
    return NextResponse.json(
      { error: "No pudimos guardar tu comentario. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
