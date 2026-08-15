type LeadPayload = {
  nombre: string;
  email: string;
  telefono: string;
  destino?: string | null;
  mensaje?: string | null;
  source?: string;
  status?: string;
  cartTotal?: number | null;
  amountDue?: number | null;
  paymentMethod?: string | null;
  paymentPlan?: string | null;
};

/** Compras/reservas reales (checkout). */
const PURCHASE_SOURCES = new Set(["carrito"]);
/** Solicitudes de cotización (formularios). "web" es el default histórico de /api/leads. */
const QUOTE_SOURCES = new Set(["web", "cotizacion-home", "cotizacion-viaje", "ruleta-familia"]);

type LeadKind = "compra" | "cotizacion" | "otro";

function leadKind(source?: string): LeadKind {
  if (source && PURCHASE_SOURCES.has(source)) return "compra";
  if (!source || QUOTE_SOURCES.has(source) || source.startsWith("cotizacion")) return "cotizacion";
  return "otro";
}

function leadLines(lead: LeadPayload): string[] {
  return [
    `Nombre: ${lead.nombre}`,
    `Email: ${lead.email}`,
    `Teléfono: ${lead.telefono}`,
    lead.destino ? `Destino: ${lead.destino}` : null,
    lead.source ? `Origen: ${lead.source}` : null,
    lead.cartTotal ? `Total reserva: $${lead.cartTotal.toLocaleString("es-CL")}` : null,
    lead.amountDue ? `Monto pagado/por pagar: $${lead.amountDue.toLocaleString("es-CL")}` : null,
    lead.paymentMethod ? `Método de pago: ${lead.paymentMethod}` : null,
    lead.paymentPlan ? `Plan: ${lead.paymentPlan}` : null,
    lead.mensaje ? `Mensaje:\n${lead.mensaje}` : null,
  ].filter((l): l is string => Boolean(l));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Email interno al equipo cuando alguien COTIZA o COMPRA.
 * Registros de cuenta / newsletter no generan correo (solo webhook/panel),
 * para poder diferenciarlos.
 */
async function notifyAdminByEmail(lead: LeadPayload) {
  const kind = leadKind(lead.source);
  if (kind === "otro") return;

  const to = process.env.LEAD_NOTIFY_EMAIL?.trim() || "contacto@universonomada.cl";
  const subject =
    kind === "compra"
      ? `🛒 Nueva compra/reserva — ${lead.nombre}${lead.destino ? ` · ${lead.destino}` : ""}`
      : `📝 Nueva cotización — ${lead.nombre}${lead.destino ? ` · ${lead.destino}` : ""}`;

  const lines = leadLines(lead);
  const text = [
    kind === "compra" ? "Nueva compra/reserva en universonomada.cl" : "Nueva solicitud de cotización en universonomada.cl",
    "",
    ...lines,
    "",
    "Gestión: panel admin → Leads (https://universonomada.cl)",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:${kind === "compra" ? "#0E6B5C" : "#B45309"}">
        ${kind === "compra" ? "🛒 Nueva compra/reserva" : "📝 Nueva cotización"}
      </h2>
      <table style="border-collapse:collapse;width:100%">
        ${lines
          .map((l) => {
            const idx = l.indexOf(":");
            const label = idx > 0 ? l.slice(0, idx) : "";
            const value = idx > 0 ? l.slice(idx + 1).trim() : l;
            return `<tr>
              <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:bold;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>
              <td style="padding:6px 10px;border:1px solid #e2e8f0;white-space:pre-line">${escapeHtml(value)}</td>
            </tr>`;
          })
          .join("")}
      </table>
      <p style="color:#64748b;font-size:13px;margin-top:16px">
        Gestión: <a href="https://universonomada.cl">panel admin → Leads</a>
      </p>
    </div>`;

  try {
    const { sendEmail } = await import("@/lib/email/send");
    const result = await sendEmail({ to, subject, html, text });
    if (!result.ok && !result.skipped) {
      console.error("[notify] email admin:", result.error);
    }
  } catch (e) {
    console.error("[notify] email admin:", e);
  }
}

export async function notifyNewLead(lead: LeadPayload) {
  const text = ["Nuevo lead — Universo Nomada", ...leadLines(lead)].join("\n");
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

  await notifyAdminByEmail(lead);
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
