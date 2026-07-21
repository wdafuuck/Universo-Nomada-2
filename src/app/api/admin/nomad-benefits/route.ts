import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";

export async function GET() {
  try {
    const benefits = await db.nomadBenefit.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({ benefits });
  } catch {
    return NextResponse.json({ error: "Error al obtener beneficios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const benefit = await db.nomadBenefit.create({
      data: {
        brandName: String(body.brandName ?? ""),
        title: String(body.title ?? ""),
        description: String(body.description ?? ""),
        instructions: String(body.instructions ?? ""),
        image: String(body.image ?? ""),
        couponCode: String(body.couponCode ?? ""),
        discountLabel: String(body.discountLabel ?? ""),
        restrictionType: String(body.restrictionType ?? "none"),
        restrictionDays: body.restrictionDays != null ? Number(body.restrictionDays) : null,
        restrictionNote: String(body.restrictionNote ?? ""),
        active: body.active !== false,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return NextResponse.json({ benefit }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear beneficio" }, { status: 500 });
  }
}
