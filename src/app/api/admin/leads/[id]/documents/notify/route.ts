import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { sendTripDocumentNotifyEmail } from "@/lib/email/trip-document-emails";
import {
  buildTripDocumentNotifyPreview,
  type TripDocumentNotifyVariant,
} from "@/lib/trip-document-notify";

type Params = { params: Promise<{ id: string }> };

const VALID_VARIANTS: TripDocumentNotifyVariant[] = ["confirmed", "new_documents", "reminder"];

export async function GET(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const variantRaw = searchParams.get("variant") as TripDocumentNotifyVariant | null;
  const variant = variantRaw && VALID_VARIANTS.includes(variantRaw) ? variantRaw : undefined;

  const documentCount = await db.tripDocument.count({ where: { leadId } });
  const preview = buildTripDocumentNotifyPreview(lead, documentCount, { variant });

  return NextResponse.json({ preview });
}

export async function POST(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  if (!lead.email?.trim()) {
    return NextResponse.json({ error: "La reserva no tiene correo del pasajero" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const variantRaw = body.variant as TripDocumentNotifyVariant | undefined;
  const variant = variantRaw && VALID_VARIANTS.includes(variantRaw) ? variantRaw : undefined;
  const documentLabel = typeof body.documentLabel === "string" ? body.documentLabel.trim() : undefined;

  const documentCount = await db.tripDocument.count({ where: { leadId } });
  if (documentCount === 0) {
    return NextResponse.json({ error: "No hay documentos para notificar" }, { status: 400 });
  }

  const result = await sendTripDocumentNotifyEmail({
    lead,
    documentCount,
    variant,
    documentLabel,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? (result.skipped ? "Correo no configurado" : "Error al enviar") },
      { status: result.skipped ? 503 : 500 },
    );
  }

  const preview = buildTripDocumentNotifyPreview(lead, documentCount, { variant, documentLabel });

  return NextResponse.json({ ok: true, preview });
}
