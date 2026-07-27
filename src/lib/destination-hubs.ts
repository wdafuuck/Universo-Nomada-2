export type DestinationHub = {
  slug: string;
  /** H1 / título SEO */
  title: string;
  /** Subtítulo corto bajo el H1 */
  subtitle: string;
  /** Meta description */
  description: string;
  image: string;
  /** Keywords específicas */
  keywords: string[];
  /** Párrafos del cuerpo (SEO + lectura) */
  paragraphs: string[];
  /** Highlights / bullets */
  highlights: string[];
  /** tourIds vinculados a este hub */
  tourIds: string[];
  /** Landings estacionales relacionadas */
  relatedSeasonalSlugs?: string[];
  faqs?: { question: string; answer: string }[];
  whatsappMsg: string;
};

/**
 * Hubs indexables /viajes/[slug] para ranking de “viajes a [destino]” y “viajes chile”.
 * Las landings estacionales (tapati-2027, etc.) siguen en rutas estáticas propias.
 */
export const DESTINATION_HUBS: DestinationHub[] = [
  {
    slug: "chile",
    title: "Viajes a Chile",
    subtitle: "Ruta boutique por el país más largo del mundo",
    description:
      "Viajes a Chile con Universo Nómada®: Atacama, Patagonia, Rapa Nui, Elqui y más. Paquetes a medida desde La Serena y Viña del Mar. Agencia SERNATUR.",
    image: "/images/atacama-new.png",
    keywords: [
      "viajes chile",
      "viajes a chile",
      "agencia de viajes chile",
      "paquetes turísticos chile",
      "tours chile",
      "turismo chile",
    ],
    paragraphs: [
      "Chile concentra desiertos, fiordos, volcanes, viñedos y una isla polinesia a cinco horas de Santiago. En Universo Nómada® diseñamos viajes a Chile a medida: ritmos pausados, alojamientos cuidados y logística clara para que el viaje se sienta boutique, no masivo.",
      "Trabajamos desde La Serena y Viña del Mar con registro SERNATUR. Combinamos destinos nacionales (Atacama, Patagonia, Elqui, Santiago y viñedos) con salidas a Rapa Nui y rutas vecinas cuando el itinerario lo pide. Tú eliges fechas, compañía y nivel de aventura; nosotros armamos el resto.",
      "Si buscas “viajes Chile” con asesoría real —no un catálogo genérico—, aquí puedes explorar hubs por destino, paquetes listos y salidas grupales con cupos. Cotiza por WhatsApp o reserva online con abono y saldo antes del viaje.",
    ],
    highlights: [
      "Diseño a medida o salidas grupales confirmadas",
      "Destinos icono: Atacama, Patagonia, Rapa Nui, Elqui",
      "Asesoría desde Chile con pagos locales y transferencia",
      "Agencia registrada SERNATUR",
    ],
    tourIds: [
      "region-atacama",
      "ballenas-elqui",
      "santiago-vinedos",
      "valle-aconcagua",
      "catedrales-marmol",
      "rapa-nui",
    ],
    relatedSeasonalSlugs: ["ballenas-elqui", "atacama-grupal", "tapati-2027"],
    faqs: [
      {
        question: "¿Qué destinos de Chile recomiendan primero?",
        answer:
          "Depende de la temporada y tus intereses. Atacama y Elqui funcionan casi todo el año; Patagonia brilla en primavera-verano; Rapa Nui es ideal con anticipación (especialmente Tapati).",
      },
      {
        question: "¿Puedo armar un viaje solo por Chile sin salir del país?",
        answer:
          "Sí. Combinamos, por ejemplo, Santiago + viñedos + Elqui, o Atacama + norte, con traslados y hoteles seleccionados.",
      },
    ],
    whatsappMsg: "Hola! Quiero cotizar un viaje a Chile con Universo Nómada.",
  },
  {
    slug: "rapa-nui",
    title: "Viajes a Rapa Nui",
    subtitle: "Isla de Pascua · cultura, moais y Pacífico remoto",
    description:
      "Viajes a Rapa Nui (Isla de Pascua) con Universo Nómada®: paquetes con guía cultural, moais al amanecer y opciones Tapati. Cotiza desde Chile.",
    image: "/images/rapanui.png",
    keywords: [
      "viajes a rapa nui",
      "viaje isla de pascua",
      "paquete rapa nui chile",
      "tapati rapa nui",
      "tours isla de pascua",
    ],
    paragraphs: [
      "Rapa Nui es el rincón más remoto de la Polinesia chilena: moais, ahu ceremoniales, cráteres y un océano que redefine la escala del viaje. Nuestros programas priorizan respeto cultural, guías locales y amaneceres en Tongariki sin aglomeraciones innecesarias.",
      "Puedes viajar en formato privado o sumarte a salidas grupales. Para el Tapati Rapa Nui trabajamos cupos anticipados con descuento: festival, competencias y ceremonias con logística boutique.",
      "Desde Chile resolvemos vuelos referenciales, hoteles y experiencias. El precio del paquete no exhibe tarifas de vuelo al detalle: te mostramos horarios y armamos el itinerario completo contigo.",
    ],
    highlights: [
      "Guía cultural y sitios patrimoniales clave",
      "Amanecer en Ahu Tongariki",
      "Opción Tapati 2027 con cupos limitados",
      "Formato privado o grupal",
    ],
    tourIds: ["rapa-nui", "group-rapa-nui"],
    relatedSeasonalSlugs: ["tapati-2027"],
    faqs: [
      {
        question: "¿Cuántos días recomiendan en Rapa Nui?",
        answer:
          "El programa base es de 5 días. Si buscas más playa o buceo, alargamos la estadía según temporada.",
      },
    ],
    whatsappMsg: "Hola! Quiero cotizar un viaje a Rapa Nui con Universo Nómada.",
  },
  {
    slug: "atacama",
    title: "Viajes a Atacama",
    subtitle: "San Pedro, desierto y puerta al Salar de Uyuni",
    description:
      "Viajes a San Pedro de Atacama y Atacama + Uyuni con Universo Nómada®. Valle de la Luna, Géiseres del Tatio, estrellas y salidas grupales.",
    image: "/images/atacama-new.png",
    keywords: [
      "viajes a atacama",
      "san pedro de atacama tour",
      "atacama uyuni",
      "paquete atacama chile",
      "viaje grupal atacama",
    ],
    paragraphs: [
      "El desierto de Atacama es el más árido del planeta y uno de los cielos más limpios del mundo. Desde San Pedro armamos itinerarios con Valle de la Luna, lagunas altiplánicas, Géiseres del Tatio y noches de astroturismo.",
      "También cruzamos a Bolivia para la ruta completa Atacama + Salar de Uyuni: espejo de sal, lagunas de colores y logística cuidada en altura. Hay versión privada y grupal con líder Universo Nómada.",
      "Ideal para quienes buscan paisaje extremo sin improvisar. Te ayudamos con aclimatación, ventanas climáticas y abonos para asegurar cupo.",
    ],
    highlights: [
      "Atacama solo Chile o combo con Uyuni",
      "Salidas grupales con vuelo y hotel",
      "Astroturismo y lagunas altiplánicas",
      "Asesoría en altura y logística fronteriza",
    ],
    tourIds: ["region-atacama", "san-pedro-uyuni", "group-atacama", "group-uyuni"],
    relatedSeasonalSlugs: ["atacama-grupal"],
    faqs: [
      {
        question: "¿Atacama es recomendable todo el año?",
        answer:
          "Sí, con matices: en invierno las noches son muy frías y en verano hay más movimiento. Te orientamos según tu fecha.",
      },
    ],
    whatsappMsg: "Hola! Quiero cotizar un viaje a Atacama / Uyuni con Universo Nómada.",
  },
  {
    slug: "patagonia",
    title: "Viajes a la Patagonia",
    subtitle: "Catedrales de Mármol y Carretera Austral",
    description:
      "Viajes a la Patagonia chilena con Universo Nómada®: Catedrales de Mármol, Carretera Austral y naturaleza extrema a ritmo boutique.",
    image: "/images/marmol.png",
    keywords: [
      "viajes patagonia chile",
      "catedrales de marmol",
      "carretera austral tour",
      "viaje patagonia desde chile",
    ],
    paragraphs: [
      "La Patagonia chilena pide tiempo y respeto por el clima. Nuestro programa de Catedrales de Mármol + Carretera Austral combina agua turquesa, bosques y tramos de la ruta más salvaje del sur.",
      "Diseñamos el viaje con margen para clima, ferry y tramos de ripio. No es un tour express: es una inmersión en paisaje con hoteles y experiencias seleccionadas.",
      "Si buscas Torres del Paine u otras variantes, cotizamos a medida según temporada y nivel de trekking.",
    ],
    highlights: [
      "Catedrales de Mármol en kayak o embarcación",
      "Carretera Austral con ritmo pausado",
      "Logística de ferry y clima",
      "Opción de extensión a medida",
    ],
    tourIds: ["catedrales-marmol"],
    whatsappMsg: "Hola! Quiero cotizar un viaje a la Patagonia chilena con Universo Nómada.",
  },
  {
    slug: "cusco-machu-picchu",
    title: "Viajes a Cusco y Machu Picchu",
    subtitle: "Perú desde Chile · historia viva en los Andes",
    description:
      "Viajes a Cusco y Machu Picchu desde Chile con Universo Nómada®. Valle Sagrado, ciudadela inca y asesoría completa.",
    image: "/images/cusco.png",
    keywords: [
      "viaje cusco machu picchu",
      "machu picchu desde chile",
      "paquete cusco",
      "tour valle sagrado",
    ],
    paragraphs: [
      "Cusco y Machu Picchu concentran historia inca, altura andina y paisajes del Valle Sagrado. Desde Chile armamos el paquete con trenes, entradas y ritmo sensato para aclimatación.",
      "Incluimos orientación sobre mal de altura, mejores horarios de visita y combinación con terapias ancestrales andinas si buscas una capa experiencial.",
      "Ideal como primer viaje internacional desde Chile con acompañamiento cercano y pagos locales.",
    ],
    highlights: [
      "Machu Picchu con logística clara",
      "Valle Sagrado y Cusco imperial",
      "Asesoría en altura",
      "Opcional: terapias ancestrales",
    ],
    tourIds: ["cusco-machupicchu", "terapias-ancestrales"],
    faqs: [
      {
        question: "¿Cuántos días necesito para Cusco + Machu Picchu?",
        answer:
          "El programa base es de 7 días. Si vienes directo desde el nivel del mar, conviene al menos un día de aclimatación en Cusco.",
      },
    ],
    whatsappMsg: "Hola! Quiero cotizar Cusco + Machu Picchu con Universo Nómada.",
  },
  {
    slug: "mendoza",
    title: "Viajes a Mendoza",
    subtitle: "Vinos de altura al pie de los Andes",
    description:
      "Viajes a Mendoza desde Chile con Universo Nómada®: ruta del malbec, alta montaña y gastronomía. Paquete boutique.",
    image: "/images/mendoza.png",
    keywords: ["viaje mendoza", "ruta del vino mendoza", "mendoza desde chile", "tour vinos mendoza"],
    paragraphs: [
      "Mendoza es la capital del malbec y una escapada perfecta desde Chile: viñedos de altura, Cordillera de fondo y una escena gastronómica que invita a quedarse.",
      "Armamos rutas de bodegas, alta montaña y ciudad con traslados cómodos. Ideal en pareja o con amigos que disfrutan vino sin un tour rígido.",
    ],
    highlights: [
      "Bodegas y degustaciones seleccionadas",
      "Alta montaña y paisajes andinos",
      "Formato flexible desde Chile",
    ],
    tourIds: ["mendoza"],
    whatsappMsg: "Hola! Quiero cotizar un viaje a Mendoza con Universo Nómada.",
  },
  {
    slug: "florianopolis",
    title: "Viajes a Florianópolis",
    subtitle: "Playas, dunas y selva atlántica en Brasil",
    description:
      "Viajes a Florianópolis (Floripa) desde Chile con Universo Nómada®. Playas, dunas y gastronomía brasileña sin complicaciones.",
    image: "/images/florianopolis.png",
    keywords: ["viaje florianopolis", "floripa desde chile", "playas brasil tour", "paquete florianopolis"],
    paragraphs: [
      "Florianópolis combina más de 40 playas con dunas, lagoa y selva atlántica. Es una de las escapadas favoritas desde Chile cuando buscas sol, mar y buena mesa.",
      "Diseñamos el viaje con base cómoda y días libres para elegir playa según el viento y tu estilo (surf, familia o relax).",
    ],
    highlights: [
      "Playas norte y sur según temporada",
      "Gastronomía y ambiente brasileño",
      "Paquete claro desde Chile",
    ],
    tourIds: ["florianopolis"],
    whatsappMsg: "Hola! Quiero cotizar Florianópolis con Universo Nómada.",
  },
  {
    slug: "rio-de-janeiro",
    title: "Viajes a Río de Janeiro",
    subtitle: "Cristo, Copacabana y energía carioca",
    description:
      "Viajes a Río de Janeiro desde Chile con Universo Nómada®. Cristo Redentor, Copacabana, Ipanema y ciudad vibrante.",
    image: "/images/rio_janeiro.png",
    keywords: ["viaje rio de janeiro", "rio desde chile", "paquete rio brasil", "copacabana tour"],
    paragraphs: [
      "Río de Janeiro es ciudad, playa y miradores icónicos. Armamos un itinerario con Cristo Redentor, Pan de Azúcar, Copacabana e Ipanema, con hoteles en zonas convenientes y traslados seguros.",
      "Ideal para una primera visita a Brasil o para combinar con otra ciudad del país a medida.",
    ],
    highlights: [
      "Iconos cariocas sin estrés logístico",
      "Playas y miradores",
      "Asesoría de zonas y seguridad",
    ],
    tourIds: ["rio-janeiro"],
    whatsappMsg: "Hola! Quiero cotizar Río de Janeiro con Universo Nómada.",
  },
  {
    slug: "buenos-aires",
    title: "Viajes a Buenos Aires",
    subtitle: "Tango, arquitectura y mesa porteña",
    description:
      "Viajes a Buenos Aires desde Chile con Universo Nómada®. Barrios, tango, gastronomía y city break boutique.",
    image: "/images/buenos_aires.png",
    keywords: ["viaje buenos aires", "buenos aires desde chile", "city break buenos aires", "tour tango"],
    paragraphs: [
      "Buenos Aires es un city break perfecto desde Chile: barrios con identidad, escena cultural y una mesa que rivaliza con cualquier capital europea.",
      "Te proponemos un recorrido flexible por Palermo, San Telmo, Recoleta y una noche de tango si lo deseas, con hoteles bien ubicados.",
    ],
    highlights: [
      "City break corto o extendido",
      "Gastronomía y cultura porteña",
      "Fácil de combinar con Mendoza",
    ],
    tourIds: ["buenos-aires"],
    whatsappMsg: "Hola! Quiero cotizar Buenos Aires con Universo Nómada.",
  },
  {
    slug: "valle-del-elqui",
    title: "Viajes al Valle del Elqui",
    subtitle: "Cielos estrellados, pisco y ballenas en temporada",
    description:
      "Viajes al Valle del Elqui y Ballenas + Elqui con Universo Nómada®. Astroturismo, pisco artesanal y avistamiento en temporada.",
    image: "/images/ballenas.png",
    keywords: [
      "viaje valle del elqui",
      "ballenas elqui",
      "astroturismo elqui",
      "tour elqui chile",
    ],
    paragraphs: [
      "El Valle del Elqui ofrece algunos de los cielos más limpios del planeta, pisqueras artesanales y un ritmo ideal para desconectar cerca de La Serena.",
      "En temporada combinamos Elqui con avistamiento de ballenas en Caleta Chañaral de Aceituno: naturaleza marina de día y estrellas de noche.",
    ],
    highlights: [
      "Noche astronómica",
      "Pisco y viñedos del valle",
      "Combo ballenas en temporada",
    ],
    tourIds: ["ballenas-elqui"],
    relatedSeasonalSlugs: ["ballenas-elqui"],
    whatsappMsg: "Hola! Quiero cotizar Valle del Elqui / Ballenas con Universo Nómada.",
  },
];

const TOUR_TO_HUB: Record<string, string> = {
  "rapa-nui": "rapa-nui",
  "group-rapa-nui": "rapa-nui",
  "region-atacama": "atacama",
  "san-pedro-uyuni": "atacama",
  "group-atacama": "atacama",
  "group-uyuni": "atacama",
  "catedrales-marmol": "patagonia",
  "cusco-machupicchu": "cusco-machu-picchu",
  "terapias-ancestrales": "cusco-machu-picchu",
  mendoza: "mendoza",
  florianopolis: "florianopolis",
  "rio-janeiro": "rio-de-janeiro",
  "buenos-aires": "buenos-aires",
  "ballenas-elqui": "valle-del-elqui",
  "santiago-vinedos": "chile",
  "valle-aconcagua": "chile",
  "bolivia-amazonica": "chile",
};

export function getDestinationHub(slug: string): DestinationHub | undefined {
  return DESTINATION_HUBS.find((h) => h.slug === slug);
}

export function getHubSlugForTourId(tourId: string): string | undefined {
  return TOUR_TO_HUB[tourId];
}

export function getHubForTourId(tourId: string): DestinationHub | undefined {
  const slug = getHubSlugForTourId(tourId);
  return slug ? getDestinationHub(slug) : undefined;
}

export function listDestinationHubSlugs(): string[] {
  return DESTINATION_HUBS.map((h) => h.slug);
}
