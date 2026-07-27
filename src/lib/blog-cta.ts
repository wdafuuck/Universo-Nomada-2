/** Enlaces internos blog → paquete / landing (SEO + conversión). */
export const BLOG_CTA_BY_SLUG: Record<
  string,
  { href: string; label: string; blurb: string }
> = {
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

export function getBlogCta(slug: string) {
  return BLOG_CTA_BY_SLUG[slug] ?? {
    href: "/viajes",
    label: "Ver destinos",
    blurb: "Descubre viajes a medida con Universo Nómada.",
  };
}
