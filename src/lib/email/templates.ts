import { emailLogoSrc } from "@/lib/email/email-logo";

export type ReservationLineItem = {
  tourName: string;
  checkIn?: string;
  checkOut?: string;
  accommodationName?: string;
  roomLabel?: string;
  passengers: number;
  totalPrice: number;
};

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://universonomada.cl").replace(/\/$/, "");
}

export function logoUrl(): string {
  return `${siteUrl()}/images/logo-un.png`;
}

export function formatCLP(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

export function formatDateTimeCL(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function hoursUntil(iso: string | Date): number {
  const target = typeof iso === "string" ? new Date(iso) : iso;
  return Math.max(0, Math.round((target.getTime() - Date.now()) / 3_600_000));
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderPackageSummary(items: ReservationLineItem[]): string {
  if (items.length === 0) return "";
  const rows = items.map((item) => {
    const dates = item.checkIn && item.checkOut
      ? `<tr><td colspan="2" style="padding:4px 0 0;color:#64748b;font-size:13px;">${escapeHtml(item.checkIn)} → ${escapeHtml(item.checkOut)}</td></tr>`
      : "";
    const hotel = item.accommodationName
      ? `<tr><td colspan="2" style="padding:2px 0 0;color:#64748b;font-size:13px;">${escapeHtml(item.accommodationName)}</td></tr>`
      : "";
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;">
          <p style="margin:0;font-weight:600;color:#0f172a;font-size:15px;">${escapeHtml(item.tourName)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${dates}
            ${hotel}
            <tr><td colspan="2" style="padding:4px 0 0;color:#64748b;font-size:13px;">${item.passengers} viajero${item.passengers !== 1 ? "s" : ""} · ${escapeHtml(item.roomLabel ?? "—")}</td></tr>
          </table>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;text-align:right;vertical-align:top;font-weight:700;color:#0f172a;white-space:nowrap;">
          ${formatCLP(item.totalPrice)}
        </td>
      </tr>`;
  }).join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:8px;">
      <tr>
        <td style="padding-bottom:8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Resumen del paquete</td>
        <td></td>
      </tr>
      ${rows}
    </table>`;
}

type EmailLayoutOptions = {
  preheader: string;
  title: string;
  bodyHtml: string;
  /** URL absoluta del logo (vista previa en navegador). Si no se pasa, usa CID inline para SMTP. */
  logoSrc?: string;
};

export function emailLayout({ preheader, title, bodyHtml, logoSrc }: EmailLayoutOptions): string {
  const url = siteUrl();
  const logo = logoSrc ?? emailLogoSrc();
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;color:transparent;">${escapeHtml(preheader)}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f766e 0%,#0d9488 100%);padding:28px 32px;text-align:center;">
              <img src="${logo}" alt="Universo Nómada" width="64" height="64" style="display:block;margin:0 auto 12px;border-radius:50%;border:2px solid rgba(255,255,255,0.35);" />
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.02em;">Universo Nómada</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Experiencias que transforman</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 6px;color:#64748b;font-size:12px;">¿Necesitas ayuda?</p>
              <p style="margin:0;color:#0f766e;font-size:13px;font-weight:600;">
                <a href="mailto:contacto@universonomada.cl" style="color:#0f766e;text-decoration:none;">contacto@universonomada.cl</a>
                · <a href="https://wa.me/56974636396" style="color:#0f766e;text-decoration:none;">WhatsApp</a>
              </p>
              <p style="margin:14px 0 0;color:#94a3b8;font-size:11px;">
                <a href="${url}" style="color:#94a3b8;text-decoration:none;">universonomada.cl</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function otpEmailHtml(code: string): { html: string; text: string } {
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#0f172a;">Tu código de acceso</h1>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
      Usa este código para ingresar a tu cuenta en Universo Nómada. Válido por 10 minutos.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <span style="display:inline-block;background:#f0fdfa;border:2px dashed #14b8a6;border-radius:16px;padding:18px 32px;font-size:32px;font-weight:900;letter-spacing:0.35em;color:#0f766e;">${escapeHtml(code)}</span>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">
      Si no solicitaste este código, puedes ignorar este correo.
    </p>`;

  const html = emailLayout({
    preheader: `Tu código Universo Nómada: ${code}`,
    title: "Código de verificación",
    bodyHtml,
  });

  const text = `Tu código de acceso Universo Nómada: ${code}\n\nVálido por 10 minutos. Si no lo solicitaste, ignora este mensaje.`;

  return { html, text };
}

export function ctaButton(href: string, label: string, color: "teal" | "green" = "teal"): string {
  const bg = color === "green" ? "#25D366" : "#0f766e";
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0;">
    <tr>
      <td align="center">
        <a href="${href}" style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 24px;border-radius:10px;min-width:200px;text-align:center;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}
