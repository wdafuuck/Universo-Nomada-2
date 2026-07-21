import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveAllowedDates } from "@/lib/flight-resolver";
import { parseTourDuration } from "@/lib/tour-duration";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tourId = searchParams.get("tourId");
    const month = searchParams.get("month");
    const adults = Number(searchParams.get("adults")) || 2;

    if (!tourId || !month) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const tour = await db.tour.findUnique({ where: { tourId } });
    if (!tour) {
      return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
    }

    if (!tour.flightBudgetMax || tour.flightBudgetMax <= 0) {
      return NextResponse.json({ allowed: [], hasBudget: false, source: "none" });
    }

    const nights = parseTourDuration(tour.duration).nights || 6;
    const from = `${month}-01`;
    const end = new Date(`${month}-01T12:00:00`);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    const to = end.toISOString().slice(0, 10);

    const result = await resolveAllowedDates({
      tour: {
        tourId: tour.tourId,
        flightOrigin: tour.flightOrigin,
        flightDestination: tour.flightDestination,
        flightBudgetMax: tour.flightBudgetMax,
        duration: tour.duration,
      },
      from,
      to,
      adults,
      nights,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error al obtener fechas" }, { status: 500 });
  }
}
