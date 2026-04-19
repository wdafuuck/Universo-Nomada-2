import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const leads = await db.lead.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leads });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener leads" },
      { status: 500 }
    );
  }
}
