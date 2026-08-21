import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_HERO_SLIDES } from "@/lib/default-hero-slides";
import { requireAdmin } from "@/lib/auth-session";
import { parsePromoDateInput } from "@/lib/promo-schedule";

export const dynamic = "force-dynamic";

function parseHeroSchedule(body: { startsAt?: unknown; endsAt?: unknown }) {
  const startsAt =
    body.startsAt === null || body.startsAt === ""
      ? null
      : parsePromoDateInput(body.startsAt);
  const endsAt =
    body.endsAt === null || body.endsAt === ""
      ? null
      : parsePromoDateInput(body.endsAt);
  if (startsAt && endsAt && startsAt >= endsAt) {
    return { error: "La fecha de inicio debe ser anterior al término del banner." as const };
  }
  return { startsAt, endsAt };
}

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

    const schedule = parseHeroSchedule(body);
    if ("error" in schedule && schedule.error) {
      return NextResponse.json({ error: schedule.error }, { status: 400 });
    }

    const slide = await db.heroSlide.create({
      data: {
        imageUrl,
        label: body.label ?? "",
        active: body.active !== false,
        sortOrder: body.sortOrder ?? 99,
        startsAt: schedule.startsAt ?? null,
        endsAt: schedule.endsAt ?? null,
      },
    });
    return NextResponse.json({ slide }, { status: 201 });
  } catch (err) {
    console.error("[hero-slides POST]", err);
    return NextResponse.json({ error: "Error al agregar foto" }, { status: 500 });
  }
}
