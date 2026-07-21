import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { normalizeDiscountCode, type DiscountType } from "@/lib/discount-codes";

type Params = { params: Promise<{ id: string }> };

function parseBody(body: Record<string, unknown>) {
  const code = normalizeDiscountCode(String(body.code ?? ""));
  const discountType: DiscountType = body.discountType === "fixed" ? "fixed" : "percent";
  const discountValue = Math.round(Number(body.discountValue) || 0);
  const description = String(body.description ?? "").trim();
  const active = body.active !== false;
  const validUntilRaw = body.validUntil ? String(body.validUntil).trim() : "";
  const validUntil = validUntilRaw ? new Date(`${validUntilRaw}T23:59:59`) : null;

  return { code, discountType, discountValue, description, active, validUntil };
}

function validatePayload(payload: ReturnType<typeof parseBody>): string | null {
  if (!payload.code) return "El código es obligatorio";
  if (payload.discountType === "percent" && (payload.discountValue <= 0 || payload.discountValue > 100)) {
    return "El porcentaje debe estar entre 1 y 100";
  }
  if (payload.discountType === "fixed" && payload.discountValue <= 0) {
    return "El monto fijo debe ser mayor a 0";
  }
  if (payload.validUntil && Number.isNaN(payload.validUntil.getTime())) {
    return "Fecha de vencimiento inválida";
  }
  return null;
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const payload = parseBody(body);
    const err = validatePayload(payload);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const numId = Number(id);
    const duplicate = await db.discountCode.findFirst({
      where: { code: payload.code, NOT: { id: numId } },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Ya existe otro código con ese nombre" }, { status: 409 });
    }

    const code = await db.discountCode.update({
      where: { id: numId },
      data: {
        code: payload.code,
        description: payload.description,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        active: payload.active,
        validUntil: payload.validUntil,
      },
    });

    return NextResponse.json({ code });
  } catch (e) {
    console.error("[admin/discount-codes PUT]", e);
    return NextResponse.json({ error: "Error al actualizar código" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { active } = await request.json();
    const code = await db.discountCode.update({
      where: { id: Number(id) },
      data: { active: Boolean(active) },
    });
    return NextResponse.json({ code });
  } catch (e) {
    console.error("[admin/discount-codes PATCH]", e);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await db.discountCode.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/discount-codes DELETE]", e);
    return NextResponse.json({ error: "Error al eliminar código" }, { status: 500 });
  }
}
