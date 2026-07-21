export type DepartureAvailability = "available" | "last_spots" | "sold_out";

export const DEPARTURE_AVAILABILITY_OPTIONS: {
  value: DepartureAvailability;
  label: string;
}[] = [
  { value: "available", label: "Cupos disponibles" },
  { value: "last_spots", label: "Últimos cupos disponibles" },
  { value: "sold_out", label: "Sin cupo" },
];

export function isDepartureAvailability(value: string | null | undefined): value is DepartureAvailability {
  return value === "available" || value === "last_spots" || value === "sold_out";
}

/** Normaliza estado guardado o datos antiguos (spotsLeft/totalSpots). */
export function normalizeDepartureAvailability(
  status: string | null | undefined,
  spotsLeft?: number,
): DepartureAvailability {
  if (isDepartureAvailability(status)) return status;
  if (spotsLeft !== undefined) {
    if (spotsLeft <= 0) return "sold_out";
    if (spotsLeft <= 2) return "last_spots";
  }
  return "available";
}

export function departureAvailabilityLabel(
  status: DepartureAvailability,
  labels: { available: string; lastSpots: string; soldOut: string },
): string {
  if (status === "last_spots") return labels.lastSpots;
  if (status === "sold_out") return labels.soldOut;
  return labels.available;
}

export function departureAvailabilityClass(status: DepartureAvailability): string {
  if (status === "sold_out") return "bg-slate-200 text-slate-600";
  if (status === "last_spots") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}
