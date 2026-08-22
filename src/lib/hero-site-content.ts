import { isPromoWindowActive } from "@/lib/promo-schedule";

export type HeroSiteContent = {
  line1?: string;
  line2?: string;
  subtitle?: string;
  /** Ocultar título y subtítulo (p. ej. foto con texto de oferta). */
  hideCopy?: boolean;
  /** Inicio de ocultación (hora Chile). Null = desde ya si hideCopy. */
  hideCopyStartsAt?: string | null;
  /** Fin de ocultación. Null = hasta que desactives hideCopy. */
  hideCopyEndsAt?: string | null;
};

export const DEFAULT_HERO_COPY_ES = {
  line1: "Viajes que convierten",
  line2: "en historias para toda la vida",
  subtitle:
    "Explora Sudamérica con expertos de forma segura y cómoda, para viajeros que buscan algo más que turismo.",
} as const;

/** ¿Debe ocultarse el texto del hero ahora? */
export function isHeroCopyHidden(
  content: HeroSiteContent | null | undefined,
  now = new Date(),
): boolean {
  if (!content?.hideCopy) return false;
  const start = content.hideCopyStartsAt ?? null;
  const end = content.hideCopyEndsAt ?? null;
  // Sin fechas: oculto mientras el toggle esté activo
  if (!start && !end) return true;
  return isPromoWindowActive(start, end, now);
}

export function mergeHeroCopy(
  fallback: { line1: string; line2: string; subtitle: string },
  content: HeroSiteContent | null | undefined,
  opts?: { applyTextOverrides?: boolean },
): { line1: string; line2: string; subtitle: string; hideCopy: boolean } {
  const applyText = opts?.applyTextOverrides !== false;
  const line1 =
    applyText && content?.line1?.trim() ? content.line1.trim() : fallback.line1;
  const line2 =
    applyText && content?.line2 !== undefined
      ? String(content.line2).trim()
      : fallback.line2;
  const subtitle =
    applyText && content?.subtitle?.trim()
      ? content.subtitle.trim()
      : fallback.subtitle;
  return {
    line1,
    line2,
    subtitle,
    hideCopy: isHeroCopyHidden(content),
  };
}
