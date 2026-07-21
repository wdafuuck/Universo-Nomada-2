import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { ensureGroupTripsSeeded } from "@/lib/group-trips-seed";
import { isDepartureAvailability } from "@/lib/group-departure-availability";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await ensureGroupTripsSeeded();
    const trips = await db.groupTrip.findMany({
      include: { departures: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ trips });
  } catch (error) {
    console.error("[admin/group-trips GET]", error);
    return NextResponse.json({ error: "Error al cargar viajes grupales" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await request.json();
  const trip = await db.groupTrip.create({
    data: {
      tourId: body.tourId,
      name: body.name,
      duration: body.duration,
      image: body.image,
      gradient: body.gradient ?? "from-teal-500 to-cyan-600",
      reservation: body.reservation ?? 100000,
      price: body.price ?? 0,
      includesJson: JSON.stringify(body.includes ?? []),
      sortOrder: body.sortOrder ?? 0,
      departures: {
        create: (body.departures ?? []).map((d: { date: string; availabilityStatus?: string }) => ({
          date: d.date,
          availabilityStatus: isDepartureAvailability(d.availabilityStatus)
            ? d.availabilityStatus
            : "available",
          spotsLeft: 0,
          totalSpots: 0,
        })),
      },
    },
    include: { departures: true },
  });
  return NextResponse.json({ trip }, { status: 201 });
}
