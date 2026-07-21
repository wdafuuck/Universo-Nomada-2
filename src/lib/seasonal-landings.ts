export type SeasonalLanding = {
  slug: string;
  tourId: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  highlights: string[];
  priceFrom: number;
  validUntil: string;
  whatsappMsg: string;
};

export const SEASONAL_LANDINGS: SeasonalLanding[] = [
  {
    slug: "tapati-2027",
    tourId: "rapa-nui",
    title: "Tapati Rapa Nui 2027",
    subtitle: "Festival cultural en Isla de Pascua",
    description:
      "Vive el Tapati Rapa Nui 2027 con guías locales, ceremonias ancestrales y los moais al amanecer. Cupos limitados con 15% de descuento anticipado.",
    image: "/images/rapanui.png",
    highlights: [
      "Ceremonias y competencias del Tapati",
      "Ahu Tongariki al amanecer",
      "Guía cultural bilingüe",
      "Alojamiento boutique seleccionado",
    ],
    priceFrom: 957100,
    validUntil: "31 diciembre 2026",
    whatsappMsg: "Hola! Quiero información del viaje Tapati Rapa Nui 2027 con Universo Nómada.",
  },
  {
    slug: "ballenas-elqui",
    tourId: "ballenas-elqui",
    title: "Ballenas + Valle del Elqui",
    subtitle: "Avistamiento y cielos estrellados",
    description:
      "Temporada de ballenas en Caleta Chañaral de Aceituno combinada con noches mágicas en el Valle del Elqui. Experiencia familiar boutique.",
    image: "/images/ballenas.png",
    highlights: [
      "Avistamiento de ballenas jorobadas",
      "Noche astronómica en Elqui",
      "Pisco artesanal y viñedos",
      "Grupos reducidos",
    ],
    priceFrom: 450000,
    validUntil: "30 noviembre 2026",
    whatsappMsg: "Hola! Quiero cotizar el viaje Ballenas + Valle del Elqui con Universo Nómada.",
  },
  {
    slug: "atacama-grupal",
    tourId: "group-atacama",
    title: "Atacama Grupal 4D/3N",
    subtitle: "Salidas confirmadas con cupos",
    description:
      "Viaje grupal a San Pedro de Atacama con vuelo, hotel, tours y líder de grupo. Ideal para viajeros que buscan compañía y logística impecable.",
    image: "/images/atacama-new.png",
    highlights: [
      "Valle de la Luna y Geisers del Tatio",
      "Vuelo + hotel 3★ incluidos",
      "Líder de grupo Universo Nómada",
      "Reserva desde $100.000 CLP",
    ],
    priceFrom: 784000,
    validUntil: "15 octubre 2026",
    whatsappMsg: "Hola! Quiero reservar el viaje grupal Atacama 4D/3N con Universo Nómada.",
  },
];

export function getSeasonalLanding(slug: string): SeasonalLanding | undefined {
  return SEASONAL_LANDINGS.find((l) => l.slug === slug);
}
