import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  parseAccommodationsJson,
  parseItineraryJson,
} from "@/lib/group-trip-content";
import { normalizeDepartureAvailability } from "@/lib/group-departure-availability";

type Params = { params: Promise<{ tourId: string }> };

/** Detalle público de un viaje grupal por tourId (para /detalle-paquete). */
export async function GET(_request: NextRequest, { params }: Params) {
  const { tourId } = await params;
  try {
    const t = await db.groupTrip.findUnique({
      where: { tourId },
      include: { departures: true },
    });
    if (!t || !t.active) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({
      trip: {
        tourId: t.tourId,
        name: t.name,
        duration: t.duration,
        image: t.image,
        gradient: t.gradient,
        reservation: t.reservation,
        price: t.price,
        includes: JSON.parse(t.includesJson) as string[],
        itinerary: parseItineraryJson(t.itineraryJson),
        accommodations: parseAccommodationsJson(t.accommodationsJson),
        departures: t.departures.map((d) => ({
          date: d.date,
          availabilityStatus: normalizeDepartureAvailability(
            d.availabilityStatus,
            d.spotsLeft,
          ),
        })),
      },
    });
  } catch (error) {
    console.error("[group-trips tourId GET]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
