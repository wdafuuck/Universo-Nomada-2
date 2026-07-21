import { NextResponse } from "next/server";
import { fetchBlogPostBySlug } from "@/lib/blog-store";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const post = await fetchBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (e) {
    console.error("[blog/slug] GET error:", e);
    return NextResponse.json({ error: "Error al cargar artículo" }, { status: 500 });
  }
}
