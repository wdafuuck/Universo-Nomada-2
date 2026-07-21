import { sendEmail } from "@/lib/email/send";
import { ctaButton, emailLayout, escapeHtml, siteUrl } from "@/lib/email/templates";
import {
  buildTripDocumentNotifyPreview,
  type TripDocumentNotifyVariant,
} from "@/lib/trip-document-notify";
import { TRIP_DOCUMENT_RETENTION_DAYS } from "@/lib/trip-document-retention";

type SendTripDocumentNotifyInput = {
  lead: {
    id: number;
    nombre: string;
    email: string;
    destino: string | null;
    cartJson: string | null;
  };
  documentCount: number;
  variant?: TripDocumentNotifyVariant;
  documentLabel?: string;
};

export async function sendTripDocumentNotifyEmail(input: SendTripDocumentNotifyInput) {
  const preview = buildTripDocumentNotifyPreview(input.lead, input.documentCount, {
    variant: input.variant,
    documentLabel: input.documentLabel,
  });

  const firstName = input.lead.nombre.split(" ")[0] || input.lead.nombre;
  const accountUrl = `${siteUrl()}/mi-cuenta`;
  const dest = input.lead.destino?.trim();
  const retention = TRIP_DOCUMENT_RETENTION_DAYS;

  let headline = "Tu documentación está lista";
  let intro = preview.summary;
  let highlightHtml = "";

  if (preview.variant === "confirmed") {
    headline = dest ? `¡Tu viaje a ${escapeHtml(dest)} está confirmado!` : "¡Tu viaje está confirmado!";
    intro =
      "Tu reserva quedó confirmada y ya puedes acceder a la documentación de tu viaje desde tu perfil.";
    highlightHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:12px;margin-bottom:20px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0 0 6px;color:#047857;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">✓ Viaje confirmado</p>
            <p style="margin:0;color:#0f172a;font-size:15px;line-height:1.6;">
              Entra con tu correo <strong>${escapeHtml(input.lead.email)}</strong> a <strong>Mi cuenta</strong> y descarga tus vouchers, vuelos, entradas y tips.
            </p>
          </td>
        </tr>
      </table>`;
  } else if (preview.variant === "reminder") {
    headline = dest ? `¡${escapeHtml(dest)} se acerca!` : "¡Tu viaje se acerca!";
    const countdown =
      preview.daysUntilTrip != null && preview.daysUntilTrip >= 0
        ? preview.daysUntilTrip === 0
          ? "Hoy comienza tu aventura"
          : preview.daysUntilTrip === 1
            ? "Queda 1 día"
            : `Quedan ${preview.daysUntilTrip} días`
        : "Cada vez queda menos";
    highlightHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin-bottom:20px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0 0 6px;color:#9a3412;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">⏳ ${escapeHtml(countdown)}</p>
            <p style="margin:0;color:#0f172a;font-size:15px;line-height:1.6;">
              No olvides descargar tu documentación antes del viaje. Entra a Mi cuenta con tu correo.
            </p>
            ${preview.tripStartLabel ? `<p style="margin:8px 0 0;color:#9a3412;font-size:13px;">Salida: ${escapeHtml(preview.tripStartLabel)}</p>` : ""}
          </td>
        </tr>
      </table>`;
  } else {
    headline = "Nueva documentación disponible";
    intro = input.documentLabel
      ? `Subimos <strong>${escapeHtml(input.documentLabel)}</strong> para tu viaje. Ya puedes descargarlo desde Mi cuenta.`
      : "Subimos nuevo material para tu viaje. Entra a Mi cuenta y descárgalo.";
    highlightHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;margin-bottom:20px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0 0 6px;color:#0f766e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">📄 Documentos actualizados</p>
            <p style="margin:0;color:#0f172a;font-size:15px;line-height:1.6;">
              Entra con tu correo <strong>${escapeHtml(input.lead.email)}</strong> y revisa la sección de tu viaje en Mi cuenta.
            </p>
          </td>
        </tr>
      </table>`;
  }

  const bodyHtml = `
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Hola ${escapeHtml(firstName)},</p>
    <h1 style="margin:0 0 16px;color:#0f172a;font-size:24px;font-weight:800;line-height:1.25;">${headline}</h1>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">${intro}</p>
    ${highlightHtml}
    ${ctaButton(accountUrl, "Ir a Mi cuenta")}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-radius:12px;margin-top:8px;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 6px;color:#0f172a;font-size:13px;font-weight:700;">Importante</p>
          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
            Los documentos solo podrás descargarlos hasta <strong>${retention} días después del fin de tu viaje</strong>.
            Te recomendamos guardarlos en tu celular o imprimirlos antes de salir.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;">
      Reserva #${input.lead.id}${dest ? ` · ${escapeHtml(dest)}` : ""}
    </p>`;

  const html = emailLayout({
    preheader: preview.summary.slice(0, 140),
    title: preview.subject,
    bodyHtml,
  });

  const text = [
    `Hola ${firstName},`,
    "",
    preview.subject,
    "",
    preview.summary,
    "",
    `Mi cuenta: ${accountUrl}`,
    "",
    `Importante: los documentos estarán disponibles hasta ${retention} días después del fin del viaje.`,
    "",
    `Reserva #${input.lead.id}`,
  ].join("\n");

  return sendEmail({
    to: input.lead.email,
    subject: `${preview.subject} · Universo Nómada`,
    html,
    text,
  });
}
