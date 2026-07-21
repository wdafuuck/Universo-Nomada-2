import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { fetchMemberTripsForUser } from "@/lib/member-data";
import { isBenefitsEligible } from "@/lib/member-trips";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const trips = await fetchMemberTripsForUser(user.id, user.email);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "user",
    },
    upcoming: trips.filter((t) => t.isUpcoming),
    past: trips.filter((t) => t.isPast && t.status !== "cancelado"),
    benefitsEligible: isBenefitsEligible(trips),
  });
}
