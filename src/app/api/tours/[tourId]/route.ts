import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toPublicTour } from "@/lib/tour-public";
import { isGroupTourVisible } from "@/lib/group-trips-visibility";

export const revalidate = 30;

type Params = { params: Promise<{ tourId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { tourId } = await params;
    const tour = await db.tour.findUnique({ where: { tourId } });
    if (!tour || !tour.active) {
      return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
    }
    if (!(await isGroupTourVisible(tourId))) {
      return NextResponse.json({ error: "Paquete no disponible" }, { status: 404 });
    }
    return NextResponse.json({ tour: toPublicTour(tour) });
  } catch {
    return NextResponse.json({ error: "Error al obtener paquete" }, { status: 500 });
  }
}
