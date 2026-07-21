import { emailLayout, escapeHtml, siteUrl, ctaButton } from "@/lib/email/templates";
import {
  getCampaignTemplate,
  type CampaignContent,
  type CampaignTemplate,
} from "@/lib/email/campaign-templates-data";

function absoluteUrl(path: string): string {
  const base = siteUrl();
  if (path.startsWith("http")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function paragraphsHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.65;">${escapeHtml(p.trim())}</p>`)
    .join("");
}

function offerHighlightHtml(content: CampaignContent, template: CampaignTemplate): string {
  if (!content.offerHighlight.trim()) return "";

  const isDestinoMes = content.templateId === "destino-del-mes";
  const isDarkBox = content.templateId === "black-friday";
  const mainSize = isDestinoMes ? 34 : 30;
  const textColor = isDarkBox ? template.offerAccent : template.offerAccent;
  const subColor = isDarkBox ? "#d1d5db" : "#64748b";

  return `
    <div style="text-align:center;margin:0 0 24px;padding:24px 20px;background:${template.offerBg};border-radius:16px;border:2px solid ${template.offerAccent}22;">
      <p style="margin:0 0 10px;color:${subColor};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${escapeHtml(template.badge)}</p>
      <p style="margin:0;font-size:${mainSize}px;font-weight:900;color:${textColor};line-height:1.15;letter-spacing:-0.02em;">${escapeHtml(content.offerHighlight)}</p>
      ${content.offerSubline.trim() ? `<p style="margin:12px 0 0;color:${subColor};font-size:14px;font-weight:600;line-height:1.4;">${escapeHtml(content.offerSubline)}</p>` : ""}
    </div>`;
}

export function renderCampaignEmail(
  content: CampaignContent,
  options?: { recipientName?: string | null; logoSrc?: string },
): { html: string; text: string; subject: string } {
  const template = getCampaignTemplate(content.templateId);
  const greeting = options?.recipientName?.trim()
    ? `Hola ${options.recipientName.split(" ")[0]},`
    : "Hola,";

  const couponBlock = content.couponCode?.trim()
    ? `<div style="text-align:center;margin:20px 0;">
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;">Tu código</p>
        <span style="display:inline-block;background:#f0fdfa;border:2px dashed #14b8a6;border-radius:12px;padding:12px 24px;font-size:22px;font-weight:900;letter-spacing:0.12em;color:#0f766e;">${escapeHtml(content.couponCode.trim())}</span>
      </div>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">${escapeHtml(greeting)}</p>
    <span style="display:inline-block;background:#f1f5f9;color:#475569;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:6px 12px;border-radius:999px;margin-bottom:16px;">${escapeHtml(template.badge)}</span>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#0f172a;line-height:1.25;">${escapeHtml(content.headline)}</h1>
    ${offerHighlightHtml(content, template)}
    ${paragraphsHtml(content.body)}
    ${couponBlock}
    ${ctaButton(absoluteUrl(content.ctaUrl), content.ctaText, "teal")}
    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">
      Recibes este correo porque te registraste en Universo Nómada o te suscribiste a nuestro blog.
    </p>`;

  const html = emailLayout({
    preheader: content.preheader,
    title: content.subject,
    bodyHtml,
    logoSrc: options?.logoSrc,
  });

  const text = [
    greeting,
    "",
    content.headline,
    "",
    content.offerHighlight,
    content.offerSubline,
    "",
    content.body,
    content.couponCode ? `\nCódigo: ${content.couponCode}` : "",
    "",
    `${content.ctaText}: ${absoluteUrl(content.ctaUrl)}`,
  ].filter(Boolean).join("\n");

  return { html, text, subject: content.subject };
}
