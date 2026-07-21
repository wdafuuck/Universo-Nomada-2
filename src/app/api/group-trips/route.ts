import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureGroupTripsSeeded } from "@/lib/group-trips-seed";
import { normalizeDepartureAvailability } from "@/lib/group-departure-availability";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureGroupTripsSeeded();
    const rows = await db.groupTrip.findMany({
      where: { active: true },
      include: { departures: true },
      orderBy: { sortOrder: "asc" },
    });

    const trips = rows.map((t) => ({
      tourId: t.tourId,
      name: t.name,
      duration: t.duration,
      image: t.image,
      gradient: t.gradient,
      reservation: t.reservation,
      price: t.price,
      includes: JSON.parse(t.includesJson) as string[],
      departures: t.departures.map((d) => ({
        date: d.date,
        availabilityStatus: normalizeDepartureAvailability(
          d.availabilityStatus,
          d.spotsLeft,
        ),
      })),
    }));

    return NextResponse.json({ trips });
  } catch (error) {
    console.error("[group-trips GET]", error);
    return NextResponse.json({ trips: [], source: "fallback" });
  }
}
