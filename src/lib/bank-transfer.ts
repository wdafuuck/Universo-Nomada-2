/** Datos bancarios Tour Operador Universo Nómada */
export const BANK_TRANSFER = {
  businessName: "Tour Operador Universo Nómada",
  rut: "77.928.278-3",
  bank: "Banco BCI",
  accountType: "Cuenta Corriente",
  accountNumber: "97567451",
  email: "contacto@universonomada.cl",
  whatsapp: "+56974636396",
  whatsappDisplay: "+56 9 7463 6396",
  transferDeadlineHours: 6,
  /** Tras este plazo, la reserva desaparece de Mi cuenta si sigue pendiente de transferencia. */
  transferMemberHideAfterHours: 24,
  balanceDueWeeksBeforeTrip: 2,
} as const;

export function buildTransferProofMailto(amount: number, leadId: string) {
  const subject = encodeURIComponent(`Comprobante transferencia — Reserva #${leadId}`);
  const body = encodeURIComponent(
    `Hola, adjunto comprobante de transferencia por $${amount.toLocaleString("es-CL")} CLP.\n\nReserva #${leadId}`,
  );
  return `mailto:${BANK_TRANSFER.email}?subject=${subject}&body=${body}`;
}

export function buildTransferProofWhatsApp(amount: number, leadId: string) {
  const text = encodeURIComponent(
    `Hola, envío comprobante de transferencia por $${amount.toLocaleString("es-CL")} CLP. Reserva #${leadId}`,
  );
  return `https://wa.me/${BANK_TRANSFER.whatsapp.replace(/\D/g, "")}?text=${text}`;
}
