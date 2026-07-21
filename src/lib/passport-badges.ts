import type { MemberTrip } from "@/lib/member-trips";

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

function collectTripText(trip: MemberTrip): string {
  const parts = [trip.destino ?? "", ...trip.items.map((i) => i.tourName)];
  return parts.join(" ").toLowerCase();
}

function badgeMatchesTrip(badge: PassportBadgeDef, trip: MemberTrip): boolean {
  const haystack = collectTripText(trip);
  const terms = [
    badge.slug.replace(/-/g, " "),
    badge.destination.toLowerCase(),
    badge.name.toLowerCase(),
    ...badge.matchTerms.map((t) => t.toLowerCase()),
  ].filter(Boolean);

  return terms.some((term) => haystack.includes(term));
}

export function computeEarnedBadges(
  badges: PassportBadgeDef[],
  pastTrips: MemberTrip[],
): EarnedBadge[] {
  const earned: EarnedBadge[] = [];
  const seen = new Set<string>();

  for (const trip of pastTrips) {
    if (!trip.isPast) continue;
    const earnedAt = trip.tripEndDate ?? trip.checkOut ?? trip.leadId;

    for (const badge of badges) {
      const key = `${badge.slug}:${trip.leadId}`;
      if (seen.has(key)) continue;
      if (!badgeMatchesTrip(badge, trip)) continue;
      seen.add(key);
      earned.push({
        ...badge,
        earnedAt,
        tripId: trip.leadId,
      });
    }
  }

  return earned.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));
}
