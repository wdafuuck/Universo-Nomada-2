import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import {
  buildCartJsonFromLines,
  destinationFromCart,
  tripEndDateFromCartLines,
  type EditableCartLine,
} from "@/lib/admin-lead-edit";
import { checkOutFromCheckIn } from "@/lib/tour-duration";
import { normalizeEmail } from "@/lib/otp-auth";
import { TRIP_SOURCES } from "@/lib/trip-documents";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const leads = await db.lead.findMany({
      orderBy: { createdAt: "desc" },
    });

    const docCountByLead = new Map<number, number>();
    if ("tripDocument" in db) {
      try {
        const grouped = await db.tripDocument.groupBy({
          by: ["leadId"],
          _count: { _all: true },
        });
        for (const row of grouped) {
          docCountByLead.set(row.leadId, row._count._all);
        }
      } catch {
        /* tabla de documentos no disponible aún */
      }
    }

    return NextResponse.json({
      leads: leads.map((lead) => ({
        ...lead,
        _count: { documents: docCountByLead.get(lead.id) ?? 0 },
      })),
    });
  } catch (e) {
    console.error("[admin/leads GET]", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: process.env.NODE_ENV !== "production" ? message : "Error al obtener leads" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const nombre = String(body.nombre ?? "").trim();
    const email = normalizeEmail(String(body.email ?? ""));
    const telefono = String(body.telefono ?? "").trim();
    const userId = body.userId ? String(body.userId) : null;

    if (!nombre || !email || !telefono) {
      return NextResponse.json({ error: "Nombre, email y teléfono son obligatorios" }, { status: 400 });
    }

    const cartItems = Array.isArray(body.cartItems) ? (body.cartItems as EditableCartLine[]) : [];
    if (!cartItems.length || !cartItems[0]?.tourName?.trim()) {
      return NextResponse.json({ error: "Agrega al menos un paquete al viaje" }, { status: 400 });
    }

    let linkedUserId = userId;
    if (!linkedUserId) {
      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        linkedUserId = existingUser.id;
      } else {
        const newUser = await db.user.create({
          data: { email, name: nombre, role: "user" },
        });
        linkedUserId = newUser.id;
      }
    }

    const tourIds = cartItems.map((i) => i.tourId).filter(Boolean) as string[];
    const tours = tourIds.length
      ? await db.tour.findMany({ where: { tourId: { in: tourIds } }, select: { tourId: true, duration: true } })
      : [];
    const durationByTour = Object.fromEntries(tours.map((t) => [t.tourId, t.duration]));

    const enrichedItems = cartItems.map((item) => {
      const duration = item.duration || durationByTour[item.tourId ?? ""] || body.duration || null;
      const checkOut = item.checkOut || (item.checkIn && duration ? checkOutFromCheckIn(item.checkIn, duration) : item.checkOut);
      return { ...item, duration: duration || undefined, checkOut };
    });

    const cartJson = buildCartJsonFromLines(enrichedItems);
    const destino = String(body.destino ?? "").trim() || destinationFromCart(enrichedItems);
    const autoTripEnd = tripEndDateFromCartLines(enrichedItems);

    const lead = await db.lead.create({
      data: {
        userId: linkedUserId,
        nombre,
        email,
        telefono,
        destino,
        status: body.status ?? "reservado",
        source: "admin-manual",
        cartJson,
        cartTotal: Number(body.cartTotal) || enrichedItems.reduce((s, i) => s + (i.totalPrice || 0), 0),
        amountDue: Number(body.amountDue) || 0,
        paymentMethod: body.paymentMethod || "admin",
        paymentPlan: body.paymentPlan || "total",
        tripEndDate: autoTripEnd,
        mensaje: body.notes ? String(body.notes) : "Viaje registrado manualmente por admin",
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (e) {
    console.error("[admin/leads POST]", e);
    return NextResponse.json({ error: "Error al crear viaje" }, { status: 500 });
  }
}
