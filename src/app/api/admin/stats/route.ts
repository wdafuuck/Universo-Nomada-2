import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [totalLeads, totalPromotions, recentLeads] = await Promise.all([
      db.lead.count(),
      db.promotion.count({ where: { active: true } }),
      db.lead.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Leads by destination
    const allLeads = await db.lead.findMany({
      where: { destino: { not: null } },
      select: { destino: true },
    });

    const byDestination: Record<string, number> = {};
    allLeads.forEach((l) => {
      if (l.destino) {
        byDestination[l.destino] = (byDestination[l.destino] || 0) + 1;
      }
    });

    return NextResponse.json({
      totalLeads,
      totalPromotions,
      recentLeads,
      byDestination,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
