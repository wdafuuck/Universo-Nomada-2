type LeadPayload = {
  nombre: string;
  email: string;
  telefono: string;
  destino?: string | null;
  mensaje?: string | null;
  source?: string;
  status?: string;
};

export async function notifyNewLead(lead: LeadPayload) {
  const lines = [
    "Nuevo lead — Universo Nomada",
    `Nombre: ${lead.nombre}`,
    `Email: ${lead.email}`,
    `Telefono: ${lead.telefono}`,
    lead.destino ? `Destino: ${lead.destino}` : null,
    lead.source ? `Origen: ${lead.source}` : null,
    lead.mensaje ? `Mensaje: ${lead.mensaje}` : null,
  ].filter(Boolean);

  const text = lines.join("\n");
  const webhook = process.env.NOTIFY_WEBHOOK_URL;

  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, content: text, lead }),
      });
    } catch (e) {
      console.error("[notify] webhook error:", e);
    }
  } else {
    console.log("[notify]", text);
  }
}

export async function sendWelcomeEmail(email: string, name?: string, destino?: string | null) {
  const { sendQuoteFollowUpEmail } = await import("@/lib/email/quote-followup-email");
  const result = await sendQuoteFollowUpEmail({
    email,
    nombre: name ?? "Viajero",
    destino,
  });
  if (!result.ok && !result.skipped) {
    console.error("[notify] quote follow-up email:", result.error);
  }
}
