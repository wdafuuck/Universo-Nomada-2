export const TRIP_DOCUMENT_TYPES = [
  { value: "comprobante_reserva", label: "Comprobante de reserva" },
  { value: "comprobante_vuelo", label: "Comprobante de vuelo" },
  { value: "entradas", label: "Entradas / tickets" },
  { value: "tips_viaje", label: "Tips de viaje" },
  { value: "seguro_viajes", label: "Seguro de viajes" },
  { value: "otro", label: "Otro documento" },
] as const;

export type TripDocumentType = (typeof TRIP_DOCUMENT_TYPES)[number]["value"];

export function tripDocumentLabel(docType: string, customLabel?: string | null): string {
  if (docType === "otro" && customLabel?.trim()) return customLabel.trim();
  return TRIP_DOCUMENT_TYPES.find((t) => t.value === docType)?.label ?? docType;
}

export const TRIP_SOURCES = ["carrito", "admin-manual"] as const;

/** Días que el pasajero puede descargar documentos después de finalizar el viaje. */
export const TRIP_DOCUMENT_RETENTION_DAYS = 7;

export type TripSource = (typeof TRIP_SOURCES)[number];

export function isTripLeadSource(source: string): boolean {
  return (TRIP_SOURCES as readonly string[]).includes(source);
}
