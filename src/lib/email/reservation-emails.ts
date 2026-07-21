import { BANK_TRANSFER, buildTransferProofMailto, buildTransferProofWhatsApp } from "@/lib/bank-transfer";
import { buildNeedMoreTimeWhatsApp } from "@/lib/whatsapp-messages";
import { buildReservationItems } from "@/lib/cart-items";
import { sendEmail } from "@/lib/email/send";
import {
  ctaButton,
  emailLayout,
  formatCLP,
  formatDateTimeCL,
  hoursUntil,
  renderPackageSummary,
  type ReservationLineItem,
} from "@/lib/email/templates";
import { renderRouletteGiftEmailHtml, type RoulettePrizeId } from "@/lib/roulette";

type TransferEmailInput = {
  to: string;
  customerName: string;
  leadId: string;
  amountDue: number;
  cartTotal: number;
  paymentPlan: "total" | "deposito";
  expiresAt: string;
  items: ReservationLineItem[];
  roulettePrize?: RoulettePrizeId;
  rouletteGiftTour?: string;
};

export async function sendTransferConfirmationEmail(input: TransferEmailInput) {
  const hoursLeft = hoursUntil(input.expiresAt);
  const expiresLabel = formatDateTimeCL(input.expiresAt);
  const proofMail = buildTransferProofMailto(input.amountDue, input.leadId);
  const proofWa = buildTransferProofWhatsApp(input.amountDue, input.leadId);
  const needMoreTimeUrl = buildNeedMoreTimeWhatsApp({
    kind: "transfer",
    nombre: input.customerName,
    email: input.to,
    leadId: input.leadId,
    amount: input.amountDue,
  });
  const firstName = input.customerName.split(" ")[0] || input.customerName;

  const balanceNote = input.paymentPlan === "deposito"
    ? `<p style="margin:12px 0 0;color:#64748b;font-size:13px;line-height:1.5;">Saldo pendiente: <strong style="color:#0f172a;">${formatCLP(input.cartTotal - input.amountDue)}</strong> — debe estar pagado 2 semanas antes del viaje.</p>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Hola ${firstName},</p>
    <h1 style="margin:0 0 16px;color:#0f172a;font-size:24px;font-weight:800;line-height:1.25;">Tu reserva está confirmada</h1>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
      Registramos tu reserva <strong>#${input.leadId}</strong>. Para activarla definitivamente, realiza la transferencia dentro del plazo indicado.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 4px;color:#9a3412;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">⏱ Plazo para transferir</p>
          <p style="margin:0;color:#c2410c;font-size:28px;font-weight:800;">${hoursLeft} hora${hoursLeft !== 1 ? "s" : ""}</p>
          <p style="margin:6px 0 0;color:#9a3412;font-size:13px;">Válido hasta ${expiresLabel}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 8px;color:#0f766e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Monto a transferir</p>
          <p style="margin:0;color:#0f172a;font-size:32px;font-weight:800;">${formatCLP(input.amountDue)}</p>
          ${balanceNote}
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
            <tr><td style="color:#94a3b8;padding:2px 0;">Tipo cuenta</td><td style="color:#0f172a;font-weight:600;">${BANK_TRANSFER.accountType}</td></tr>
            <tr><td style="color:#94a3b8;padding:2px 0;">N° cuenta</td><td style="color:#0f172a;font-weight:600;">${BANK_TRANSFER.accountNumber}</td></tr>
            <tr><td style="color:#94a3b8;padding:2px 0;">Referencia</td><td style="color:#0f172a;font-weight:600;">Reserva #${input.leadId}</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;color:#475569;font-size:14px;font-weight:600;">Envía tu comprobante de transferencia:</p>
    ${ctaButton(proofMail, "📧 Enviar comprobante por email")}
    ${ctaButton(proofWa, "💬 Enviar comprobante por WhatsApp", "green")}
    ${ctaButton(needMoreTimeUrl, "Necesito más tiempo", "green")}

    ${renderPackageSummary(input.items)}

    ${input.roulettePrize ? renderRouletteGiftEmailHtml(input.roulettePrize, input.rouletteGiftTour) : ""}

    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;">
      Si ya transferiste, envía el comprobante cuanto antes para asegurar tu cupo.
    </p>`;

  const html = emailLayout({
    preheader: `Tu reserva #${input.leadId} está confirmada. Tienes ${hoursLeft} horas para transferir ${formatCLP(input.amountDue)}.`,
    title: "Tu reserva está confirmada — Universo Nómada",
    bodyHtml,
  });

  const textLines = [
    `Hola ${firstName},`,
    "",
    "TU RESERVA ESTÁ CONFIRMADA",
    `Reserva #${input.leadId}`,
    "",
    `Plazo: ${hoursLeft} horas (hasta ${expiresLabel})`,
    `Monto a transferir: ${formatCLP(input.amountDue)}`,
    "",
    "DATOS BANCARIOS",
    `${BANK_TRANSFER.businessName}`,
    `RUT: ${BANK_TRANSFER.rut}`,
    `${BANK_TRANSFER.bank} · ${BANK_TRANSFER.accountType} · ${BANK_TRANSFER.accountNumber}`,
    "",
    "Envía comprobante a:",
    BANK_TRANSFER.email,
    `WhatsApp: ${BANK_TRANSFER.whatsappDisplay}`,
    "",
    "RESUMEN:",
    ...input.items.map((i) => `- ${i.tourName}: ${formatCLP(i.totalPrice)} (${i.passengers} viajeros)`),
  ];

  return sendEmail({
    to: input.to,
    subject: `✓ Tu reserva #${input.leadId} está confirmada — Universo Nómada`,
    html,
    text: textLines.join("\n"),
  });
}

type CardEmailInput = {
  to: string;
  customerName: string;
  leadId: string;
  amountPaid: number;
  cartTotal: number;
  paymentPlan: "total" | "deposito";
  items: ReservationLineItem[];
  roulettePrize?: RoulettePrizeId;
  rouletteGiftTour?: string;
};

export async function sendCardConfirmationEmail(input: CardEmailInput) {
  const firstName = input.customerName.split(" ")[0] || input.customerName;

  const balanceNote = input.paymentPlan === "deposito"
    ? `<p style="margin:8px 0 0;color:#64748b;font-size:13px;">Abono recibido: <strong style="color:#0f172a;">${formatCLP(input.amountPaid)}</strong> · Saldo pendiente: <strong style="color:#0f172a;">${formatCLP(input.cartTotal - input.amountPaid)}</strong></p>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Hola ${firstName},</p>
    <h1 style="margin:0 0 16px;color:#0f172a;font-size:24px;font-weight:800;line-height:1.25;">¡Pago recibido!</h1>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
      Confirmamos tu pago con tarjeta. Tu reserva <strong>#${input.leadId}</strong> quedó registrada exitosamente.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 4px;color:#047857;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Monto pagado</p>
          <p style="margin:0;color:#0f172a;font-size:32px;font-weight:800;">${formatCLP(input.amountPaid)}</p>
          ${balanceNote}
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 8px;color:#0f172a;font-size:14px;font-weight:700;">¿Qué sigue?</p>
          <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
            Dentro de las próximas <strong>24 horas</strong>, nuestro equipo se pondrá en contacto contigo por
            <strong>correo electrónico</strong> o <strong>WhatsApp</strong> para enviarte los vouchers y documentos de tu viaje.
          </p>
        </td>
      </tr>
    </table>

    ${renderPackageSummary(input.items)}

    ${input.roulettePrize ? renderRouletteGiftEmailHtml(input.roulettePrize, input.rouletteGiftTour) : ""}

    ${ctaButton("https://wa.me/56974636396", "Escríbenos por WhatsApp", "green")}`;

  const html = emailLayout({
    preheader: `Pago confirmado por ${formatCLP(input.amountPaid)}. En 24 h te enviamos los vouchers.`,
    title: "Pago confirmado — Universo Nómada",
    bodyHtml,
  });

  const textLines = [
    `Hola ${firstName},`,
    "",
    "¡PAGO RECIBIDO!",
    `Reserva #${input.leadId}`,
    `Monto: ${formatCLP(input.amountPaid)}`,
    "",
    "Dentro de 24 horas nuestro equipo te contactará por email o WhatsApp para enviarte los vouchers.",
    "",
    "RESUMEN:",
    ...input.items.map((i) => `- ${i.tourName}: ${formatCLP(i.totalPrice)} (${i.passengers} viajeros)`),
    "",
    `WhatsApp: ${BANK_TRANSFER.whatsappDisplay}`,
  ];

  return sendEmail({
    to: input.to,
    subject: `✓ Pago confirmado — Reserva #${input.leadId} · Universo Nómada`,
    html,
    text: textLines.join("\n"),
  });
}

export { buildReservationItems };
