import { createHmac, timingSafeEqual } from "node:crypto";
import { getSessionSecret } from "@/lib/env";

/** Token corto para abrir /api/reservations/:id sin sesión (confirmación post-checkout). */
export function reservationAccessToken(leadId: number | string): string {
  const id = String(leadId);
  return createHmac("sha256", getSessionSecret())
    .update(`reservation-access:${id}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyReservationAccessToken(leadId: number | string, token: string | null | undefined): boolean {
  if (!token?.trim()) return false;
  const expected = reservationAccessToken(leadId);
  try {
    const a = Buffer.from(token.trim());
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
