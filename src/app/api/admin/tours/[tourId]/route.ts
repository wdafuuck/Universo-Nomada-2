import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { parsePromoScheduleFromBody } from "@/lib/promo-schedule";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ tourId: string }> };

async function syncTourPricing(tourId: string, tourName: string, price: number) {
  const existing = await db.tourPricing.findUnique({ where: { tourId } });
  if (!existing) return;

  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(existing.tiersJson || "{}");
  } catch {
    config = {};
  }

  const passengerPrices = (config.passengerPrices as Record<string, number> | undefined) ?? {
    adult: price,
    child: price,
    infant: 0,
    senior: price,
  };
  passengerPrices.adult = price;

  await db.tourPricing.update({
    where: { tourId },
    data: {
      tourName,
      basePrice: price,
      tiersJson: JSON.stringify({ ...config, passengerPrices, basePrice: price }),
    },
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { tourId } = await params;
    const body = await request.json();
    const price = Number(body.price) || 0;
    const schedule = parsePromoScheduleFromBody(body);
    if (schedule.error) {
      return NextResponse.json({ error: schedule.error }, { status: 400 });
    }

    const tour = await db.tour.update({
      where: { tourId },
      data: {
        name: body.name,
        subtitle: body.subtitle,
        description: body.description,
        image: body.image,
        tag: body.tag,
        category: body.category,
        price,
        originalPrice: body.originalPrice ? Number(body.originalPrice) : null,
        duration: body.duration,
        includesText: body.includesText ?? "",
        excludesText: body.excludesText ?? "",
        highlightsText: body.highlightsText ?? "",
        pdfUrl: body.pdfUrl ?? "",
        galleryJson: body.galleryJson ?? "[]",
        faqJson: body.faqJson ?? "[]",
        optionalToursJson: body.optionalToursJson ?? "{\"pickCount\":0,\"options\":[]}",
        flightOrigin: body.flightOrigin ?? "SCL",
        flightDestination: body.flightDestination ?? "",
        flightBudgetMax: body.flightBudgetMax != null && body.flightBudgetMax !== ""
          ? Number(body.flightBudgetMax)
          : null,
        taxType: body.taxType ?? "exento",
        minDepositPerPerson: Number(body.minDepositPerPerson) || 0,
        showInOfertas: Boolean(body.showInOfertas),
        promoTitle: body.showInOfertas ? String(body.promoTitle ?? "").trim() : "",
        promoDiscountPercent: body.showInOfertas
          ? Math.min(90, Math.max(0, Math.round(Number(body.promoDiscountPercent) || 0)))
          : 0,
        promoStartsAt: schedule.promoStartsAt,
        promoEndsAt: schedule.promoEndsAt,
        active: body.active !== false,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    await syncTourPricing(tourId, body.name ?? tour.name, price);

    return NextResponse.json({ tour });
  } catch {
    return NextResponse.json({ error: "Error al actualizar paquete" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { tourId } = await params;
    await db.tour.delete({ where: { tourId } });
    await db.tourPricing.deleteMany({ where: { tourId } }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar paquete" }, { status: 500 });
  }
}
