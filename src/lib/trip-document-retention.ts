import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import {
  isoDateToEndOfDay,
  resolveTripEndDateFromCart,
  resolveTripEndIsoFromCart,
  getFirstCartLineMeta,
} from "@/lib/trip-dates";
import { TRIP_DOCUMENT_RETENTION_DAYS } from "@/lib/trip-documents";

export { TRIP_DOCUMENT_RETENTION_DAYS };

type LeadForRetention = {
  tripEndDate: Date | null;
  cartJson: string | null;
  status?: string;
};

async function tourDurationFromCart(cartJson: string | null): Promise<string | null> {
  const meta = getFirstCartLineMeta(cartJson);
  if (meta.duration?.trim()) return meta.duration.trim();
  if (!meta.tourId) return null;

  const tour = await db.tour.findUnique({
    where: { tourId: meta.tourId },
    select: { duration: true },
  });
  return tour?.duration?.trim() || null;
}

export async function resolveLeadTripEnd(lead: LeadForRetention): Promise<Date | null> {
  if (lead.tripEndDate) return lead.tripEndDate;

  const duration = await tourDurationFromCart(lead.cartJson);
  const fromCart = resolveTripEndDateFromCart(lead.cartJson, duration);
  if (fromCart) return fromCart;

  return null;
}

/** Versión síncrona cuando la duración ya está en cartJson o hay checkOut guardado. */
export function resolveLeadTripEndSync(lead: LeadForRetention): Date | null {
  if (lead.tripEndDate) return lead.tripEndDate;
  return resolveTripEndDateFromCart(lead.cartJson);
}

export function getDocumentDownloadDeadline(tripEnd: Date): Date {
  const deadline = new Date(tripEnd);
  deadline.setDate(deadline.getDate() + TRIP_DOCUMENT_RETENTION_DAYS);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

export function areTripDocumentsAvailable(lead: LeadForRetention, now = new Date()): boolean {
  const tripEnd = resolveLeadTripEndSync(lead);
  if (!tripEnd) return true;
  return now <= getDocumentDownloadDeadline(tripEnd);
}

export function daysUntilDocumentExpiry(lead: LeadForRetention, now = new Date()): number | null {
  const tripEnd = resolveLeadTripEndSync(lead);
  if (!tripEnd) return null;

  const deadline = getDocumentDownloadDeadline(tripEnd);
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

async function deleteUploadFile(fileUrl: string): Promise<void> {
  if (!fileUrl.startsWith("/uploads/")) return;
  const filePath = path.join(process.cwd(), "public", fileUrl);
  try {
    await fs.unlink(filePath);
  } catch {
    /* archivo ya eliminado o inexistente */
  }
}

/** Elimina documentos y archivos cuyo plazo de descarga ya venció. */
export async function cleanupExpiredTripDocuments(): Promise<number> {
  const now = new Date();
  const leads = await db.lead.findMany({
    where: { documents: { some: {} } },
    include: { documents: true },
  });

  let deleted = 0;

  for (const lead of leads) {
    const tripEnd = await resolveLeadTripEnd(lead);
    if (!tripEnd || now <= getDocumentDownloadDeadline(tripEnd)) continue;

    for (const doc of lead.documents) {
      await deleteUploadFile(doc.fileUrl);
      deleted += 1;
    }

    await db.tripDocument.deleteMany({ where: { leadId: lead.id } });
  }

  return deleted;
}

export async function documentRetentionSummary(lead: LeadForRetention, now = new Date()) {
  const tripEnd = await resolveLeadTripEnd(lead);
  const endIso = resolveTripEndIsoFromCart(lead.cartJson);

  if (!tripEnd) {
    return {
      available: true,
      tripEnded: false,
      tripEndIso: endIso,
      downloadUntil: null as string | null,
      daysRemaining: null as number | null,
    };
  }

  const deadline = getDocumentDownloadDeadline(tripEnd);
  const daysRemaining = Math.max(
    0,
    Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000),
  );

  return {
    available: now <= deadline,
    tripEnded: now > isoDateToEndOfDay(endIso ?? tripEnd.toISOString().slice(0, 10)),
    tripEndIso: endIso ?? tripEnd.toISOString().slice(0, 10),
    downloadUntil: deadline.toISOString(),
    daysRemaining: now <= deadline ? daysRemaining : 0,
  };
}
