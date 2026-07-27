import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-session";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const [notes, events] = await Promise.all([
    db.leadNote.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, email: true } } },
    }),
    db.leadEvent.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({ notes, events });
}

export async function POST(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

  const body = await request.json();
  const text = String(body.body ?? body.note ?? "").trim();
  if (!text) return NextResponse.json({ error: "Nota vacía" }, { status: 400 });

  const note = await db.leadNote.create({
    data: {
      leadId,
      authorId: admin.id,
      body: text.slice(0, 4000),
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  await db.leadEvent.create({
    data: {
      leadId,
      type: "note",
      message: text.slice(0, 200),
      metaJson: JSON.stringify({ noteId: note.id, by: admin.id }),
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}
