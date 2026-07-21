import { sendEmail } from "@/lib/email/send";
import { ctaButton, escapeHtml, formatCLP, siteUrl } from "@/lib/email/templates";
import { cartRecoveryUrl } from "@/lib/analytics-events";
import { roulettePrizeLabel, type RoulettePrizeId } from "@/lib/roulette";
import { buildNeedMoreTimeWhatsApp } from "@/lib/whatsapp-messages";

type CartLine = {
  tourName: string;
  totalPrice: number;
  checkIn?: string;
};

export type AbandonedCartReminder = 1 | 2 | "prize";

export async function sendAbandonedCartEmail(params: {
  to: string;
  nombre: string;
  telefono?: string;
  cartItems: CartLine[];
  cartTotal: number;
  reminder: AbandonedCartReminder;
  prizeId?: RoulettePrizeId;
  prizeExpiresAt?: Date;
}) {
  const firstName = params.nombre.split(" ")[0] || "viajero";
  const recoveryUrl = cartRecoveryUrl();
  const itemsHtml = params.cartItems
    .map(
      (i) =>
        `<li style="margin:0 0 8px;color:#334155;">${escapeHtml(i.tourName)}${i.checkIn ? ` · ${escapeHtml(i.checkIn)}` : ""} — <strong>${formatCLP(i.totalPrice)}</strong></li>`,
    )
    .join("");

  const needMoreTimeUrl = buildNeedMoreTimeWhatsApp({
    kind: params.reminder === "prize" ? "prize" : "cart",
    nombre: params.nombre,
    email: params.to,
    telefono: params.telefono,
    prizeLabel: params.prizeId ? roulettePrizeLabel(params.prizeId) : undefined,
  });

  let subject: string;
  let intro: string;

  if (params.reminder === 1) {
    subject = `${firstName}, tu carrito te está esperando — Universo Nómada`;
    intro =
      "Notamos que dejaste experiencias en tu carrito. Los cupos y precios pueden cambiar — te ayudamos a cerrar tu viaje sin estrés.";
  } else if (params.reminder === "prize") {
    const prizeName = params.prizeId ? roulettePrizeLabel(params.prizeId) : "tu premio de la ruleta";
    subject = `⏰ Queda 1 hora para usar ${prizeName} — Universo Nómada`;
    intro = `Ganaste <strong>${escapeHtml(prizeName)}</strong> en la ruleta de la familia nómada. Te queda aproximadamente <strong>1 hora</strong> para completar tu reserva y no perder el beneficio.${
      params.prizeExpiresAt
        ? ` Vence el ${escapeHtml(params.prizeExpiresAt.toLocaleString("es-CL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }))}.`
        : ""
    }`;
  } else {
    subject = `Último recordatorio: completa tu reserva — Universo Nómada`;
    intro =
      "Este es un último recordatorio amable: tu selección sigue disponible por ahora. Si necesitas ayuda para decidir fechas o habitación, escríbenos.";
  }

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
      <p style="font-size:16px;">Hola ${escapeHtml(firstName)},</p>
      <p style="font-size:15px;line-height:1.6;color:#475569;">${intro}</p>
      <ul style="padding-left:18px;margin:16px 0;">${itemsHtml}</ul>
      <p style="font-size:18px;font-weight:700;">Total: ${formatCLP(params.cartTotal)}</p>
      <p style="margin:24px 0 12px;">
        <a href="${recoveryUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;">
          Volver a mi carrito
        </a>
      </p>
      ${ctaButton(needMoreTimeUrl, "Necesito más tiempo", "green")}
      <p style="font-size:13px;color:#64748b;margin-top:16px;">Al pulsar el botón se abrirá WhatsApp con un mensaje para nuestro equipo.</p>
      <p style="font-size:13px;color:#64748b;">Reservamos tu cupo al confirmar. Respuesta en menos de 24 h.</p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px;">Universo Nómada · ${siteUrl()}</p>
    </div>`;

  const text = [
    `Hola ${firstName},`,
    intro.replace(/<[^>]+>/g, ""),
    ...params.cartItems.map((i) => `- ${i.tourName}: ${formatCLP(i.totalPrice)}`),
    `Total: ${formatCLP(params.cartTotal)}`,
    `Continuar: ${recoveryUrl}`,
    `Necesito más tiempo: ${needMoreTimeUrl}`,
  ].join("\n");

  return sendEmail({ to: params.to, subject, html, text });
}
