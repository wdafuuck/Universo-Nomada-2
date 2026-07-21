import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_PROMOTIONS } from "@/lib/default-tours";
import { syncSeasonalPromotions } from "@/lib/promo-sync";

export const revalidate = 30;

async function ensurePromosSeeded() {
  const count = await db.promotion.count();
  if (count === 0) {
    for (const p of DEFAULT_PROMOTIONS) {
      await db.promotion.create({ data: p });
    }
  }
}

export async function GET() {
  try {
    await ensurePromosSeeded();
    await syncSeasonalPromotions();
    const promotions = await db.promotion.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ promotions }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener promociones" }, { status: 500 });
  }
}
