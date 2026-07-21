import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { isDepartureAvailability } from "@/lib/group-departure-availability";

type Params = { params: Promise<{ id: string }> };

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
      reservation: body.reservation,
      price: body.price,
      active: body.active !== false,
      sortOrder: body.sortOrder ?? 0,
      includesJson: JSON.stringify(body.includes ?? []),
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
  return NextResponse.json({ trip });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  await db.groupTrip.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
