import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { syncPassportBadgesForUser } from "@/lib/passport-award";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { earned, locked, newlyAwarded, totalPastTrips } = await syncPassportBadgesForUser(
      user.id,
      user.email,
      { sendEmail: false }, // el correo lo envía el cron / admin al otorgar
    );

    return NextResponse.json({
      earned,
      locked,
      newlyAwarded,
      totalTrips: totalPastTrips,
    });
  } catch (e) {
    console.error("[me/passport]", e);
    return NextResponse.json({ error: "Error al cargar pasaporte" }, { status: 500 });
  }
}
