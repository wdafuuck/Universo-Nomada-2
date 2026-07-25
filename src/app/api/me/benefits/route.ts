import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { fetchMemberTripsForUser } from "@/lib/member-data";
import { mapBenefitsForMember } from "@/lib/benefit-eligibility";
import { isBenefitsEligible } from "@/lib/member-trips";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const trips = await fetchMemberTripsForUser(user.id, user.email);
  const globallyEligible = isBenefitsEligible(trips);

  const rows = await db.nomadBenefit.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  const benefits = mapBenefitsForMember(rows, trips);

  return NextResponse.json({
    eligible: globallyEligible,
    benefits,
    message: globallyEligible
      ? undefined
      : "Los beneficios se desbloquean con una reserva activa.",
  });
}
