import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { TRIP_DOCUMENT_TYPES } from "@/lib/trip-documents";
import {
  cleanupExpiredTripDocuments,
  documentRetentionSummary,
  TRIP_DOCUMENT_RETENTION_DAYS,
} from "@/lib/trip-document-retention";
import { buildTripDocumentNotifyPreview } from "@/lib/trip-document-notify";
import { tripDocumentLabel } from "@/lib/trip-documents";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  await cleanupExpiredTripDocuments();

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const documents = await db.tripDocument.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    documents,
    retention: await documentRetentionSummary(lead),
    retentionDays: TRIP_DOCUMENT_RETENTION_DAYS,
  });
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

  const body = await request.json();
  const docType = String(body.docType ?? "");
  const fileUrl = String(body.fileUrl ?? "").trim();
  const fileName = String(body.fileName ?? "").trim();
  const label = String(body.label ?? "").trim();

  if (!fileUrl) {
    return NextResponse.json({ error: "URL del archivo requerida" }, { status: 400 });
  }

  const validType = TRIP_DOCUMENT_TYPES.some((t) => t.value === docType);
  if (!validType) {
    return NextResponse.json({ error: "Tipo de documento inválido" }, { status: 400 });
  }

  const document = await db.tripDocument.create({
    data: { leadId, docType, fileUrl, fileName, label },
  });

  const documentCount = await db.tripDocument.count({ where: { leadId } });
  const notify = buildTripDocumentNotifyPreview(lead, documentCount, {
    documentLabel: tripDocumentLabel(docType, label),
  });

  return NextResponse.json({ document, notify }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = Number(id);
  const { searchParams } = new URL(request.url);
  const docId = Number(searchParams.get("docId"));

  if (!Number.isFinite(leadId) || !Number.isFinite(docId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const existing = await db.tripDocument.findFirst({ where: { id: docId, leadId } });
  if (!existing) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  await db.tripDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
