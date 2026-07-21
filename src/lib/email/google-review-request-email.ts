import { GOOGLE_REVIEWS_URL } from "@/lib/google-reviews";
import { sendEmail } from "@/lib/email/send";
import { ctaButton, emailLayout } from "@/lib/email/templates";

type Params = {
  to: string;
  customerName: string;
  destination?: string;
};

export async function sendGoogleReviewRequestEmail({ to, customerName, destination }: Params) {
  const firstName = customerName.split(" ")[0] || customerName;
  const dest = destination ? ` tu viaje a <strong>${destination}</strong>` : " tu viaje";

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#0D1B2A;">¡Gracias por viajar con nosotros, ${firstName}!</h1>
    <p style="margin:0 0 16px;line-height:1.6;color:#475569;">
      Esperamos que hayas disfrutado${dest}. Tu experiencia significa mucho para nuestra familia nómada.
    </p>
    <p style="margin:0 0 20px;line-height:1.6;color:#475569;">
      Si tienes un minuto, ¿nos ayudas con una <strong>reseña en Google</strong>? Así más viajeros pueden confiar en Universo Nómada.
    </p>
    ${ctaButton(GOOGLE_REVIEWS_URL, "Dejar reseña en Google")}
    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">
      Con cariño,<br/>Rocío, Ricardo y Facundo — Universo Nómada®
    </p>
  `;

  const html = emailLayout({
    preheader: "¿Nos dejas una reseña en Google? Tu opinión ayuda a otros viajeros.",
    title: "Cuéntanos tu experiencia",
    bodyHtml,
  });

  return sendEmail({
    to,
    subject: `${firstName}, ¿cómo fue tu viaje? ⭐ Cuéntanos en Google`,
    html,
    text: `Hola ${firstName}, gracias por viajar con Universo Nómada. ¿Nos dejas una reseña en Google? ${GOOGLE_REVIEWS_URL}`,
  });
}
