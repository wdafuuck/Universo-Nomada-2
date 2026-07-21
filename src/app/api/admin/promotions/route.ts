import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_PROMOTIONS } from "@/lib/default-tours";
import { syncSeasonalPromotions } from "@/lib/promo-sync";
import { requireAdmin } from "@/lib/auth-session";

async function ensurePromosSeeded() {
  const count = await db.promotion.count();
  if (count === 0) {
    for (const p of DEFAULT_PROMOTIONS) {
      await db.promotion.create({ data: p });
    }
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await ensurePromosSeeded();
    await syncSeasonalPromotions();
    const promotions = await db.promotion.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ promotions });
  } catch {
    return NextResponse.json({ error: "Error al obtener promociones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const promotion = await db.promotion.create({
      data: {
        title: body.title,
        subtitle: body.subtitle ?? "",
        discount: body.discount,
        destination: body.destination,
        validUntil: body.validUntil ?? "",
        originalPrice: Number(body.originalPrice) || 0,
        discountPrice: Number(body.discountPrice) || 0,
        emoji: body.emoji ?? "🔥",
        image: body.image ?? "",
        active: body.active !== false,
      },
    });
    return NextResponse.json({ promotion }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear promoción" }, { status: 500 });
  }
}
