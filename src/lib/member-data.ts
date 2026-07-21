import { db } from "@/lib/db";
import { leadToMemberTrip, type MemberTrip } from "@/lib/member-trips";
import { normalizeEmail } from "@/lib/otp-auth";
import { TRIP_SOURCES } from "@/lib/trip-documents";

export async function fetchMemberTripsForUser(userId: string, email: string): Promise<MemberTrip[]> {
  const normalized = normalizeEmail(email);
  const leads = await db.lead.findMany({
    where: {
      source: { in: [...TRIP_SOURCES] },
      email: { notIn: ["carrito@universonomada.cl", ""] },
      OR: [{ userId }, { email: normalized }],
    },
    orderBy: { createdAt: "desc" },
  });

  return leads
    .map((lead) => leadToMemberTrip({ ...lead, source: lead.source }))
    .filter((t): t is MemberTrip => t !== null);
}
