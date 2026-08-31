import { NextRequest, NextResponse } from "next/server";
import { checkBookingAvailability } from "@/lib/booking-api";
import { guardPublicApi } from "@/lib/api-guard";

export async function POST(request: NextRequest) {
  try {
    const blocked = guardPublicApi(request, {
      key: "booking-availability",
      limit: 20,
      requireJson: true,
    });
    if (blocked) return blocked;

    const body = await request.json();
    const { hotelIds, checkIn, checkOut, adults, children } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 });
    }

    const ids = (hotelIds ?? []).map(Number).filter(Boolean);
    const response = await checkBookingAvailability({
      hotelIds: ids,
      checkIn,
      checkOut,
      adults: adults ?? 1,
      children: children ?? 0,
    });

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Error al verificar disponibilidad" }, { status: 500 });
  }
}
