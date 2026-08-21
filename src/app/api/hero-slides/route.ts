import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_HERO_SLIDES } from "@/lib/default-hero-slides";
import { isPromoWindowActive } from "@/lib/promo-schedule";

export const revalidate = 30;

async function ensureSeeded() {
  const count = await db.heroSlide.count();
  if (count === 0) {
    for (const slide of DEFAULT_HERO_SLIDES) {
      await db.heroSlide.create({ data: { ...slide, active: true } });
    }
  }
}

export async function GET() {
  try {
    await ensureSeeded();
    const all = await db.heroSlide.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        imageUrl: true,
        label: true,
        sortOrder: true,
        startsAt: true,
        endsAt: true,
      },
    });
    const slides = all.filter((s) => isPromoWindowActive(s.startsAt, s.endsAt));
    return NextResponse.json(
      { slides },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch {
    return NextResponse.json({ error: "Error al obtener fotos del inicio" }, { status: 500 });
  }
}
