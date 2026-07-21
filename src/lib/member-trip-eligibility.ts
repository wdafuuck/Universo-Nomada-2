/** Tipo mínimo para elegibilidad de beneficios (sin dependencias de email/servidor). */
export type TripForEligibility = {
  isUpcoming: boolean;
  isPast: boolean;
  tripEndDate: string | null;
  checkOut: string | null;
};

export function getLastTripEndDate(trips: TripForEligibility[]): Date | null {
  const past = trips.filter((t) => t.isPast);
  if (!past.length) return null;
  let latest: Date | null = null;
  for (const trip of past) {
    const end = trip.tripEndDate ? new Date(trip.tripEndDate) : trip.checkOut ? new Date(trip.checkOut) : null;
    if (end && !Number.isNaN(end.getTime()) && (!latest || end > latest)) {
      latest = end;
    }
  }
  return latest;
}

export function hasActiveUpcomingTrip(trips: TripForEligibility[]): boolean {
  return trips.some((t) => t.isUpcoming);
}

export function isBenefitsEligible(trips: TripForEligibility[]): boolean {
  if (hasActiveUpcomingTrip(trips)) return true;
  const lastEnd = getLastTripEndDate(trips);
  if (!lastEnd) return false;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return lastEnd >= oneYearAgo;
}
