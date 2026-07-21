import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const logos = await db.benefitPartnerLogo.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, name: true, imageUrl: true, linkUrl: true },
    });
    return NextResponse.json({ logos });
  } catch {
    return NextResponse.json({ logos: [] });
  }
}
