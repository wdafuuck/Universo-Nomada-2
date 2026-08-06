import type { MemberTrip } from "@/lib/member-trips";
import { isCancelledStatus } from "@/lib/reservation-payment";

export type PassportBadgeDef = {
  id: number;
  slug: string;
  name: string;
  destination: string;
  description: string;
  image: string;
  emoji: string;
  matchTerms: string[];
};

export type EarnedBadge = PassportBadgeDef & {
  earnedAt: string;
  tripId: string;
};

function parseMatchTerms(json: string): string[] {
  try {
    const arr = JSON.parse(json) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function badgeFromRow(row: {
  id: number;
  slug: string;
  name: string;
  destination: string;
  description: string;
  image: string;
  emoji: string;
  matchTerms: string;
}): PassportBadgeDef {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    destination: row.destination,
    description: row.description,
    image: row.image,
    emoji: row.emoji,
    matchTerms: parseMatchTerms(row.matchTerms),
  };
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set([
  "del",
  "de",
  "la",
  "las",
  "el",
  "los",
  "y",
  "the",
  "and",
  "san",
  "santa",
]);

function significantTokens(s: string): string[] {
  return norm(s)
    .split(" ")
    .filter((t) => t.length >= 4 && !STOP.has(t));
}

/** Texto del viaje + tourIds del cart (si vienen en cartJson). */
export function collectTripText(trip: MemberTrip, cartJson?: string | null): string {
  const parts = [trip.destino ?? "", ...trip.items.map((i) => i.tourName)];
  if (cartJson) {
    try {
      const raw = JSON.parse(cartJson) as { tourId?: string; tourName?: string }[];
      if (Array.isArray(raw)) {
        for (const item of raw) {
          if (item.tourId) parts.push(item.tourId);
          if (item.tourName) parts.push(item.tourName);
        }
      }
    } catch {
      /* ignore */
    }
  }
  return norm(parts.join(" "));
}

export function badgeMatchesTrip(
  badge: PassportBadgeDef,
  trip: MemberTrip,
  cartJson?: string | null,
): boolean {
  const haystack = collectTripText(trip, cartJson);
  if (!haystack) return false;

  const phrases = [
    badge.slug,
    badge.destination,
    badge.name,
    ...badge.matchTerms,
  ]
    .map(norm)
    .filter((t) => t.length >= 3);

  // Frase completa (ej. "rapa nui")
  if (phrases.some((term) => haystack.includes(term))) return true;

  // Tokens significativos (ej. insignia "Cataratas del Iguazú" ↔ viaje "Iguazú 5D/4N")
  const badgeTokens = new Set<string>();
  for (const p of phrases) {
    for (const tok of significantTokens(p)) badgeTokens.add(tok);
  }
  const tripTokens = significantTokens(haystack);
  return tripTokens.some((t) => badgeTokens.has(t));
}

/** Viajes que cuentan para insignias (pasados y no cancelados). */
export function tripsEligibleForBadges(trips: MemberTrip[]): MemberTrip[] {
  return trips.filter((t) => t.isPast && !isCancelledStatus(t.status));
}

export function computeEarnedBadges(
  badges: PassportBadgeDef[],
  pastTrips: MemberTrip[],
  cartJsonByLeadId?: Record<string, string | null>,
): EarnedBadge[] {
  const earned: EarnedBadge[] = [];
  const seenBadge = new Set<number>();

  for (const trip of tripsEligibleForBadges(pastTrips)) {
    const earnedAt = trip.tripEndDate ?? trip.checkOut ?? trip.leadId;
    const cartJson = cartJsonByLeadId?.[trip.leadId] ?? null;

    for (const badge of badges) {
      if (seenBadge.has(badge.id)) continue;
      if (!badgeMatchesTrip(badge, trip, cartJson)) continue;
      seenBadge.add(badge.id);
      earned.push({
        ...badge,
        earnedAt,
        tripId: trip.leadId,
      });
    }
  }

  return earned.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));
}
