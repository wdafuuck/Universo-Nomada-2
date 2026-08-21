import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { updateUserEmailWithMerge } from "@/lib/merge-users";
import { syncPassportBadgesForUser } from "@/lib/passport-award";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const body = await request.json();
    const hasEmail = body.email !== undefined;
    const hasName = body.name !== undefined || body.nombre !== undefined;

    if (!hasEmail && !hasName) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    if (hasEmail) {
      const result = await updateUserEmailWithMerge(id, String(body.email), {
        name: hasName ? String(body.name ?? body.nombre ?? "") : undefined,
      });
      return NextResponse.json({
        user: result.user,
        merged: result.merged,
        mergedFromEmail: result.mergedFromEmail,
      });
    }

    const name = String(body.name ?? body.nombre ?? "").trim() || null;
    const user = await db.user.update({
      where: { id },
      data: { name },
      select: { id: true, email: true, name: true },
    });
    return NextResponse.json({ user, merged: false, mergedFromEmail: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al actualizar";
    const status =
      message.includes("no encontrado") ? 404
      : message.includes("inválido") || message.includes("staff") || message.includes("Solo") ? 400
      : 500;
    console.error("[admin/users PATCH]", e);
    return NextResponse.json({ error: message }, { status });
  }
}

/** Recalcula insignias del cliente según títulos de viajes terminados. */
export async function POST(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const body = await request.json().catch(() => ({}));
    if (body?.action !== "sync-badges") {
      return NextResponse.json({ error: "Acción no soportada" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user || user.role !== "user") {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const result = await syncPassportBadgesForUser(user.id, user.email, {
      sendEmail: body.sendEmail !== false,
      customerName: user.name ?? undefined,
    });

    return NextResponse.json({
      earnedCount: result.earned.length,
      newlyAwarded: result.newlyAwarded.map((b) => ({
        id: b.id,
        name: b.name,
        emoji: b.emoji,
      })),
      emailSent: result.emailSent,
    });
  } catch (e) {
    console.error("[admin/users POST sync-badges]", e);
    return NextResponse.json({ error: "Error al sincronizar insignias" }, { status: 500 });
  }
}
