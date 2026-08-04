/** Enlaces internos blog → hub/paquete (SEO + conversión). */

export type BlogCta = { href: string; label: string; blurb: string };

export const BLOG_CTA_BY_SLUG: Record<string, BlogCta> = {
  "guia-rapa-nui-2027": {
    href: "/viajes/rapa-nui",
    label: "Ver viajes a Rapa Nui",
    blurb: "Guía y paquetes a Isla de Pascua, con opción Tapati 2027.",
  },
  "temporada-ballenas-elqui": {
    href: "/viajes/valle-del-elqui",
    label: "Ver Valle del Elqui y ballenas",
    blurb: "Temporada de ballenas y cielos del Elqui en un solo viaje boutique.",
  },
  "atacama-uyuni-ruta-completa": {
    href: "/viajes/atacama",
    label: "Ver viajes a Atacama y Uyuni",
    blurb: "Desierto, salar y salidas grupales con logística incluida.",
  },
  "san-pedro-atacama-astroturismo": {
    href: "/viajes/atacama",
    label: "Ver viajes a Atacama",
    blurb: "Desierto, estrellas y puerta al Salar de Uyuni.",
  },
  "patagonia-carretera-austral": {
    href: "/viajes/patagonia",
    label: "Ver viajes a la Patagonia",
    blurb: "Catedrales de Mármol y Carretera Austral a ritmo boutique.",
  },
  "cusco-machu-picchu-consejos": {
    href: "/viajes/cusco-machu-picchu",
    label: "Ver Cusco + Machu Picchu",
    blurb: "Ciudadela inca con asesoría desde Chile.",
  },
  "mendoza-ruta-del-vino": {
    href: "/viajes/mendoza",
    label: "Ver viajes a Mendoza",
    blurb: "Vinos de altura y Andes a pocas horas de Santiago.",
  },
  "florianopolis-playas-brasil": {
    href: "/viajes/florianopolis",
    label: "Ver viajes a Florianópolis",
    blurb: "Playas, dunas y gastronomía brasileña sin complicaciones.",
  },
  "viajes-corporativos-chile": {
    href: "/viajes/chile",
    label: "Ver viajes a Chile",
    blurb: "Experiencias a medida para equipos y viajeros por Chile.",
  },
  "por-que-elegir-turismo-experiencial": {
    href: "/viajes",
    label: "Explorar destinos",
    blurb: "Elige tu próxima experiencia con Universo Nómada.",
  },
  "comunidades-locales-impacto-real": {
    href: "/viajes/chile",
    label: "Viajes a Chile con impacto",
    blurb: "Viajes con impacto real en comunidades locales.",
  },
  "rituales-naturaleza-ciencia-cultura": {
    href: "/viajes/cusco-machu-picchu",
    label: "Ver experiencias andinas",
    blurb: "Bienestar andino y conexión con la tierra cerca de Cusco.",
  },
};

/** Reglas por palabras del slug/título → hub (cubre los ~85 posts sin mapear a mano). */
const KEYWORD_RULES: { re: RegExp; cta: BlogCta }[] = [
  {
    re: /rapa-?nui|pascua|tapati|moai|anakena/,
    cta: {
      href: "/viajes/rapa-nui",
      label: "Ver paquetes a Rapa Nui",
      blurb: "Viajes boutique a Isla de Pascua con asesoría Universo Nómada.",
    },
  },
  {
    re: /atacama|uyuni|san-pedro|tatio|desierto/,
    cta: {
      href: "/viajes/atacama",
      label: "Ver viajes a Atacama",
      blurb: "San Pedro, salares y salidas grupales con todo incluido.",
    },
  },
  {
    re: /patagonia|torres-del-paine|carretera-austral|marmol|catedrales/,
    cta: {
      href: "/viajes/patagonia",
      label: "Ver viajes a la Patagonia",
      blurb: "Patagonia y Carretera Austral a tu ritmo.",
    },
  },
  {
    re: /elqui|ballena|vicuna|pisco/,
    cta: {
      href: "/viajes/valle-del-elqui",
      label: "Ver Valle del Elqui",
      blurb: "Astroturismo, ballenas y viñas del Elqui.",
    },
  },
  {
    re: /cusco|machu|picchu|peru|lima/,
    cta: {
      href: "/viajes/cusco-machu-picchu",
      label: "Ver Cusco y Machu Picchu",
      blurb: "Perú con logística clara desde Chile.",
    },
  },
  {
    re: /mendoza|malbec|vino.*argentina|argentina.*vino/,
    cta: {
      href: "/viajes/mendoza",
      label: "Ver viajes a Mendoza",
      blurb: "Ruta del vino y Andes argentinos.",
    },
  },
  {
    re: /florianopolis|floripa|brasil|rio-de-janeiro|iguazu|foz/,
    cta: {
      href: "/viajes/florianopolis",
      label: "Ver viajes a Brasil",
      blurb: "Playas y ciudades de Brasil con Universo Nómada.",
    },
  },
  {
    re: /buenos-aires|argentina|tango/,
    cta: {
      href: "/viajes/buenos-aires",
      label: "Ver viajes a Buenos Aires",
      blurb: "City break porteño con asesoría boutique.",
    },
  },
  {
    re: /chile|santiago|vina|chiloe|carretera/,
    cta: {
      href: "/viajes/chile",
      label: "Ver viajes a Chile",
      blurb: "Rutas por Chile con agencia SERNATUR.",
    },
  },
  {
    re: /vuelo|avion|aeropuerto|equipaje|pasaporte|visa|seguro|reserv/,
    cta: {
      href: "/viajes",
      label: "Explorar destinos y cotizar",
      blurb: "Te armamos el viaje completo: vuelos, hotel y experiencias.",
    },
  },
];

const DEFAULT_CTA: BlogCta = {
  href: "/viajes",
  label: "Ver destinos y paquetes",
  blurb: "Descubre viajes a medida con Universo Nómada® — cotiza por WhatsApp.",
};

export function getBlogCta(slug: string, titleEs = ""): BlogCta {
  const exact = BLOG_CTA_BY_SLUG[slug];
  if (exact) return exact;
  const hay = `${slug} ${titleEs}`.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.re.test(hay)) return rule.cta;
  }
  return DEFAULT_CTA;
}
