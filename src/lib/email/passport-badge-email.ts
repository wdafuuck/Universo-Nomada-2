import { sendEmail } from "@/lib/email/send";
import { ctaButton, emailLayout, escapeHtml } from "@/lib/email/templates";
import type { EarnedBadge } from "@/lib/passport-badges";
import { absoluteUrl } from "@/lib/site-url";

type Params = {
  to: string;
  customerName: string;
  badges: EarnedBadge[];
};

export async function sendPassportBadgeEmail({ to, customerName, badges }: Params) {
  if (badges.length === 0) return { ok: false as const, error: "Sin insignias" };

  const firstName = customerName.split(" ")[0] || customerName;
  const accountUrl = absoluteUrl("/mi-cuenta");
  const passportUrl = absoluteUrl("/mi-cuenta"); // tab passport is client-side

  const listHtml = badges
    .map((b) => {
      const emoji = escapeHtml(b.emoji || "🌍");
      const name = escapeHtml(b.name);
      const dest = escapeHtml(b.destination || b.name);
      const desc = b.description ? `<p style="margin:4px 0 0;font-size:13px;color:#64748b;">${escapeHtml(b.description)}</p>` : "";
      return `<tr>
        <td style="padding:14px 16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
          <p style="margin:0;font-size:28px;line-height:1;">${emoji}</p>
          <p style="margin:8px 0 0;font-size:16px;font-weight:800;color:#0f172a;">${name}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#0f766e;font-weight:600;">${dest}</p>
          ${desc}
        </td>
      </tr>
      <tr><td style="height:10px;"></td></tr>`;
    })
    .join("");

  const title =
    badges.length === 1
      ? `¡Nueva insignia: ${badges[0].name}!`
      : `¡Desbloqueaste ${badges.length} insignias!`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#0D1B2A;">¡Felicitaciones, ${escapeHtml(firstName)}!</h1>
    <p style="margin:0 0 16px;line-height:1.6;color:#475569;">
      Tu viaje con Universo Nómada ya forma parte de tu <strong>pasaporte nómada</strong>.
      ${badges.length === 1 ? "Esta es tu nueva insignia:" : "Estas son tus nuevas insignias:"}
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 20px;">
      ${listHtml}
    </table>
    ${ctaButton(passportUrl, "Ver mi pasaporte")}
    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">
      Cada destino suma una historia. ¡El próximo viaje ya te espera!<br/>
      Rocío, Ricardo y Facundo — Universo Nómada®
    </p>
  `;

  const html = emailLayout({
    preheader:
      badges.length === 1
        ? `Desbloqueaste la insignia ${badges[0].name} en tu pasaporte nómada.`
        : `Desbloqueaste ${badges.length} insignias en tu pasaporte nómada.`,
    title,
    bodyHtml,
  });

  const names = badges.map((b) => b.name).join(", ");
  const text = `Hola ${firstName}, ¡felicitaciones! Desbloqueaste: ${names}. Mira tu pasaporte en ${accountUrl}`;

  return sendEmail({
    to,
    subject:
      badges.length === 1
        ? `${firstName}, ¡ganaste la insignia ${badges[0].emoji} ${badges[0].name}!`
        : `${firstName}, ¡desbloqueaste ${badges.length} insignias en tu pasaporte!`,
    html,
    text,
  });
}
