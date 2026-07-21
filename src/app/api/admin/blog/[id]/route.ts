import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-session";
import { inputToDbData, type BlogArticleInput } from "@/lib/blog-store";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isFinite(articleId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const existing = await db.blogArticle.findUnique({ where: { id: articleId } });
    if (!existing) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
    }

    const body = await request.json() as Partial<BlogArticleInput>;
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Título obligatorio" }, { status: 400 });
    }

    const slug = (body.slug?.trim() || existing.slug).replace(/^-+|-+$/g, "");
    if (!slug) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }

    if (slug !== existing.slug) {
      const duplicate = await db.blogArticle.findUnique({ where: { slug } });
      if (duplicate) {
        return NextResponse.json({ error: "Ya existe un artículo con ese slug" }, { status: 409 });
      }
    }

    const input: BlogArticleInput = {
      slug,
      title: body.title,
      excerpt: body.excerpt ?? "",
      content: body.content ?? "",
      category: body.category ?? "General",
      image: body.image ?? existing.image,
      date: body.date ?? existing.date,
      readTime: Number(body.readTime) || existing.readTime,
      active: body.active !== false,
    };

    const article = await db.blogArticle.update({
      where: { id: articleId },
      data: inputToDbData(input, existing),
    });

    return NextResponse.json({ article });
  } catch (e) {
    console.error("[admin/blog/id] PUT error:", e);
    return NextResponse.json({ error: "Error al actualizar artículo" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isFinite(articleId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    await db.blogArticle.delete({ where: { id: articleId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/blog/id] DELETE error:", e);
    return NextResponse.json({ error: "Error al eliminar artículo" }, { status: 500 });
  }
}
