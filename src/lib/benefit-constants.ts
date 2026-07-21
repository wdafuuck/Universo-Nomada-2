export const BENEFIT_RESTRICTION_TYPES = [
  { value: "none", label: "Sin restricción extra" },
  { value: "post_trip_days", label: "Solo X días después del viaje" },
  { value: "upcoming_trip", label: "Solo con viaje programado" },
] as const;
