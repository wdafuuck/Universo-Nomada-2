import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveFlightSearch } from "@/lib/flight-resolver";
import { parseTourDuration } from "@/lib/tour-duration";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tourId, departDate, returnDate, adults } = body;

    if (!tourId || !departDate) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const tour = await db.tour.findUnique({ where: { tourId } });
    if (!tour) {
      return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
    }

    const nights = parseTourDuration(tour.duration).nights || 6;
    let ret = returnDate as string | undefined;
    if (!ret) {
      const d = new Date(departDate + "T12:00:00");
      d.setDate(d.getDate() + nights);
      ret = d.toISOString().slice(0, 10);
    }

    const result = await resolveFlightSearch({
      tour: {
        tourId: tour.tourId,
        flightOrigin: tour.flightOrigin,
        flightDestination: tour.flightDestination,
        flightBudgetMax: tour.flightBudgetMax,
        duration: tour.duration,
      },
      departDate,
      returnDate: ret,
      adults: Number(adults) || 2,
      nights,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error al buscar vuelos" }, { status: 500 });
  }
}
