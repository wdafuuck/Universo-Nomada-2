import { TRIP_DOCUMENT_RETENTION_DAYS } from "@/lib/trip-documents";
import { getFirstCartLineMeta } from "@/lib/trip-dates";
import { formatDateCL } from "@/lib/reservation-payment";
import type { TripDocumentNotifyPreview, TripDocumentNotifyVariant } from "@/lib/trip-document-notify-client";

export type { TripDocumentNotifyPreview, TripDocumentNotifyVariant } from "@/lib/trip-document-notify-client";
export { TRIP_DOCUMENT_NOTIFY_VARIANTS } from "@/lib/trip-document-notify-client";

/** Días antes del inicio del viaje para sugerir el correo de recordatorio. */
export const TRIP_APPROACHING_DAYS = 21;

const VARIANT_LABELS: Record<TripDocumentNotifyVariant, string> = {
  confirmed: "Viaje confirmado — primera documentación",
  new_documents: "Nueva documentación disponible",
  reminder: "Recordatorio — viaje próximo",
};

type LeadNotifyContext = {
  id: number;
  nombre: string;
  email: string;
  destino: string | null;
  cartJson: string | null;
};

function parseIsoDateStart(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function daysUntilTripStart(cartJson: string | null, now = new Date()): number | null {
  const meta = getFirstCartLineMeta(cartJson);
  if (!meta.checkIn?.trim()) return null;
  const start = parseIsoDateStart(meta.checkIn.trim());
  return Math.ceil((start.getTime() - now.getTime()) / 86_400_000);
}

export function tripStartLabel(cartJson: string | null): string | null {
  const meta = getFirstCartLineMeta(cartJson);
  if (!meta.checkIn?.trim()) return null;
  return formatDateCL(meta.checkIn.trim());
}

export function resolveTripDocumentNotifyVariant(input: {
  documentCount: number;
  cartJson: string | null;
  now?: Date;
}): TripDocumentNotifyVariant {
  const now = input.now ?? new Date();

  if (input.documentCount <= 1) return "confirmed";

  const daysUntil = daysUntilTripStart(input.cartJson, now);
  if (daysUntil != null && daysUntil >= 0 && daysUntil <= TRIP_APPROACHING_DAYS) {
    return "reminder";
  }

  return "new_documents";
}

function buildSubject(
  variant: TripDocumentNotifyVariant,
  lead: LeadNotifyContext,
): string {
  const dest = lead.destino?.trim();
  switch (variant) {
    case "confirmed":
      return dest
        ? `✓ Tu viaje a ${dest} está confirmado — descarga tu documentación`
        : "✓ Tu viaje está confirmado — descarga tu documentación";
    case "reminder":
      return dest
        ? `¡Tu viaje a ${dest} se acerca! — descarga tu documentación`
        : "¡Tu viaje se acerca! — no olvides descargar tu documentación";
    default:
      return `Nueva documentación disponible — Reserva #${lead.id}`;
  }
}

function buildSummary(
  variant: TripDocumentNotifyVariant,
  lead: LeadNotifyContext,
  documentLabel?: string,
): string {
  const dest = lead.destino?.trim() || "tu viaje";
  const retention = TRIP_DOCUMENT_RETENTION_DAYS;

  switch (variant) {
    case "confirmed":
      return [
        "Tu viaje está confirmado.",
        documentLabel ? `Subimos: ${documentLabel}.` : "Ya tienes documentación disponible en tu perfil.",
        "Entra con tu correo a Mi cuenta y descarga tu documentación.",
        `Recuerda: podrás descargarla hasta ${retention} días después del fin del viaje.`,
      ].join(" ");

    case "reminder": {
      const days = daysUntilTripStart(lead.cartJson);
      const start = tripStartLabel(lead.cartJson);
      const countdown =
        days != null && days >= 0
          ? days === 0
            ? "¡Hoy comienza tu viaje!"
            : days === 1
              ? "Queda 1 día para tu viaje."
              : `Quedan ${days} días para tu viaje.`
          : "Tu viaje está muy cerca.";
      return [
        countdown,
        `No olvides entrar a Mi cuenta con tu correo y descargar la documentación de ${dest}.`,
        start ? `Salida: ${start}.` : "",
        `Los archivos estarán disponibles solo hasta ${retention} días después del fin del viaje.`,
      ]
        .filter(Boolean)
        .join(" ");
    }

    default:
      return [
        documentLabel ? `Subimos nuevo material: ${documentLabel}.` : "Hay nueva documentación en tu perfil.",
        "Entra con tu correo a Mi cuenta y descárgala.",
        `Los documentos solo estarán disponibles hasta ${retention} días después del fin del viaje.`,
      ].join(" ");
  }
}

export function buildTripDocumentNotifyPreview(
  lead: LeadNotifyContext,
  documentCount: number,
  options?: { variant?: TripDocumentNotifyVariant; documentLabel?: string },
): TripDocumentNotifyPreview {
  const variant =
    options?.variant ??
    resolveTripDocumentNotifyVariant({ documentCount, cartJson: lead.cartJson });

  return {
    variant,
    variantLabel: VARIANT_LABELS[variant],
    subject: buildSubject(variant, lead),
    summary: buildSummary(variant, lead, options?.documentLabel),
    customerEmail: lead.email,
    documentCount,
    daysUntilTrip: daysUntilTripStart(lead.cartJson),
    tripStartLabel: tripStartLabel(lead.cartJson),
    retentionDays: TRIP_DOCUMENT_RETENTION_DAYS,
  };
}
