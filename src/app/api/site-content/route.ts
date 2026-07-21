import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key requerido" }, { status: 400 });
  }
  const row = await db.siteContent.findUnique({ where: { key } });
  if (!row) return NextResponse.json({ content: null });
  return NextResponse.json({ content: JSON.parse(row.json) });
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await request.json();
  const { key, content } = body;
  if (!key || content === undefined) {
    return NextResponse.json({ error: "key y content requeridos" }, { status: 400 });
  }
  const row = await db.siteContent.upsert({
    where: { key },
    create: { key, json: JSON.stringify(content) },
    update: { json: JSON.stringify(content) },
  });
  return NextResponse.json({ content: JSON.parse(row.json) });
}
