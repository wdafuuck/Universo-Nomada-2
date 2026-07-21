import { NextRequest, NextResponse } from "next/server";
import { checkHotelAvailability } from "@/lib/hotel-availability";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkIn, checkOut, adults, children, accommodations } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 });
    }

    const accs = Array.isArray(accommodations) ? accommodations : [];
    const response = await checkHotelAvailability({
      checkIn,
      checkOut,
      adults: adults ?? 2,
      children: children ?? 0,
      accommodations: accs.map((a: Record<string, unknown>) => ({
        id: String(a.id),
        provider:
          a.provider === "ratehawk" || a.provider === "booking" || a.provider === "liteapi"
            ? a.provider
            : "manual",
        bookingPropertyId: a.bookingPropertyId != null ? Number(a.bookingPropertyId) : null,
        liteapiHotelId: a.liteapiHotelId != null ? String(a.liteapiHotelId) : null,
        liteapiMaxPriceUsd: a.liteapiMaxPriceUsd != null ? Number(a.liteapiMaxPriceUsd) : null,
        ratehawkHotelId: a.ratehawkHotelId != null ? Number(a.ratehawkHotelId) : null,
        maxPriceUsd: a.maxPriceUsd != null ? Number(a.maxPriceUsd) : null,
      })),
    });

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Error al verificar disponibilidad" }, { status: 500 });
  }
}
