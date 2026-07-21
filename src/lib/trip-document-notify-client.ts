/** Tipos y etiquetas usados en el admin (cliente) — sin dependencias de servidor. */

export type TripDocumentNotifyVariant = "confirmed" | "new_documents" | "reminder";

export type TripDocumentNotifyPreview = {
  variant: TripDocumentNotifyVariant;
  variantLabel: string;
  subject: string;
  summary: string;
  customerEmail: string;
  documentCount: number;
  daysUntilTrip: number | null;
  tripStartLabel: string | null;
  retentionDays: number;
};

export const TRIP_DOCUMENT_NOTIFY_VARIANTS: {
  value: TripDocumentNotifyVariant;
  label: string;
}[] = [
  { value: "confirmed", label: "Viaje confirmado — primera documentación" },
  { value: "new_documents", label: "Nueva documentación disponible" },
  { value: "reminder", label: "Recordatorio — viaje próximo" },
];
