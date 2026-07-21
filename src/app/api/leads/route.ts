import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardPublicApi } from "@/lib/api-guard";
import { readJsonBody, sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/security";
import { notifyNewLead, sendWelcomeEmail } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const blocked = guardPublicApi(request, { key: "leads", limit: 8, requireJson: true });
    if (blocked) return blocked;

    const parsed = await readJsonBody<{
      nombre?: string; email?: string; telefono?: string;
      destino?: string; mensaje?: string; source?: string; referralCode?: string;
    }>(request);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    const body = parsed.data;

    const nombre = sanitizeText(body.nombre, 120);
    const email = sanitizeEmail(body.email);
    const telefono = sanitizePhone(body.telefono);
    const destino = sanitizeText(body.destino, 120) || null;
    const mensaje = sanitizeText(body.mensaje, 2000) || null;
    const source = sanitizeText(body.source, 40) || "web";
    const referralCode = sanitizeText(body.referralCode, 40) || null;

    if (!nombre || !email || !telefono) {
      return NextResponse.json({ error: "Nombre, email y teléfono son obligatorios" }, { status: 400 });
    }

    const lead = await db.lead.create({
      data: {
        nombre,
        email,
        telefono,
        destino,
        mensaje,
        source,
        referralCode,
        status: "nuevo",
      },
    });

    void notifyNewLead(lead);
    void sendWelcomeEmail(email, nombre, destino);

    return NextResponse.json({ message: "Cotización solicitada exitosamente", lead }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
