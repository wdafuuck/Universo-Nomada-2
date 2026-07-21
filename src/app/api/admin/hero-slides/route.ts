import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_HERO_SLIDES } from "@/lib/default-hero-slides";
import { requireAdmin } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

async function ensureSeeded() {
  const count = await db.heroSlide.count();
  if (count === 0) {
    for (const slide of DEFAULT_HERO_SLIDES) {
      await db.heroSlide.create({ data: { ...slide, active: true } });
    }
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await ensureSeeded();
    const slides = await db.heroSlide.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ slides });
  } catch (err) {
    console.error("[hero-slides GET]", err);
    return NextResponse.json({ error: "Error al obtener fotos" }, { status: 500 });
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

    const slide = await db.heroSlide.create({
      data: {
        imageUrl,
        label: body.label ?? "",
        active: body.active !== false,
        sortOrder: body.sortOrder ?? 99,
      },
    });
    return NextResponse.json({ slide }, { status: 201 });
  } catch (err) {
    console.error("[hero-slides POST]", err);
    return NextResponse.json({ error: "Error al agregar foto" }, { status: 500 });
  }
}
