import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDefaultPricing, normalizePricingConfig, type TourPricingConfig } from "@/lib/tour-pricing";

function parseConfig(tourId: string, tourName: string, basePrice: number, tiersJson: string): TourPricingConfig {
  try {
    const raw = JSON.parse(tiersJson);
    if (Array.isArray(raw)) {
      return normalizePricingConfig({ tiers: raw }, tourId, tourName, basePrice);
    }
    return normalizePricingConfig(raw, tourId, tourName, basePrice);
  } catch {
    return getDefaultPricing(tourId, tourName, basePrice);
  }
}

export async function GET(request: NextRequest) {
  try {
    const tourId = request.nextUrl.searchParams.get("tourId");

    if (tourId) {
      const [row, tour] = await Promise.all([
        db.tourPricing.findUnique({ where: { tourId } }),
        db.tour.findUnique({
          where: { tourId },
          select: { promoDiscountPercent: true, name: true, price: true },
        }),
      ]);
      const promoDiscountPercent = Number(tour?.promoDiscountPercent) || 0;
      if (row) {
        const config = parseConfig(row.tourId, row.tourName, row.basePrice, row.tiersJson);
        return NextResponse.json({
          config: { ...config, promoDiscountPercent },
        });
      }
      const fallback = getDefaultPricing(tourId, tour?.name ?? tourId, tour?.price);
      return NextResponse.json({
        config: { ...fallback, promoDiscountPercent },
      });
    }

    const all = await db.tourPricing.findMany({ orderBy: { tourName: "asc" } });
    const tours = await db.tour.findMany({
      where: { tourId: { in: all.map((r) => r.tourId) } },
      select: { tourId: true, promoDiscountPercent: true },
    });
    const promoByTour = new Map(tours.map((t) => [t.tourId, t.promoDiscountPercent || 0]));
    return NextResponse.json({
      configs: all.map((r) => ({
        ...parseConfig(r.tourId, r.tourName, r.basePrice, r.tiersJson),
        promoDiscountPercent: promoByTour.get(r.tourId) ?? 0,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener precios" }, { status: 500 });
  }
}
