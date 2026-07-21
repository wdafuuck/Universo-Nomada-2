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
      const row = await db.tourPricing.findUnique({ where: { tourId } });
      if (row) {
        return NextResponse.json({
          config: parseConfig(row.tourId, row.tourName, row.basePrice, row.tiersJson),
        });
      }
      return NextResponse.json({ config: getDefaultPricing(tourId, tourId) });
    }

    const all = await db.tourPricing.findMany({ orderBy: { tourName: "asc" } });
    return NextResponse.json({
      configs: all.map((r) => parseConfig(r.tourId, r.tourName, r.basePrice, r.tiersJson)),
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener precios" }, { status: 500 });
  }
}
