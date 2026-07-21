import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_INSTAGRAM_POSTS } from "@/lib/instagram";
import { requireAdmin } from "@/lib/auth-session";

async function ensureSeeded() {
  const count = await db.instagramPost.count();
  if (count === 0) {
    for (const p of DEFAULT_INSTAGRAM_POSTS) {
      await db.instagramPost.create({ data: { ...p, active: true } });
    }
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await ensureSeeded();
    const posts = await db.instagramPost.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ error: "Error al obtener publicaciones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const imageUrl = String(body.imageUrl ?? "").trim();

    if (!imageUrl) {
      return NextResponse.json({ error: "La imagen es obligatoria" }, { status: 400 });
    }

    const post = await db.instagramPost.create({
      data: {
        postUrl: body.postUrl ?? "",
        caption: body.caption ?? "",
        imageUrl,
        active: body.active !== false,
        sortOrder: body.sortOrder ?? 99,
      },
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear slide" }, { status: 500 });
  }
}
