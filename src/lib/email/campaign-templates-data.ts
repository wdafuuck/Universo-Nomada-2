export type CampaignAudience = "users" | "subscribers" | "all";

export type CampaignTemplateId =
  | "oferta-general"
  | "destino-del-mes"
  | "cyber-day"
  | "travel-sale"
  | "black-friday"
  | "halloween"
  | "navidad"
  | "dia-del-padre"
  | "dia-de-la-madre"
  | "temporada";

export type CampaignTemplate = {
  id: CampaignTemplateId;
  label: string;
  emoji: string;
  defaultSubject: string;
  defaultPreheader: string;
  defaultHeadline: string;
  defaultBody: string;
  defaultOfferHighlight: string;
  defaultOfferSubline: string;
  defaultCtaText: string;
  defaultCtaUrl: string;
  headerGradient: string;
  badge: string;
  offerAccent: string;
  offerBg: string;
};

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "oferta-general",
    label: "Oferta especial",
    emoji: "✨",
    defaultSubject: "Una experiencia pensada para ti — Universo Nómada",
    defaultPreheader: "Descubre nuestra oferta por tiempo limitado",
    defaultHeadline: "Tu próxima aventura te espera",
    defaultBody:
      "Queremos invitarte a vivir una experiencia auténtica en Chile y Sudamérica: grupos pequeños, guías locales y logística completa para que solo disfrutes.\n\nTenemos cupos limitados en fechas seleccionadas. Escríbenos o reserva desde la web.",
    defaultOfferHighlight: "15% OFF en paquetes seleccionados",
    defaultOfferSubline: "Válido por tiempo limitado",
    defaultCtaText: "Ver experiencias",
    defaultCtaUrl: "/",
    headerGradient: "linear-gradient(135deg,#0f766e 0%,#0d9488 100%)",
    badge: "Oferta limitada",
    offerAccent: "#0f766e",
    offerBg: "#f0fdfa",
  },
  {
    id: "destino-del-mes",
    label: "Destino del mes",
    emoji: "🌍",
    defaultSubject: "Destino del mes — oferta exclusiva Universo Nómada",
    defaultPreheader: "Precio especial en nuestro destino destacado del mes",
    defaultHeadline: "Este mes te llevamos a un lugar que transforma",
    defaultBody:
      "Elegimos un destino especial con salidas confirmadas, guías locales y la logística completa que nos caracteriza.\n\nCupos limitados. Reserva pronto y asegura tu lugar con precio preferencial.",
    defaultOfferHighlight: "Atacama 5D/4N desde $890.000",
    defaultOfferSubline: "Destino del mes · Precio por persona en habitación doble",
    defaultCtaText: "Ver destino del mes",
    defaultCtaUrl: "/",
    headerGradient: "linear-gradient(135deg,#0f766e 0%,#0891b2 100%)",
    badge: "Destino del mes",
    offerAccent: "#0f766e",
    offerBg: "#ecfdf5",
  },
  {
    id: "cyber-day",
    label: "Cyber Day",
    emoji: "💻",
    defaultSubject: "Cyber Day Universo Nómada — descuentos online",
    defaultPreheader: "Solo por Cyber Day: ofertas en experiencias seleccionadas",
    defaultHeadline: "Cyber Day: viaja más, paga menos",
    defaultBody:
      "Por pocas horas activamos precios especiales en paquetes de Chile y Sudamérica.\n\nReserva online y asegura tu cupo antes de que se agoten los beneficios Cyber.",
    defaultOfferHighlight: "Hasta 30% OFF",
    defaultOfferSubline: "Cyber Day · Paquetes seleccionados",
    defaultCtaText: "Aprovechar Cyber Day",
    defaultCtaUrl: "/",
    headerGradient: "linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)",
    badge: "Cyber Day",
    offerAccent: "#0891b2",
    offerBg: "#ecfeff",
  },
  {
    id: "travel-sale",
    label: "Travel Sale",
    emoji: "✈️",
    defaultSubject: "Travel Sale — ofertas de viaje Universo Nómada",
    defaultPreheader: "Precios especiales por Travel Sale en salidas limitadas",
    defaultHeadline: "Travel Sale: tu próximo viaje con descuento",
    defaultBody:
      "Activamos una selección de experiencias con precio promocional por tiempo acotado.\n\nIdeal para quienes ya tienen fechas en mente y quieren asegurar un buen precio.",
    defaultOfferHighlight: "Travel Sale — hasta 25% OFF",
    defaultOfferSubline: "En expediciones y paquetes seleccionados",
    defaultCtaText: "Ver Travel Sale",
    defaultCtaUrl: "/",
    headerGradient: "linear-gradient(135deg,#0369a1 0%,#0ea5e9 100%)",
    badge: "Travel Sale",
    offerAccent: "#0369a1",
    offerBg: "#f0f9ff",
  },
  {
    id: "black-friday",
    label: "Black Friday",
    emoji: "🛍️",
    defaultSubject: "Black Friday Universo Nómada — descuentos reales",
    defaultPreheader: "Black Friday: las mejores ofertas del año en viajes",
    defaultHeadline: "Black Friday: reserva tu aventura con descuento",
    defaultBody:
      "Una vez al año bajamos precios en experiencias que normalmente tienen cupos reducidos.\n\nSi postergaste tu viaje, este es el momento. Stock limitado por destino.",
    defaultOfferHighlight: "Black Friday — 40% OFF",
    defaultOfferSubline: "En paquetes y salidas seleccionadas",
    defaultCtaText: "Ver ofertas Black Friday",
    defaultCtaUrl: "/",
    headerGradient: "linear-gradient(135deg,#111827 0%,#374151 100%)",
    badge: "Black Friday",
    offerAccent: "#fbbf24",
    offerBg: "#111827",
  },
  {
    id: "halloween",
    label: "Halloween",
    emoji: "🎃",
    defaultSubject: "Halloween Universo Nómada — experiencias fuera de lo común",
    defaultPreheader: "Oferta especial de Halloween en destinos únicos",
    defaultHeadline: "Esta Halloween, vive algo inolvidable",
    defaultBody:
      "Desde desiertos bajo estrellas hasta territorios ancestrales con historia viva: tenemos experiencias para quienes buscan algo distinto.\n\nPromoción válida por tiempo limitado en salidas seleccionadas.",
    defaultOfferHighlight: "Experiencias desde $650.000",
    defaultOfferSubline: "Oferta Halloween · Cupos limitados",
    defaultCtaText: "Ver experiencias Halloween",
    defaultCtaUrl: "/",
    headerGradient: "linear-gradient(135deg,#7c2d12 0%,#431407 100%)",
    badge: "Halloween",
    offerAccent: "#fb923c",
    offerBg: "#fff7ed",
  },
  {
    id: "navidad",
    label: "Navidad",
    emoji: "🎄",
    defaultSubject: "Regala viajes que transforman — Navidad Universo Nómada",
    defaultPreheader: "Sorprende con una experiencia inolvidable estas fiestas",
    defaultHeadline: "El mejor regalo es vivirlo juntos",
    defaultBody:
      "Esta Navidad, regala más que un objeto: regala naturaleza, cultura y recuerdos que duran toda la vida.\n\nTenemos experiencias en Atacama, Patagonia, Rapa Nui y más. Consulta por vouchers de regalo o reserva fechas para el 2026.",
    defaultOfferHighlight: "Vouchers de regalo disponibles",
    defaultOfferSubline: "Navidad · Reserva fechas 2026",
    defaultCtaText: "Ver regalos de viaje",
    defaultCtaUrl: "/",
    headerGradient: "linear-gradient(135deg,#14532d 0%,#b91c1c 100%)",
    badge: "Navidad 2026",
    offerAccent: "#b91c1c",
    offerBg: "#fef2f2",
  },
  {
    id: "dia-del-padre",
    label: "Día del padre",
    emoji: "👔",
    defaultSubject: "Para papá: una aventura que recordará siempre",
    defaultPreheader: "Celebra el Día del Padre con una experiencia única",
    defaultHeadline: "Un regalo distinto para quien lo merece todo",
    defaultBody:
      "¿Buscas algo más que corbata o perfume? Sorpréndelo con Patagonia, Mendoza, astroturismo en Atacama o una expedición a su medida.\n\nGrupos reducidos, guías expertos y la tranquilidad de viajar con Universo Nómada.",
    defaultOfferHighlight: "Regala aventura — consulta precios especiales",
    defaultOfferSubline: "Día del Padre · Salidas a medida",
    defaultCtaText: "Ver experiencias para regalar",
    defaultCtaUrl: "/",
    headerGradient: "linear-gradient(135deg,#1e3a5f 0%,#334155 100%)",
    badge: "Día del Padre",
    offerAccent: "#334155",
    offerBg: "#f8fafc",
  },
  {
    id: "dia-de-la-madre",
    label: "Día de la madre",
    emoji: "💐",
    defaultSubject: "Para mamá: descanso, belleza y conexión",
    defaultPreheader: "Celebra a mamá con un viaje que la renueve",
    defaultHeadline: "Merece una pausa que la transforme",
    defaultBody:
      "Valle del Elqui, viñedos, ballenas en el norte o cultura viva en Rapa Nui: diseñamos experiencias donde ella solo tiene que disfrutar.\n\nConsulta por fechas, vouchers de regalo y salidas en grupo o privadas.",
    defaultOfferHighlight: "Experiencias Elqui y Rapa Nui con descuento",
    defaultOfferSubline: "Día de la Madre · Cupos limitados",
    defaultCtaText: "Inspirar su próximo viaje",
    defaultCtaUrl: "/",
    headerGradient: "linear-gradient(135deg,#9d174d 0%,#be185d 100%)",
    badge: "Día de la Madre",
    offerAccent: "#be185d",
    offerBg: "#fdf2f8",
  },
  {
    id: "temporada",
    label: "Temporada / cupos",
    emoji: "🌅",
    defaultSubject: "Últimos cupos — temporada Universo Nómada",
    defaultPreheader: "Asegura tu lugar antes de que se agoten",
    defaultHeadline: "Se acaban los cupos de temporada",
    defaultBody:
      "Abrimos fechas para una temporada limitada con salidas confirmadas y guías locales.\n\nSi ya tienes destino en mente, este es el momento de reservar. Te ayudamos con fechas, alojamiento y traslados.",
    defaultOfferHighlight: "Últimos cupos disponibles",
    defaultOfferSubline: "Temporada · Reserva anticipada",
    defaultCtaText: "Reservar ahora",
    defaultCtaUrl: "/",
    headerGradient: "linear-gradient(135deg,#c2410c 0%,#ea580c 100%)",
    badge: "Cupos limitados",
    offerAccent: "#c2410c",
    offerBg: "#fff7ed",
  },
];

export type CampaignContent = {
  templateId: CampaignTemplateId;
  subject: string;
  preheader: string;
  headline: string;
  body: string;
  offerHighlight: string;
  offerSubline: string;
  ctaText: string;
  ctaUrl: string;
  couponCode?: string;
};

export function getCampaignTemplate(id: CampaignTemplateId): CampaignTemplate {
  return CAMPAIGN_TEMPLATES.find((t) => t.id === id) ?? CAMPAIGN_TEMPLATES[0];
}

export function defaultCampaignContent(templateId: CampaignTemplateId): CampaignContent {
  const t = getCampaignTemplate(templateId);
  return {
    templateId: t.id,
    subject: t.defaultSubject,
    preheader: t.defaultPreheader,
    headline: t.defaultHeadline,
    body: t.defaultBody,
    offerHighlight: t.defaultOfferHighlight,
    offerSubline: t.defaultOfferSubline,
    ctaText: t.defaultCtaText,
    ctaUrl: t.defaultCtaUrl,
  };
}

export function parseCampaignContent(body: Record<string, unknown>): CampaignContent | null {
  const templateId = String(body.templateId ?? "oferta-general") as CampaignTemplateId;
  if (!CAMPAIGN_TEMPLATES.some((t) => t.id === templateId)) return null;

  const defaults = defaultCampaignContent(templateId);
  return {
    templateId,
    subject: String(body.subject ?? defaults.subject).trim(),
    preheader: String(body.preheader ?? defaults.preheader).trim(),
    headline: String(body.headline ?? defaults.headline).trim(),
    body: String(body.body ?? defaults.body).trim(),
    offerHighlight: String(body.offerHighlight ?? defaults.offerHighlight).trim(),
    offerSubline: String(body.offerSubline ?? defaults.offerSubline).trim(),
    ctaText: String(body.ctaText ?? defaults.ctaText).trim(),
    ctaUrl: String(body.ctaUrl ?? defaults.ctaUrl).trim(),
    couponCode: body.couponCode ? String(body.couponCode).trim() : undefined,
  };
}
