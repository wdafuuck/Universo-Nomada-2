import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tourToPromoCard } from "@/lib/tour-ofertas";
import { isTourInOfertasNow } from "@/lib/promo-schedule";

export const revalidate = 30;

export async function GET() {
  try {
    const tours = await db.tour.findMany({
      where: { active: true, showInOfertas: true },
      orderBy: [{ sortOrder: "asc" }, { tourId: "asc" }],
    });
    const promotions = tours.filter((t) => isTourInOfertasNow(t)).map(tourToPromoCard);
    return NextResponse.json(
      { promotions },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
    );
  } catch {
    return NextResponse.json({ error: "Error al obtener ofertas" }, { status: 500 });
  }
}
