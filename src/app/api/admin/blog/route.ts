import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-session";
import {
  fetchBlogArticlesAdmin,
  inputToDbData,
  slugifyTitle,
  type BlogArticleInput,
} from "@/lib/blog-store";
import { db } from "@/lib/db";
import { notifyIndexNow } from "@/lib/indexnow";
import { absoluteUrl } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const articles = await fetchBlogArticlesAdmin();
    return NextResponse.json({ articles });
  } catch (e) {
    console.error("[admin/blog] GET error:", e);
    return NextResponse.json({ error: "Error al cargar artículos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json() as Partial<BlogArticleInput>;
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Título obligatorio" }, { status: 400 });
    }

    const slug = (body.slug?.trim() || slugifyTitle(body.title)).replace(/^-+|-+$/g, "");
    if (!slug) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }

    const existing = await db.blogArticle.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un artículo con ese slug" }, { status: 409 });
    }

    const input: BlogArticleInput = {
      slug,
      title: body.title,
      excerpt: body.excerpt ?? "",
      content: body.content ?? "",
      category: body.category ?? "General",
      image: body.image ?? "/images/atacama-new.png",
      date: body.date ?? new Date().toISOString().slice(0, 10),
      readTime: Number(body.readTime) || 5,
      active: body.active !== false,
    };

    const maxSort = await db.blogArticle.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;

    const article = await db.blogArticle.create({
      data: {
        ...inputToDbData(input),
        sortOrder,
      },
    });

    if (input.active) {
      void notifyIndexNow([
        absoluteUrl(`/blog/${slug}`),
        absoluteUrl("/blog"),
        absoluteUrl("/sitemap.xml"),
      ]);
    }

    return NextResponse.json({ article }, { status: 201 });
  } catch (e) {
    console.error("[admin/blog] POST error:", e);
    const message =
      e instanceof Error && /slug|unique|Unique/i.test(e.message)
        ? "Ya existe un artículo con ese slug"
        : "Error al crear artículo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
