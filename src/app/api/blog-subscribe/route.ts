import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyNewLead } from "@/lib/notify";
import { guardPublicApi } from "@/lib/api-guard";
import { readJsonBody, sanitizeEmail } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const blocked = guardPublicApi(request, { key: "blog-sub", limit: 6, requireJson: true });
    if (blocked) return blocked;

    const parsed = await readJsonBody<{ email?: string; source?: string; marketingConsent?: boolean }>(request);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const email = sanitizeEmail(parsed.data.email);
    const marketingConsent = Boolean(parsed.data.marketingConsent);

    if (!email) {
      return NextResponse.json({ error: "El email es obligatorio" }, { status: 400 });
    }

    await db.blogSubscriber.upsert({
      where: { email },
      create: {
        email,
        source: parsed.data.source ?? "blog",
        marketingConsent,
      },
      update: { marketingConsent },
    });

    await notifyNewLead({
      nombre: "Suscriptor blog",
      email,
      telefono: "-",
      mensaje: marketingConsent
        ? "Nueva suscripción al newsletter (con consentimiento marketing)"
        : "Nueva suscripción al newsletter",
      source: parsed.data.source ?? "blog",
    });

    return NextResponse.json({ message: "Suscripción registrada" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No pudimos registrar tu email. Intenta de nuevo." }, { status: 500 });
  }
}
