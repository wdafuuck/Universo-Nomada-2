/**
 * Reglas de overbooking / cupos grupales (documentadas + testables).
 * No cambia la UI pública: solo lógica de negocio.
 */

import type { DepartureAvailability } from "@/lib/group-departure-availability";
import { normalizeDepartureAvailability } from "@/lib/group-departure-availability";

export type OverbookingPolicy = {
  /** No permitir vender si status es sold_out */
  blockWhenSoldOut: boolean;
  /** Umbral de spotsLeft para forzar last_spots */
  lastSpotsThreshold: number;
  /** Si true, spotsLeft <= 0 implica sold_out aunque status diga available */
  enforceSpotsLeft: boolean;
};

export const DEFAULT_OVERBOOKING_POLICY: OverbookingPolicy = {
  blockWhenSoldOut: true,
  lastSpotsThreshold: 2,
  enforceSpotsLeft: true,
};

export function canAcceptBooking(
  status: string | null | undefined,
  spotsLeft: number | undefined,
  policy: OverbookingPolicy = DEFAULT_OVERBOOKING_POLICY,
): { ok: boolean; reason?: string; availability: DepartureAvailability } {
  let availability = normalizeDepartureAvailability(status, spotsLeft);

  if (policy.enforceSpotsLeft && spotsLeft !== undefined) {
    if (spotsLeft <= 0) availability = "sold_out";
    else if (spotsLeft <= policy.lastSpotsThreshold) availability = "last_spots";
  }

  if (policy.blockWhenSoldOut && availability === "sold_out") {
    return { ok: false, reason: "sold_out", availability };
  }

  return { ok: true, availability };
}
