export function formatCLP(value: number): string {
  return "$" + value.toLocaleString("es-CL");
}

/**
 * Loose phone validation — counts digits after stripping non-digit chars.
 * Accepts any number in the 7–15 digit range (E.164 max is 15).
 */
export function isValidPhone(value: string): boolean {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Build a wa.me URL from a phone string. Defaults to Chile (+56) when the
 * input lacks an international prefix.
 */
export function whatsappUrl(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  let normalized = digits;

  if (!phone.trim().startsWith("+")) {
    if (digits.startsWith("56")) {
      normalized = digits;
    } else if (digits.length === 9 || digits.length === 8) {
      normalized = "56" + digits;
    }
  }

  const url = `https://wa.me/${normalized}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
