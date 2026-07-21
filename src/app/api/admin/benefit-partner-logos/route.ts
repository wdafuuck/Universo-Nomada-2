import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";

export async function GET() {
  try {
    const logos = await db.benefitPartnerLogo.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({ logos });
  } catch (e) {
    console.error("[admin/benefit-partner-logos GET]", e);
    return NextResponse.json({ error: "Error al obtener logos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.imageUrl?.trim()) {
      return NextResponse.json({ error: "La imagen es obligatoria" }, { status: 400 });
    }
    const logo = await db.benefitPartnerLogo.create({
      data: {
        name: String(body.name ?? ""),
        imageUrl: String(body.imageUrl),
        linkUrl: String(body.linkUrl ?? ""),
        active: body.active !== false,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return NextResponse.json({ logo }, { status: 201 });
  } catch (e) {
    console.error("[admin/benefit-partner-logos POST]", e);
    return NextResponse.json({ error: "Error al crear logo" }, { status: 500 });
  }
}
