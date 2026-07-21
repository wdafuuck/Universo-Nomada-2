import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/otp-auth";
import { tripDocumentLabel } from "@/lib/trip-documents";
import {
  cleanupExpiredTripDocuments,
  documentRetentionSummary,
  TRIP_DOCUMENT_RETENTION_DAYS,
} from "@/lib/trip-document-retention";

type Params = { params: Promise<{ leadId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { leadId } = await params;
  const id = Number(leadId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  await cleanupExpiredTripDocuments();

  const lead = await db.lead.findFirst({
    where: {
      id,
      OR: [{ userId: user.id }, { email: normalizeEmail(user.email) }],
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });
  }

  const retention = await documentRetentionSummary(lead);

  if (!retention.available) {
    return NextResponse.json({
      documents: [],
      ...retention,
      message: `Los documentos estuvieron disponibles ${TRIP_DOCUMENT_RETENTION_DAYS} días después de tu viaje y ya fueron eliminados.`,
    });
  }

  const documents = await db.tripDocument.findMany({
    where: { leadId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    documents: documents.map((d) => ({
      id: d.id,
      docType: d.docType,
      label: tripDocumentLabel(d.docType, d.label),
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      createdAt: d.createdAt.toISOString(),
    })),
    ...retention,
  });
}
