import { NextRequest, NextResponse } from "next/server";
import type { Lead } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { TRIP_SOURCES } from "@/lib/trip-documents";
import { normalizeEmail } from "@/lib/otp-auth";
import {
  buildCartJsonFromLines,
  destinationFromCart,
  tripEndDateFromCartLines,
  type EditableCartLine,
} from "@/lib/admin-lead-edit";
import { checkOutFromCheckIn } from "@/lib/tour-duration";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const users = await db.user.findMany({
      where: { role: "user" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerifiedAt: true,
        createdAt: true,
        leads: {
          where: { source: { in: [...TRIP_SOURCES] } },
          select: {
            id: true,
            destino: true,
            status: true,
            source: true,
            cartTotal: true,
            amountDue: true,
            tripEndDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const leadIds = users.flatMap((u) => u.leads.map((l) => l.id));
    const docCountByLead = new Map<number, number>();

    if (leadIds.length > 0 && "tripDocument" in db) {
      try {
        const grouped = await db.tripDocument.groupBy({
          by: ["leadId"],
          where: { leadId: { in: leadIds } },
          _count: { _all: true },
        });
        for (const row of grouped) {
          docCountByLead.set(row.leadId, row._count._all);
        }
      } catch {
        /* cliente o tabla aún no disponible */
      }
    }

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        leads: user.leads.map((lead) => ({
          ...lead,
          _count: { documents: docCountByLead.get(lead.id) ?? 0 },
        })),
      })),
    });
  } catch (e) {
    console.error("[admin/users]", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: process.env.NODE_ENV !== "production" ? message : "Error al obtener clientes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const name = String(body.name ?? body.nombre ?? "").trim();
    const email = normalizeEmail(String(body.email ?? ""));
    const telefono = String(body.telefono ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese correo", userId: existing.id },
        { status: 409 },
      );
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        role: "user",
      },
    });

    // Vincular reservas previas del mismo correo (sin cuenta)
    await db.lead.updateMany({
      where: { email, userId: null },
      data: { userId: user.id, ...(telefono ? { telefono } : {}) },
    });

    let lead: Lead | null = null;
    const trip = body.trip as Record<string, unknown> | undefined;
    const cartItems = Array.isArray(trip?.cartItems)
      ? (trip.cartItems as EditableCartLine[])
      : [];

    if (cartItems.length > 0 && cartItems[0]?.tourName?.trim()) {
      const tourIds = cartItems.map((i) => i.tourId).filter(Boolean) as string[];
      const tours = tourIds.length
        ? await db.tour.findMany({ where: { tourId: { in: tourIds } }, select: { tourId: true, duration: true } })
        : [];
      const durationByTour = Object.fromEntries(tours.map((t) => [t.tourId, t.duration]));

      const enrichedItems = cartItems.map((item) => {
        const duration = item.duration || durationByTour[item.tourId ?? ""] || null;
        const checkOut =
          item.checkOut ||
          (item.checkIn && duration ? checkOutFromCheckIn(item.checkIn, duration) : item.checkOut);
        return { ...item, duration: duration || undefined, checkOut };
      });

      const cartJson = buildCartJsonFromLines(enrichedItems);
      const destino =
        String(trip?.destino ?? "").trim() || destinationFromCart(enrichedItems);

      lead = await db.lead.create({
        data: {
          userId: user.id,
          nombre: name,
          email,
          telefono: telefono || "+56",
          destino,
          status: String(trip?.status ?? "reservado"),
          source: "admin-manual",
          cartJson,
          cartTotal:
            Number(trip?.cartTotal) ||
            enrichedItems.reduce((s, i) => s + (i.totalPrice || 0), 0),
          amountDue: Number(trip?.amountDue) || 0,
          paymentMethod: "admin",
          paymentPlan: "total",
          tripEndDate: tripEndDateFromCartLines(enrichedItems),
          mensaje: "Cliente y viaje registrados manualmente por admin",
        },
      });

      const initialPaid = Number(trip?.amountDue) || 0;
      if (initialPaid > 0) {
        await db.leadPayment.create({
          data: {
            leadId: lead.id,
            amount: initialPaid,
            method: "admin",
            note: "Abono inicial al crear el viaje",
          },
        });
      }
    }

    return NextResponse.json({ user, lead }, { status: 201 });
  } catch (e) {
    console.error("[admin/users POST]", e);
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}
