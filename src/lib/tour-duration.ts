/** Parsea duración del panel admin: "5 dias", "7 dias / 6 noches", "5D/4N", etc. */
export type ParsedTourDuration = {
  days: number;
  nights: number;
  label: string;
};

const DEFAULT: ParsedTourDuration = { days: 7, nights: 6, label: "7 días / 6 noches" };

export function parseTourDuration(raw?: string | null): ParsedTourDuration {
  const s = (raw ?? "").trim();
  if (!s) return DEFAULT;

  const dxn = s.match(/(\d+)\s*[dD]\s*\/\s*(\d+)\s*[nN]/);
  if (dxn) {
    const days = Number(dxn[1]);
    const nights = Number(dxn[2]);
    return { days, nights, label: `${days}D/${nights}N` };
  }

  const slash = s.match(/(\d+)\s*d[ií]as?\s*\/\s*(\d+)\s*noches?/i);
  if (slash) {
    const days = Number(slash[1]);
    const nights = Number(slash[2]);
    return { days, nights, label: `${days} días / ${nights} noches` };
  }

  const daysOnly = s.match(/(\d+)\s*d[ií]as?/i);
  if (daysOnly) {
    const days = Number(daysOnly[1]);
    const nights = Math.max(days - 1, 0);
    const label =
      nights > 0
        ? `${days} días / ${nights} ${nights === 1 ? "noche" : "noches"}`
        : `${days} ${days === 1 ? "día" : "días"}`;
    return { days, nights, label };
  }

  return { ...DEFAULT, label: s };
}

export function addDaysToIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Noches entre dos fechas ISO (return - depart). */
export function daysBetweenIso(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split("-").map(Number);
  const [y2, m2, d2] = toIso.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function checkOutFromCheckIn(checkIn: string, durationRaw?: string | null): string {
  const { nights } = parseTourDuration(durationRaw);
  return addDaysToIso(checkIn, nights);
}
