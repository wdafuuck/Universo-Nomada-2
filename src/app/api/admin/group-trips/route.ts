import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { ensureGroupTripsSeeded } from "@/lib/group-trips-seed";
import { isDepartureAvailability } from "@/lib/group-departure-availability";
import { slugifyGroupTourId } from "@/lib/group-trip-content";

export const dynamic = "force-dynamic";

async function syncMirrorTour(input: {
  tourId: string;
  name: string;
  duration: string;
  image: string;
  price: number;
  reservation: number;
  description?: string;
  active?: boolean;
}) {
  const existing = await db.tour.findUnique({ where: { tourId: input.tourId } });
  const data = {
    name: input.name,
    subtitle: input.name,
    description: input.description ?? existing?.description ?? `Viaje grupal ${input.duration}`,
    image: input.image || existing?.image || "/images/atacama-new.png",
    tag: "Grupal",
    category: "grupal",
    price: input.price,
    duration: input.duration,
    minDepositPerPerson: input.reservation,
    active: input.active !== false,
  };
  if (existing) {
    await db.tour.update({ where: { tourId: input.tourId }, data });
  } else {
    const maxSort = await db.tour.aggregate({ _max: { sortOrder: true } });
    await db.tour.create({
      data: {
        tourId: input.tourId,
        ...data,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
  }
}

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
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    let tourId = String(body.tourId ?? "").trim() || slugifyGroupTourId(name);
    if (!tourId.startsWith("group-")) tourId = `group-${tourId}`;

    const clash = await db.groupTrip.findUnique({ where: { tourId } });
    if (clash) {
      tourId = `${tourId}-${Date.now().toString(36).slice(-4)}`;
    }

    const reservation = Number(body.reservation) || 100000;
    const price = Number(body.price) || 0;
    const duration = String(body.duration ?? "").trim() || "5D/4N";
    const image = String(body.image ?? "").trim() || "/images/atacama-new.png";

    const trip = await db.groupTrip.create({
      data: {
        tourId,
        name,
        duration,
        image,
        gradient: body.gradient ?? "from-teal-500 to-cyan-600",
        reservation,
        price,
        includesJson: JSON.stringify(body.includes ?? []),
        itineraryJson: JSON.stringify(body.itinerary ?? []),
        accommodationsJson: JSON.stringify(body.accommodations ?? []),
        sortOrder: body.sortOrder ?? 0,
        active: body.active !== false,
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

    await syncMirrorTour({
      tourId,
      name,
      duration,
      image,
      price,
      reservation,
      active: trip.active,
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error("[admin/group-trips POST]", error);
    return NextResponse.json({ error: "Error al crear viaje grupal" }, { status: 500 });
  }
}
