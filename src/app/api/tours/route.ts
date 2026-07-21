import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { toPublicTour } from "@/lib/tour-public";
import {
  filterToursByGroupVisibility,
  getActiveGroupTourIds,
} from "@/lib/group-trips-visibility";

export const revalidate = 30;

async function ensureToursSeeded() {
  const count = await db.tour.count();
  if (count === 0) {
    for (const t of DEFAULT_TOURS) {
      await db.tour.create({ data: t });
    }
  }
}

export async function GET() {
  try {
    await ensureToursSeeded();
    const tours = await db.tour.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    const activeGroupIds = await getActiveGroupTourIds();
    const visible = filterToursByGroupVisibility(tours, activeGroupIds);
    return NextResponse.json({ tours: visible.map(toPublicTour) }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener tours" }, { status: 500 });
  }
}
