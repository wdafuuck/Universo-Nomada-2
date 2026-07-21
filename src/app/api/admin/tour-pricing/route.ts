import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDisplayPricePerPerson, normalizePricingConfig } from "@/lib/tour-pricing";
import { requireAdmin } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const rows = await db.tourPricing.findMany({ orderBy: { tourName: "asc" } });
    return NextResponse.json({ pricing: rows });
  } catch {
    return NextResponse.json({ error: "Error al obtener precios" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { tourId, tourName, basePrice, config } = body;

    if (!tourId || !tourName) {
      return NextResponse.json({ error: "tourId y tourName son obligatorios" }, { status: 400 });
    }

    const configJson = JSON.stringify(config ?? {});

    const row = await db.tourPricing.upsert({
      where: { tourId },
      create: {
        tourId,
        tourName,
        basePrice: basePrice ?? 0,
        tiersJson: configJson,
      },
      update: {
        tourName,
        basePrice: basePrice ?? 0,
        tiersJson: configJson,
      },
    });

    const normalized = normalizePricingConfig(config ?? {}, tourId, tourName, basePrice ?? 0);
    const displayPrice = getDisplayPricePerPerson(normalized);
    await db.tour.updateMany({
      where: { tourId },
      data: { price: displayPrice },
    }).catch(() => {});

    return NextResponse.json({ pricing: row });
  } catch {
    return NextResponse.json({ error: "Error al guardar precios" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tourId = request.nextUrl.searchParams.get("tourId");
    if (!tourId) return NextResponse.json({ error: "tourId requerido" }, { status: 400 });
    await db.tourPricing.delete({ where: { tourId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
