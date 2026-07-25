import type { MemberTrip } from "@/lib/member-trips";
import {
  getLastTripEndDate,
  hasActiveUpcomingTrip,
  isBenefitsEligible,
} from "@/lib/member-trip-eligibility";

export type BenefitRow = {
  id: number;
  brandName: string;
  title: string;
  description: string;
  instructions: string;
  image: string;
  couponCode: string;
  discountLabel: string;
  restrictionType: string;
  restrictionDays: number | null;
  restrictionNote: string;
  active: boolean;
  sortOrder: number;
};

export type BenefitForMember = BenefitRow & {
  available: boolean;
  lockReason: string | null;
};

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

export function evaluateBenefitAvailability(
  benefit: BenefitRow,
  trips: MemberTrip[],
  globallyEligible: boolean,
): { available: boolean; lockReason: string | null } {
  if (!globallyEligible) {
    return {
      available: false,
      lockReason: "Se desbloquea con una reserva activa.",
    };
  }

  if (benefit.restrictionType === "upcoming_trip") {
    if (!hasActiveUpcomingTrip(trips)) {
      return {
        available: false,
        lockReason:
          benefit.restrictionNote.trim() ||
          "Se desbloquea con una reserva activa.",
      };
    }
    return { available: true, lockReason: null };
  }

  if (benefit.restrictionType === "post_trip_days") {
    const lastEnd = getLastTripEndDate(trips);
    if (!lastEnd) {
      return {
        available: false,
        lockReason: benefit.restrictionNote.trim() || "Disponible después de completar un viaje con nosotros.",
      };
    }

    const maxDays = benefit.restrictionDays ?? 30;
    const elapsed = daysSince(lastEnd);
    if (elapsed > maxDays) {
      const note =
        benefit.restrictionNote.trim() ||
        `Este beneficio estuvo disponible hasta ${maxDays} días después de tu viaje.`;
      return { available: false, lockReason: note };
    }

    const remaining = maxDays - elapsed;
    return {
      available: true,
      lockReason: remaining <= 7 ? `Quedan ${remaining} día${remaining === 1 ? "" : "s"} para usar este beneficio.` : null,
    };
  }

  return { available: true, lockReason: null };
}

export function mapBenefitsForMember(benefits: BenefitRow[], trips: MemberTrip[]): BenefitForMember[] {
  const globallyEligible = isBenefitsEligible(trips);
  return benefits.map((benefit) => {
    const { available, lockReason } = evaluateBenefitAvailability(benefit, trips, globallyEligible);
    if (available) {
      return { ...benefit, available, lockReason };
    }
    // No filtrar contenido sensible a quien aún no desbloqueó el beneficio
    return {
      ...benefit,
      description: "",
      instructions: "",
      couponCode: "",
      available,
      lockReason,
    };
  });
}
