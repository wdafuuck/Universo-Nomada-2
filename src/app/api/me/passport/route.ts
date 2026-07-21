import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { fetchMemberTripsForUser } from "@/lib/member-data";
import { badgeFromRow, computeEarnedBadges } from "@/lib/passport-badges";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const trips = await fetchMemberTripsForUser(user.id, user.email);
  const pastTrips = trips.filter((t) => t.isPast);

  const badgeRows = await db.passportBadge.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  const definitions = badgeRows.map(badgeFromRow);
  const earned = computeEarnedBadges(definitions, pastTrips);
  const earnedSlugs = new Set(earned.map((b) => b.slug));

  return NextResponse.json({
    earned,
    locked: definitions.filter((b) => !earnedSlugs.has(b.slug)),
    totalTrips: pastTrips.length,
  });
}
