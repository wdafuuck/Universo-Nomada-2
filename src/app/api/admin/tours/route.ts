import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { requireAdmin } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

async function ensureToursSeeded() {
  const count = await db.tour.count();
  if (count === 0) {
    for (const t of DEFAULT_TOURS) {
      await db.tour.create({ data: t });
    }
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await ensureToursSeeded();
    const tours = await db.tour.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ tours });
  } catch {
    return NextResponse.json({ error: "Error al obtener tours" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { tourId, name, subtitle, description, image, tag, category, price, originalPrice, duration,
      includesText, excludesText, highlightsText, pdfUrl, galleryJson, faqJson, optionalToursJson,
      flightOrigin, flightDestination, flightBudgetMax, taxType, minDepositPerPerson,
      active, sortOrder } = body;

    if (!tourId || !name) {
      return NextResponse.json({ error: "ID y nombre son obligatorios" }, { status: 400 });
    }

    const slug = String(tourId).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!slug) {
      return NextResponse.json({ error: "El ID solo puede contener letras, números y guiones" }, { status: 400 });
    }

    const existing = await db.tour.findUnique({ where: { tourId: slug } });
    if (existing) {
      return NextResponse.json(
        { error: `El ID "${slug}" ya está en uso. Elige otro slug (ej. ${slug}-copy).` },
        { status: 409 },
      );
    }

    const tour = await db.tour.create({
      data: {
        tourId: slug,
        name,
        subtitle: subtitle ?? "",
        description: description ?? "",
        image: image ?? "/images/atacama-new.png",
        tag: tag ?? "",
        category: category ?? "nacional",
        price: Number(price) || 0,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        duration: duration ?? "",
        includesText: includesText ?? "",
        excludesText: excludesText ?? "",
        highlightsText: highlightsText ?? "",
        pdfUrl: pdfUrl ?? "",
        galleryJson: galleryJson ?? "[]",
        faqJson: faqJson ?? "[]",
        optionalToursJson: optionalToursJson ?? "{\"pickCount\":0,\"options\":[]}",
        flightOrigin: flightOrigin ?? "SCL",
        flightDestination: flightDestination ?? "",
        flightBudgetMax: flightBudgetMax ? Number(flightBudgetMax) : null,
        taxType: taxType ?? "exento",
        minDepositPerPerson: Number(minDepositPerPerson) || 0,
        active: active !== false,
        sortOrder: sortOrder ?? 99,
      },
    });

    return NextResponse.json({ tour }, { status: 201 });
  } catch (e) {
    console.error("[admin/tours POST]", e);
    return NextResponse.json({ error: "Error al crear paquete" }, { status: 500 });
  }
}
