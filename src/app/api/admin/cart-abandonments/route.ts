import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";
import { getRequestTenantId } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenantId = getRequestTenantId(request);
  const items = await db.cartAbandonment.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    items: items.map((row) => ({
      id: row.id,
      email: row.email,
      nombre: row.nombre,
      telefono: row.telefono,
      cartTotal: row.cartTotal,
      reminder1At: row.reminder1At,
      reminderPrizeAt: row.reminderPrizeAt,
      reminder2At: row.reminder2At,
      convertedAt: row.convertedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      converted: Boolean(row.convertedAt),
    })),
  });
}
