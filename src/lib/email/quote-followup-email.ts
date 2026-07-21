import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { escapeHtml, formatCLP, siteUrl } from "@/lib/email/templates";

type SuggestedTour = {
  tourId: string;
  name: string;
  subtitle: string;
  price: number;
  duration: string;
  image: string;
};

async function suggestTours(destino?: string | null): Promise<SuggestedTour[]> {
  const tours = await db.tour.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 20,
  });

  const keyword = destino?.trim().toLowerCase() ?? "";
  const scored = tours.map((t) => {
    const haystack = `${t.name} ${t.subtitle} ${t.tourId}`.toLowerCase();
    const score = keyword && haystack.includes(keyword) ? 2 : 0;
    return { tour: t, score };
  });

  scored.sort((a, b) => b.score - a.score || a.tour.sortOrder - b.tour.sortOrder);

  return scored.slice(0, 3).map(({ tour }) => ({
    tourId: tour.tourId,
    name: tour.name,
    subtitle: tour.subtitle,
    price: tour.price,
    duration: tour.duration,
    image: tour.image,
  }));
}

export async function sendQuoteFollowUpEmail(params: {
  email: string;
  nombre: string;
  destino?: string | null;
}) {
  const firstName = params.nombre.split(" ")[0] || "viajero";
  const tours = await suggestTours(params.destino);
  const base = siteUrl();

  const toursHtml =
    tours.length > 0
      ? tours
          .map((t) => {
            const url = `${base}/detalle-paquete/${t.tourId}`;
            return `
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
                <p style="margin:0;font-weight:600;color:#0f172a;">${escapeHtml(t.name)}</p>
                <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${escapeHtml(t.duration)} · Desde ${formatCLP(t.price)}</p>
                <a href="${url}" style="font-size:13px;color:#0d9488;font-weight:600;text-decoration:none;">Ver experiencia →</a>
              </td>
            </tr>`;
          })
          .join("")
      : `<tr><td style="padding:12px 0;color:#64748b;">Explora nuestros destinos en <a href="${base}/#destinos" style="color:#0d9488;">universonomada.cl</a></td></tr>`;

  const destinoLine = params.destino
    ? ` sobre <strong>${escapeHtml(params.destino)}</strong>`
    : "";

  const subject = `Recibimos tu cotización${params.destino ? ` — ${params.destino}` : ""} | Universo Nómada`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
      <p style="font-size:16px;">Hola ${escapeHtml(firstName)},</p>
      <p style="font-size:15px;line-height:1.6;color:#475569;">
        Gracias por contactarnos${destinoLine}. Un asesor te responderá en <strong>menos de 24 horas</strong>.
        Mientras tanto, estas experiencias podrían interesarte:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
        ${toursHtml}
      </table>
      <p style="margin:24px 0;">
        <a href="${base}/#destinos" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;">
          Ver todos los destinos
        </a>
      </p>
      <p style="font-size:13px;color:#64748b;">Agencia registrada en SERNATUR · Viajes a medida en Chile y el mundo.</p>
    </div>`;

  const text = [
    `Hola ${firstName},`,
    `Recibimos tu solicitud${params.destino ? ` sobre ${params.destino}` : ""}. Te responderemos en menos de 24 horas.`,
    tours.length
      ? "Experiencias sugeridas:\n" + tours.map((t) => `- ${t.name}: ${formatCLP(t.price)} — ${base}/detalle-paquete/${t.tourId}`).join("\n")
      : `Explora: ${base}/#destinos`,
  ].join("\n\n");

  return sendEmail({ to: params.email, subject, html, text });
}
