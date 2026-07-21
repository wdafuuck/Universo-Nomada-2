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
    const logo = await db.benefitPartnerLogo.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        imageUrl: body.imageUrl,
        linkUrl: body.linkUrl ?? "",
        active: body.active !== false,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return NextResponse.json({ logo });
  } catch {
    return NextResponse.json({ error: "Error al actualizar logo" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    await db.benefitPartnerLogo.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar logo" }, { status: 500 });
  }
}
