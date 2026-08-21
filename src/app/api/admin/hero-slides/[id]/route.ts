import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { parsePromoDateInput } from "@/lib/promo-schedule";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function parseHeroSchedule(body: { startsAt?: unknown; endsAt?: unknown }) {
  const hasStarts = "startsAt" in body;
  const hasEnds = "endsAt" in body;
  const startsAt = !hasStarts
    ? undefined
    : body.startsAt === null || body.startsAt === ""
      ? null
      : parsePromoDateInput(body.startsAt);
  const endsAt = !hasEnds
    ? undefined
    : body.endsAt === null || body.endsAt === ""
      ? null
      : parsePromoDateInput(body.endsAt);
  if (startsAt && endsAt && startsAt >= endsAt) {
    return { error: "La fecha de inicio debe ser anterior al término del banner." as const };
  }
  return { startsAt, endsAt };
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const schedule = parseHeroSchedule(body);
    if ("error" in schedule && schedule.error) {
      return NextResponse.json({ error: schedule.error }, { status: 400 });
    }

    const slide = await db.heroSlide.update({
      where: { id: Number(id) },
      data: {
        imageUrl: body.imageUrl,
        label: body.label ?? "",
        active: body.active !== false,
        sortOrder: body.sortOrder ?? 0,
        ...(schedule.startsAt !== undefined ? { startsAt: schedule.startsAt } : {}),
        ...(schedule.endsAt !== undefined ? { endsAt: schedule.endsAt } : {}),
      },
    });
    return NextResponse.json({ slide });
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    await db.heroSlide.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
