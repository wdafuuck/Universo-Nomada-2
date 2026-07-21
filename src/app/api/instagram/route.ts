import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_INSTAGRAM_POSTS, INSTAGRAM_PROFILE_URL } from "@/lib/instagram";

async function ensureSeeded() {
  const count = await db.instagramPost.count();
  if (count === 0) {
    for (const p of DEFAULT_INSTAGRAM_POSTS) {
      await db.instagramPost.create({ data: { ...p, active: true } });
    }
  }
}

export async function GET() {
  try {
    await ensureSeeded();
    const posts = await db.instagramPost.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ posts, profileUrl: INSTAGRAM_PROFILE_URL });
  } catch {
    return NextResponse.json({ error: "Error al obtener publicaciones" }, { status: 500 });
  }
}
