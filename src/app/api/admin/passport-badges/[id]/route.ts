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
    const badge = await db.passportBadge.update({
      where: { id: Number(id) },
      data: {
        slug: body.slug,
        name: body.name,
        destination: body.destination ?? body.name,
        description: body.description,
        image: body.image,
        emoji: body.emoji ?? "",
        matchTerms: typeof body.matchTerms === "string" ? body.matchTerms : JSON.stringify(body.matchTerms ?? []),
        active: body.active !== false,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return NextResponse.json({ badge });
  } catch {
    return NextResponse.json({ error: "Error al actualizar insignia" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    await db.passportBadge.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar insignia" }, { status: 500 });
  }
}
