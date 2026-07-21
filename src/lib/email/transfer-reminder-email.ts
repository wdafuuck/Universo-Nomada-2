import { BANK_TRANSFER, buildTransferProofMailto, buildTransferProofWhatsApp } from "@/lib/bank-transfer";
import { sendEmail } from "@/lib/email/send";
import {
  ctaButton,
  emailLayout,
  formatCLP,
  formatDateTimeCL,
  renderPackageSummary,
  type ReservationLineItem,
} from "@/lib/email/templates";
import { buildNeedMoreTimeWhatsApp } from "@/lib/whatsapp-messages";

export async function sendTransferDeadlineReminderEmail(input: {
  to: string;
  customerName: string;
  telefono?: string;
  leadId: string;
  amountDue: number;
  expiresAt: string;
  items: ReservationLineItem[];
}) {
  const firstName = input.customerName.split(" ")[0] || input.customerName;
  const expiresLabel = formatDateTimeCL(input.expiresAt);
  const proofMail = buildTransferProofMailto(input.amountDue, input.leadId);
  const proofWa = buildTransferProofWhatsApp(input.amountDue, input.leadId);
  const needMoreTimeUrl = buildNeedMoreTimeWhatsApp({
    kind: "transfer",
    nombre: input.customerName,
    email: input.to,
    telefono: input.telefono,
    leadId: input.leadId,
    amount: input.amountDue,
  });

  const bodyHtml = `
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Hola ${firstName},</p>
    <h1 style="margin:0 0 16px;color:#0f172a;font-size:24px;font-weight:800;line-height:1.25;">Queda 1 hora para transferir</h1>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
      Tu reserva <strong>#${input.leadId}</strong> sigue pendiente de pago. Si no recibimos tu transferencia antes del plazo, el cupo podría liberarse.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 4px;color:#9a3412;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">⏱ Tiempo restante</p>
          <p style="margin:0;color:#c2410c;font-size:28px;font-weight:800;">1 hora</p>
          <p style="margin:6px 0 0;color:#9a3412;font-size:13px;">Válido hasta ${expiresLabel}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 8px;color:#0f766e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Monto a transferir</p>
          <p style="margin:0;color:#0f172a;font-size:32px;font-weight:800;">${formatCLP(input.amountDue)}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;">Datos bancarios</p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;color:#475569;line-height:1.7;">
            <tr><td style="color:#94a3b8;width:110px;padding:2px 0;">Razón social</td><td style="color:#0f172a;font-weight:600;">${BANK_TRANSFER.businessName}</td></tr>
            <tr><td style="color:#94a3b8;padding:2px 0;">RUT</td><td style="color:#0f172a;font-weight:600;">${BANK_TRANSFER.rut}</td></tr>
            <tr><td style="color:#94a3b8;padding:2px 0;">Banco</td><td style="color:#0f172a;font-weight:600;">${BANK_TRANSFER.bank}</td></tr>
            <tr><td style="color:#94a3b8;padding:2px 0;">N° cuenta</td><td style="color:#0f172a;font-weight:600;">${BANK_TRANSFER.accountNumber}</td></tr>
            <tr><td style="color:#94a3b8;padding:2px 0;">Referencia</td><td style="color:#0f172a;font-weight:600;">Reserva #${input.leadId}</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;color:#475569;font-size:14px;font-weight:600;">¿Ya transferiste? Envía el comprobante:</p>
    ${ctaButton(proofMail, "📧 Enviar comprobante por email")}
    ${ctaButton(proofWa, "💬 Enviar comprobante por WhatsApp", "green")}
    ${ctaButton(needMoreTimeUrl, "Necesito más tiempo", "green")}

    ${renderPackageSummary(input.items)}

    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;">
      Si necesitas extender el plazo, pulsa «Necesito más tiempo» y te contactaremos por WhatsApp.
    </p>`;

  const html = emailLayout({
    preheader: `Queda 1 hora para transferir ${formatCLP(input.amountDue)} — Reserva #${input.leadId}`,
    title: "Recordatorio de transferencia — Universo Nómada",
    bodyHtml,
  });

  const text = [
    `Hola ${firstName},`,
    "",
    `Queda 1 hora para transferir tu reserva #${input.leadId}.`,
    `Monto: ${formatCLP(input.amountDue)}`,
    `Válido hasta: ${expiresLabel}`,
    "",
    "Datos bancarios:",
    `${BANK_TRANSFER.businessName} · ${BANK_TRANSFER.rut}`,
    `${BANK_TRANSFER.bank} · ${BANK_TRANSFER.accountNumber}`,
    "",
    `Necesito más tiempo: ${needMoreTimeUrl}`,
  ].join("\n");

  return sendEmail({
    to: input.to,
    subject: `⏰ Queda 1 hora para transferir — Reserva #${input.leadId}`,
    html,
    text,
  });
}
