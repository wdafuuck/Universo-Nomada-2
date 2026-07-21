import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();

    const promotion = await db.promotion.update({
      where: { id: Number(id) },
      data: {
        title: body.title,
        subtitle: body.subtitle,
        discount: body.discount,
        destination: body.destination,
        validUntil: body.validUntil,
        originalPrice: Number(body.originalPrice),
        discountPrice: Number(body.discountPrice),
        emoji: body.emoji,
        image: body.image,
        active: body.active !== false,
      },
    });

    return NextResponse.json({ promotion });
  } catch {
    return NextResponse.json({ error: "Error al actualizar promoción" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    await db.promotion.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar promoción" }, { status: 500 });
  }
}
