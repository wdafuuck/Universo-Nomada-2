import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { CampaignAudience } from "@/lib/email/campaign-templates-data";
import { parseCampaignContent } from "@/lib/email/campaign-templates-data";
import { fetchCampaignRecipients } from "@/lib/email/campaign-recipients";
import { renderCampaignEmail } from "@/lib/email/campaign-render";
import { sendEmail } from "@/lib/email/send";
import { isEmailConfigured } from "@/lib/reservation-confirmation";

const VALID: CampaignAudience[] = ["users", "subscribers", "all"];

function defaultTestEmail(adminEmail: string): string {
  const smtpUser = process.env.SMTP_USER?.trim();
  if (smtpUser && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpUser)) return smtpUser;
  return adminEmail;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Correo no configurado. Revisa SMTP_HOST, SMTP_USER y SMTP_PASS en .env" },
      { status: 503 },
    );
  }

  const ip = clientIp(request);
  if (!rateLimit(`campaign-send:${ip}`, 2, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiados envíos masivos. Espera unos minutos e intenta de nuevo." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const content = parseCampaignContent(body);
    if (!content?.subject || !content.headline) {
      return NextResponse.json({ error: "Asunto y título obligatorios" }, { status: 400 });
    }

    const audience = (body.audience ?? "all") as CampaignAudience;
    if (!VALID.includes(audience)) {
      return NextResponse.json({ error: "Audiencia inválida" }, { status: 400 });
    }

    const testOnly = Boolean(body.testOnly);
    const testEmail = String(body.testEmail ?? defaultTestEmail(admin.email)).trim();

    const recipients = testOnly
      ? [{ email: testEmail, name: admin.name, source: "user" as const }]
      : await fetchCampaignRecipients(audience);

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No hay destinatarios para esta audiencia" }, { status: 400 });
    }

    if (!testOnly && !body.confirm) {
      return NextResponse.json(
        { error: "Confirma el envío masivo con confirm: true", recipientCount: recipients.length },
        { status: 400 },
      );
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      const mail = renderCampaignEmail(content, { recipientName: recipient.name });
      const result = await sendEmail({
        to: recipient.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });

      if (result.ok) {
        sent += 1;
      } else {
        failed += 1;
        const msg = result.skipped
          ? "Correo no configurado en el servidor"
          : (result.error ?? "Error desconocido");
        if (errors.length < 5) {
          errors.push(`${recipient.email}: ${msg}`);
        }
      }

      if (recipients.length > 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    if (testOnly && failed > 0) {
      return NextResponse.json(
        {
          ok: false,
          testOnly: true,
          total: recipients.length,
          sent,
          failed,
          errors,
          error: errors[0] ?? "No se pudo enviar el correo de prueba",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      testOnly,
      audience,
      total: recipients.length,
      sent,
      failed,
      errors,
    });
  } catch (e) {
    console.error("[admin/campaigns/send]", e);
    const message = e instanceof Error ? e.message : "Error al enviar campaña";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
