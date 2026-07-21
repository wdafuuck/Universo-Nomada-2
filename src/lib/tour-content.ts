export type TourAddon = {
  id: string;
  name: string;
  price: number;
  description?: string;
};

export type OptionalTourOption = {
  id: string;
  name: string;
  image: string;
  description?: string;
  /** Precio fijo de la actividad cuando priceVariesByPax es false */
  price?: number;
  /** Si true, precio por persona según 1 o 2+ viajeros en la actividad */
  priceVariesByPax?: boolean;
  /** Precio por persona con 1 viajero en la actividad */
  price1Pax?: number;
  /** Precio por persona con 2+ viajeros en la actividad */
  price2Pax?: number;
  /** Complementos opcionales al elegir este tour (ej: cena con show de danzas) */
  addons?: TourAddon[];
};

export type BundledIncludedTour = {
  id: string;
  name: string;
  image?: string;
  description?: string;
};

export type OptionalToursConfig = {
  pickCount: number;
  options: OptionalTourOption[];
  additionalActivities?: OptionalTourOption[];
  /** Tours que ya vienen en el paquete (no se eligen; se muestran al cliente) */
  hasBundledIncluded?: boolean;
  bundledIncludedTours?: BundledIncludedTour[];
};

export type PackageFaqItem = {
  q: string;
  a: string;
};

export const PACKAGE_GALLERY_MAX = 6;

export type PackageGalleryImage = {
  url: string;
  objectPosition: string;
};

export type TourContentFields = {
  includesText: string;
  excludesText: string;
  highlightsText: string;
  pdfUrl: string;
  galleryJson: string;
  faqJson: string;
  optionalToursJson: string;
  flightBudgetMax: number | null;
};

export function slashToList(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeGalleryUrl(url: string): string {
  return url.trim().split("?")[0].replace(/\/+$/, "");
}

export function parseGallery(
  json: string,
  options?: { excludeUrls?: string[] },
): PackageGalleryImage[] {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    const exclude = new Set(
      (options?.excludeUrls ?? [])
        .filter(Boolean)
        .map((u) => normalizeGalleryUrl(u)),
    );
    const seen = new Set<string>();
    return arr
      .map((item): PackageGalleryImage | null => {
        if (typeof item === "string") {
          return { url: item, objectPosition: "50% 50%" };
        }
        if (typeof item === "object" && item !== null && "url" in item) {
          const raw = item as { url?: unknown; objectPosition?: unknown };
          if (typeof raw.url !== "string" || !raw.url.trim()) return null;
          return {
            url: raw.url,
            objectPosition:
              typeof raw.objectPosition === "string" && raw.objectPosition.trim()
                ? raw.objectPosition
                : "50% 50%",
          };
        }
        return null;
      })
      .filter((item): item is PackageGalleryImage => {
        if (!item) return false;
        const key = normalizeGalleryUrl(item.url);
        if (!key || exclude.has(key) || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, PACKAGE_GALLERY_MAX);
  } catch {
    return [];
  }
}

export function parseFaq(json: string): PackageFaqItem[] {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is PackageFaqItem => typeof x === "object" && x !== null && "q" in x && "a" in x)
      .slice(0, 5);
  } catch {
    return [];
  }
}

function normalizeOptionalOption(raw: Partial<OptionalTourOption>): OptionalTourOption {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    image: String(raw.image ?? ""),
    description: raw.description ? String(raw.description) : undefined,
    price: raw.price != null ? Number(raw.price) : undefined,
    priceVariesByPax: raw.priceVariesByPax === true,
    price1Pax: raw.price1Pax != null ? Number(raw.price1Pax) : undefined,
    price2Pax: raw.price2Pax != null ? Number(raw.price2Pax) : undefined,
    addons: Array.isArray(raw.addons)
      ? raw.addons
          .filter((a) => a && typeof a === "object")
          .map((a) => ({
            id: String(a.id ?? ""),
            name: String(a.name ?? ""),
            price: Number(a.price) || 0,
            description: a.description,
          }))
      : [],
  };
}

/** Complementos con nombre (para mostrar al cliente; en admin se permiten filas vacías al editar) */
export function visibleTourAddons(addons?: TourAddon[]): TourAddon[] {
  return (addons ?? []).filter((a) => a.name.trim());
}

function normalizeBundledIncludedTour(raw: Partial<BundledIncludedTour>): BundledIncludedTour {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    image: raw.image ? String(raw.image) : undefined,
    description: raw.description ? String(raw.description) : undefined,
  };
}

/** Tours incluidos fijos con nombre (para mostrar al cliente) */
export function visibleBundledIncludedTours(config: OptionalToursConfig): BundledIncludedTour[] {
  if (!config.hasBundledIncluded) return [];
  return (config.bundledIncludedTours ?? []).filter((t) => t.name.trim());
}

export function parseOptionalTours(json: string): OptionalToursConfig {
  try {
    const data = JSON.parse(json) as Partial<OptionalToursConfig>;
    const options = Array.isArray(data.options) ? data.options.map(normalizeOptionalOption) : [];
    const pickCountRaw = Number(data.pickCount) || 0;
    const pickCount = options.length > 0 ? Math.min(pickCountRaw, options.length) : Math.max(0, pickCountRaw);
    return {
      pickCount,
      options,
      additionalActivities: Array.isArray(data.additionalActivities)
        ? data.additionalActivities.map(normalizeOptionalOption)
        : [],
      hasBundledIncluded: data.hasBundledIncluded === true,
      bundledIncludedTours: Array.isArray(data.bundledIncludedTours)
        ? data.bundledIncludedTours.map(normalizeBundledIncludedTour)
        : [],
    };
  } catch {
    return { pickCount: 0, options: [], additionalActivities: [], hasBundledIncluded: false, bundledIncludedTours: [] };
  }
}

export function findOptionalTourById(
  config: OptionalToursConfig,
  tourOptionId: string,
): OptionalTourOption | undefined {
  return (
    config.options.find((o) => o.id === tourOptionId) ??
    config.additionalActivities?.find((a) => a.id === tourOptionId)
  );
}

/** Precio total de un tour/actividad extra según pasajeros que la toman */
export function calculateOptionalTourExtraPrice(
  opt: OptionalTourOption,
  payingPax: number,
): number {
  if (payingPax <= 0) return 0;

  // Legacy: datos sin priceVariesByPax → precio × pasajeros
  if (
    opt.priceVariesByPax === undefined &&
    opt.price1Pax == null &&
    opt.price2Pax == null &&
    opt.price != null
  ) {
    return opt.price * payingPax;
  }

  if (opt.priceVariesByPax) {
    const bucket = payingPax <= 1 ? 1 : 2;
    const perPerson =
      bucket === 1
        ? (opt.price1Pax ?? 0)
        : (opt.price2Pax ?? opt.price1Pax ?? 0);
    return perPerson * payingPax;
  }

  return opt.price ?? 0;
}

export function getOptionalTourExtraPerPersonLabel(
  opt: OptionalTourOption,
  payingPax: number,
): { amount: number; label: string } {
  if (opt.priceVariesByPax === undefined && opt.price1Pax == null && opt.price2Pax == null && opt.price) {
    return { amount: opt.price, label: "por persona" };
  }
  if (opt.priceVariesByPax) {
    const bucket = payingPax <= 1 ? 1 : 2;
    const perPerson =
      bucket === 1
        ? (opt.price1Pax ?? 0)
        : (opt.price2Pax ?? opt.price1Pax ?? 0);
    return { amount: perPerson, label: "por persona" };
  }
  return { amount: opt.price ?? 0, label: "precio fijo" };
}

export function defaultFaqJson(): string {
  return JSON.stringify(
    Array.from({ length: 5 }, () => ({ q: "", a: "" })),
  );
}

export function highlightsToList(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function tourToPublicContent(tour: {
  includesText?: string;
  excludesText?: string;
  highlightsText?: string;
  pdfUrl?: string;
  galleryJson?: string;
  faqJson?: string;
  optionalToursJson?: string;
  image?: string;
}) {
  return {
    includes: slashToList(tour.includesText ?? ""),
    excludes: slashToList(tour.excludesText ?? ""),
    highlights: highlightsToList(tour.highlightsText ?? ""),
    pdfUrl: tour.pdfUrl ?? "",
    gallery: parseGallery(tour.galleryJson ?? "[]", {
      excludeUrls: tour.image ? [tour.image] : [],
    }),
    faq: parseFaq(tour.faqJson ?? "[]").filter((f) => f.q.trim()),
    optionalTours: parseOptionalTours(tour.optionalToursJson ?? "{}"),
  };
}
