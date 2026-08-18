/** Ventana de ofertas en hora Chile (Santiago). */

export const CHILE_TZ = "America/Santiago";

export type PromoScheduleFields = {
  showInOfertas?: boolean;
  promoDiscountPercent?: number | null;
  promoStartsAt?: Date | string | null;
  promoEndsAt?: Date | string | null;
};

function tzOffsetMs(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - date.getTime();
}

/** Interpreta `YYYY-MM-DDTHH:mm` como hora Chile. */
export function parseChileDateTimeLocal(value: string): Date | null {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const utcGuess = Date.UTC(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    Number(m[6] ?? 0),
  );
  let instant = utcGuess - tzOffsetMs(CHILE_TZ, new Date(utcGuess));
  instant = utcGuess - tzOffsetMs(CHILE_TZ, new Date(instant));
  return new Date(instant);
}

export function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();
  if (!s) return null;
  const local = parseChileDateTimeLocal(s);
  if (local) return local;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Valor para `<input type="datetime-local">` en hora Chile. */
export function toChileDateTimeLocal(value: Date | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}

export function parsePromoDateInput(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  return toDate(String(value));
}

export function parsePromoScheduleFromBody(body: {
  showInOfertas?: unknown;
  promoStartsAt?: unknown;
  promoEndsAt?: unknown;
}): { promoStartsAt: Date | null; promoEndsAt: Date | null; error?: string } {
  if (!body.showInOfertas) return { promoStartsAt: null, promoEndsAt: null };
  const promoStartsAt = parsePromoDateInput(body.promoStartsAt);
  const promoEndsAt = parsePromoDateInput(body.promoEndsAt);
  if (promoStartsAt && promoEndsAt && promoStartsAt >= promoEndsAt) {
    return {
      promoStartsAt,
      promoEndsAt,
      error: "La fecha de inicio debe ser anterior al término de la oferta.",
    };
  }
  return { promoStartsAt, promoEndsAt };
}

/**
 * Sin fechas = vigente ahora.
 * Con inicio: entra al llegar a esa hora.
 * Con término: sale al llegar a esa hora (no inclusivo).
 */
export function isPromoWindowActive(
  startsAt: Date | string | null | undefined,
  endsAt: Date | string | null | undefined,
  now = new Date(),
): boolean {
  const start = toDate(startsAt);
  const end = toDate(endsAt);
  if (start && now < start) return false;
  if (end && now >= end) return false;
  return true;
}

export function isTourInOfertasNow(tour: PromoScheduleFields, now = new Date()): boolean {
  return Boolean(tour.showInOfertas) && isPromoWindowActive(tour.promoStartsAt, tour.promoEndsAt, now);
}

export function effectivePromoDiscountPercent(tour: PromoScheduleFields, now = new Date()): number {
  if (!isPromoWindowActive(tour.promoStartsAt, tour.promoEndsAt, now)) return 0;
  const n = Math.round(Number(tour.promoDiscountPercent) || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(90, n);
}

export function formatPromoEndLabel(endsAt: Date | string | null | undefined): string {
  const d = toDate(endsAt);
  if (!d) return "";
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: CHILE_TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export type PromoScheduleStatus = {
  key: "sin_fechas" | "programada" | "activa" | "finalizada";
  label: string;
};

export function promoScheduleStatus(
  startsAt: Date | string | null | undefined,
  endsAt: Date | string | null | undefined,
  now = new Date(),
): PromoScheduleStatus {
  const start = toDate(startsAt);
  const end = toDate(endsAt);
  if (!start && !end) return { key: "sin_fechas", label: "Siempre visible" };
  if (start && now < start) {
    return { key: "programada", label: `Empieza ${formatPromoEndLabel(start)}` };
  }
  if (end && now >= end) {
    return { key: "finalizada", label: `Terminó ${formatPromoEndLabel(end)}` };
  }
  if (end) return { key: "activa", label: `Hasta ${formatPromoEndLabel(end)}` };
  return { key: "activa", label: "Activa ahora" };
}
