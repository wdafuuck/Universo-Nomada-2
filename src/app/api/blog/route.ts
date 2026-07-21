import { NextResponse } from "next/server";
import { fetchBlogPosts } from "@/lib/blog-store";

export async function GET() {
  try {
    const posts = await fetchBlogPosts();
    return NextResponse.json({ posts });
  } catch (e) {
    console.error("[blog] GET error:", e);
    return NextResponse.json({ error: "Error al cargar artículos" }, { status: 500 });
  }
}
