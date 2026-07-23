/** Enlaces internos blog → paquete / landing (SEO + conversión). */
export const BLOG_CTA_BY_SLUG: Record<
  string,
  { href: string; label: string; blurb: string }
> = {
  "guia-rapa-nui-2027": {
    href: "/viajes/tapati-2027",
    label: "Ver Tapati Rapa Nui 2027",
    blurb: "Cupos limitados con descuento anticipado. Cotiza el viaje completo con nosotros.",
  },
  "temporada-ballenas-elqui": {
    href: "/viajes/ballenas-elqui",
    label: "Ver Ballenas + Elqui",
    blurb: "Temporada de ballenas y cielos del Elqui en un solo viaje boutique.",
  },
  "atacama-uyuni-ruta-completa": {
    href: "/viajes/atacama-grupal",
    label: "Ver viaje grupal Atacama + Uyuni",
    blurb: "Ruta completa con logística, hotel y líder de grupo.",
  },
  "san-pedro-atacama-astroturismo": {
    href: "/detalle-paquete/san-pedro-uyuni",
    label: "Ver paquete Atacama + Uyuni",
    blurb: "Desierto, salar y estrellas con diseño a medida.",
  },
  "patagonia-carretera-austral": {
    href: "/detalle-paquete/catedrales-marmol",
    label: "Ver Catedrales + Carretera Austral",
    blurb: "Patagonia extrema con ritmo pausado y naturaleza pura.",
  },
  "cusco-machu-picchu-consejos": {
    href: "/detalle-paquete/cusco-machupicchu",
    label: "Ver Cusco + Machu Picchu",
    blurb: "Ciudadela inca con asesoría desde Chile.",
  },
  "mendoza-ruta-del-vino": {
    href: "/detalle-paquete/mendoza",
    label: "Ver Mendoza",
    blurb: "Vinos de altura y Andes a pocas horas de Santiago.",
  },
  "florianopolis-playas-brasil": {
    href: "/detalle-paquete/florianopolis",
    label: "Ver Florianópolis",
    blurb: "Playas, dunas y gastronomía brasileña sin complicaciones.",
  },
  "viajes-corporativos-chile": {
    href: "/#contacto",
    label: "Cotizar viaje corporativo",
    blurb: "Experiencias a medida para equipos y empresas.",
  },
  "por-que-elegir-turismo-experiencial": {
    href: "/#destinos",
    label: "Explorar destinos",
    blurb: "Elige tu próxima experiencia con Universo Nómada.",
  },
  "comunidades-locales-impacto-real": {
    href: "/#nosotros",
    label: "Conocer Universo Nómada",
    blurb: "Viajes con impacto real en comunidades locales.",
  },
  "rituales-naturaleza-ciencia-cultura": {
    href: "/detalle-paquete/terapias-ancestrales",
    label: "Ver Terapias Ancestrales",
    blurb: "Bienestar andino y conexión con la tierra.",
  },
};

export function getBlogCta(slug: string) {
  return BLOG_CTA_BY_SLUG[slug] ?? {
    href: "/#destinos",
    label: "Ver paquetes",
    blurb: "Descubre viajes a medida con Universo Nómada.",
  };
}
