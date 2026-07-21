import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const benefit = await db.nomadBenefit.update({
      where: { id: Number(id) },
      data: {
        brandName: body.brandName,
        title: body.title,
        description: body.description,
        instructions: body.instructions,
        image: body.image,
        couponCode: body.couponCode,
        discountLabel: body.discountLabel,
        restrictionType: body.restrictionType ?? "none",
        restrictionDays: body.restrictionDays != null ? Number(body.restrictionDays) : null,
        restrictionNote: body.restrictionNote ?? "",
        active: body.active !== false,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return NextResponse.json({ benefit });
  } catch {
    return NextResponse.json({ error: "Error al actualizar beneficio" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    await db.nomadBenefit.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar beneficio" }, { status: 500 });
  }
}
