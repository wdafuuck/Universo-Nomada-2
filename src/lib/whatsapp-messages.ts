import { BANK_TRANSFER } from "@/lib/bank-transfer";
import { formatCLP } from "@/lib/email/templates";

function businessWhatsAppUrl(text: string): string {
  const phone = BANK_TRANSFER.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/** El cliente abre WhatsApp con un mensaje prellenado hacia Universo Nómada. */
export function buildNeedMoreTimeWhatsApp(params: {
  kind: "cart" | "prize" | "transfer";
  nombre?: string;
  email?: string;
  telefono?: string;
  leadId?: string | number;
  amount?: number;
  prizeLabel?: string;
}): string {
  const name = params.nombre?.trim() || "un viajero";
  const email = params.email?.trim() || "";
  const phone = params.telefono?.trim() || "";

  let text = "";

  if (params.kind === "transfer" && params.leadId != null) {
    const amountLine = params.amount != null ? ` por ${formatCLP(params.amount)}` : "";
    text = [
      `Hola Universo Nómada, soy ${name}.`,
      `Necesito más tiempo para completar la transferencia de mi reserva #${params.leadId}${amountLine}.`,
      email ? `Mi correo: ${email}` : "",
      phone ? `Mi teléfono: ${phone}` : "",
      "¿Me pueden ayudar con una extensión del plazo?",
    ].filter(Boolean).join("\n");
  } else if (params.kind === "prize") {
    text = [
      `Hola Universo Nómada, soy ${name}.`,
      params.prizeLabel ? `Gané "${params.prizeLabel}" en la ruleta y necesito más tiempo para usarlo.` : "Gané un premio en la ruleta y necesito más tiempo para usarlo.",
      email ? `Mi correo: ${email}` : "",
      phone ? `Mi teléfono: ${phone}` : "",
      "¿Me pueden ayudar?",
    ].filter(Boolean).join("\n");
  } else {
    text = [
      `Hola Universo Nómada, soy ${name}.`,
      "Dejé mi carrito en la web y necesito más tiempo para completar la reserva.",
      email ? `Mi correo: ${email}` : "",
      phone ? `Mi teléfono: ${phone}` : "",
      "¿Me pueden ayudar?",
    ].filter(Boolean).join("\n");
  }

  return businessWhatsAppUrl(text);
}
