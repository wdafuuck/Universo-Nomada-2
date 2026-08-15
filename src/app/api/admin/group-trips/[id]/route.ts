import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { isDepartureAvailability } from "@/lib/group-departure-availability";

type Params = { params: Promise<{ id: string }> };

async function syncMirrorTour(input: {
  tourId: string;
  name: string;
  duration: string;
  image: string;
  price: number;
  reservation: number;
  active: boolean;
}) {
  const existing = await db.tour.findUnique({ where: { tourId: input.tourId } });
  const data = {
    name: input.name,
    subtitle: input.name,
    image: input.image || existing?.image || "/images/atacama-new.png",
    tag: "Grupal",
    category: "grupal",
    price: input.price,
    duration: input.duration,
    minDepositPerPerson: input.reservation,
    active: input.active,
  };
  if (existing) {
    await db.tour.update({ where: { tourId: input.tourId }, data });
  } else {
    await db.tour.create({
      data: {
        tourId: input.tourId,
        description: `Viaje grupal ${input.duration}`,
        ...data,
        sortOrder: 99,
      },
    });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();

  await db.groupDeparture.deleteMany({ where: { groupTripId: Number(id) } });

  const trip = await db.groupTrip.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      duration: body.duration,
      image: body.image,
      gradient: body.gradient,
      reservation: Number(body.reservation) || 0,
      price: Number(body.price) || 0,
      active: body.active !== false,
      sortOrder: body.sortOrder ?? 0,
      includesJson: JSON.stringify(body.includes ?? []),
      itineraryJson: JSON.stringify(body.itinerary ?? []),
      accommodationsJson: JSON.stringify(body.accommodations ?? []),
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
    tourId: trip.tourId,
    name: trip.name,
    duration: trip.duration,
    image: trip.image,
    price: trip.price,
    reservation: trip.reservation,
    active: trip.active,
  });

  return NextResponse.json({ trip });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "active debe ser boolean" }, { status: 400 });
  }
  const trip = await db.groupTrip.update({
    where: { id: Number(id) },
    data: { active: body.active },
    include: { departures: true },
  });
  await db.tour.updateMany({
    where: { tourId: trip.tourId },
    data: { active: body.active },
  });
  return NextResponse.json({ trip });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await db.groupTrip.findUnique({ where: { id: Number(id) } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  await db.groupTrip.delete({ where: { id: Number(id) } });
  await db.tour.updateMany({
    where: { tourId: existing.tourId },
    data: { active: false },
  });
  return NextResponse.json({ ok: true });
}
