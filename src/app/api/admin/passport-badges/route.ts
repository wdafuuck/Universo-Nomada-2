import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";

export async function GET() {
  try {
    const badges = await db.passportBadge.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({ badges });
  } catch {
    return NextResponse.json({ error: "Error al obtener insignias" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const badge = await db.passportBadge.create({
      data: {
        slug: String(body.slug ?? `badge-${Date.now()}`),
        name: String(body.name ?? ""),
        destination: String(body.destination ?? body.name ?? ""),
        description: String(body.description ?? ""),
        image: String(body.image ?? ""),
        emoji: String(body.emoji ?? ""),
        matchTerms: typeof body.matchTerms === "string" ? body.matchTerms : JSON.stringify(body.matchTerms ?? []),
        active: body.active !== false,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return NextResponse.json({ badge }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear insignia" }, { status: 500 });
  }
}
