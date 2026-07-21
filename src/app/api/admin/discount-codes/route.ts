import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { formatDiscountLabel, normalizeDiscountCode, type DiscountType } from "@/lib/discount-codes";

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

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const codes = await db.discountCode.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }] });
    return NextResponse.json({ codes });
  } catch (e) {
    console.error("[admin/discount-codes GET]", e);
    return NextResponse.json({ error: "Error al obtener códigos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = parseBody(body);
    const err = validatePayload(payload);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const existing = await db.discountCode.findUnique({ where: { code: payload.code } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un código con ese nombre" }, { status: 409 });
    }

    const code = await db.discountCode.create({
      data: {
        code: payload.code,
        description: payload.description,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        active: payload.active,
        validUntil: payload.validUntil,
      },
    });

    return NextResponse.json({
      code,
      label: formatDiscountLabel(payload.discountType, payload.discountValue),
    }, { status: 201 });
  } catch (e) {
    console.error("[admin/discount-codes POST]", e);
    return NextResponse.json({ error: "Error al crear código" }, { status: 500 });
  }
}
