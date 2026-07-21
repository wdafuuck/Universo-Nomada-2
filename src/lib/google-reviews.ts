export type GoogleReview = {
  id: string;
  name: string;
  photo: string;
  rating: number;
  date: string;
  text: string;
  destination?: string;
  authorUrl?: string;
  reviewUrl?: string;
};

export type GoogleReviewsPayload = {
  reviews: GoogleReview[];
  placePhotos: string[];
  rating: number;
  totalReviews: number;
  placeName: string;
  googleMapsUrl: string;
  source: "google" | "fallback";
};

/** Enlace compartido de reseñas en Google (perfil Universo Nómada) */
export const GOOGLE_REVIEWS_URL =
  process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL ??
  "https://share.google/DyUlJi938LkoVosKT";

/** Búsqueda para resolver el place_id vía Places API cuando no está configurado */
export const GOOGLE_PLACE_QUERY = "Universo Nómada agencia de viajes Chile";

/**
 * Respaldo offline: mismas reseñas verificadas que devuelve Google Places (texto real de clientes).
 * Sin avatares genéricos — las fotos se cargan en vivo desde la API cuando está disponible.
 */
export const googleReviews: GoogleReview[] = [
  {
    id: "google-renan-concha",
    name: "Renan Adolfo Concha Zelada",
    photo: "",
    rating: 5,
    date: "Hace 4 meses",
    text: "Queremos agradecer a Universo Nómada por la excelente gestión de nuestro viaje a San Pedro de Atacama. Todo estuvo perfectamente organizado y fue una experiencia inolvidable.\nUn agradecimiento especial a Rocío Carrillo por su dedicación, amabilidad y constante apoyo durante todo el viaje.\n¡Totalmente recomendados!",
    destination: "San Pedro de Atacama",
    authorUrl: "https://www.google.com/maps/contrib/116711185569764364242/reviews",
  },
  {
    id: "google-erika-cerda",
    name: "Erika Cerda",
    photo: "",
    rating: 5,
    date: "Hace 5 meses",
    text: "Excelente Agencia, hice un maravilloso viaje a Cusco, todo gestionado. Preocupación constante tanto de Rocío desde Chile y Mario en Perú. Agradecida por todas sus atenciones, antes, durante y después de mi viaje. 10000000/10. Totalmente recomendables.",
    destination: "Cusco, Perú",
    authorUrl: "https://www.google.com/maps/contrib/111094267237857272609/reviews",
  },
  {
    id: "google-brenda-lozano",
    name: "Brenda Lozano Hernandez",
    photo: "",
    rating: 5,
    date: "Hace 7 meses",
    text: "Una agencia muy seria. Te envian toda la documentación que necesitas de respaldo una vez pagado el abono del viaje. Siempre que los necesité les hablaba a su whasap y me contestaban inmediatamente. Me senti muy acompañada. Todo el tour estaba preparado con mucha dedicación y nos entregaron un buen servicio. Nada que decir. Solo agradecer por su amabilidad. Muchas gracias. ❤️",
    authorUrl: "https://www.google.com/maps/contrib/103749253656513278159/reviews",
  },
  {
    id: "google-andrea-cruz",
    name: "Andrea Cruz Leroux",
    photo: "",
    rating: 5,
    date: "Hace 5 meses",
    text: "Maravilloso el viaje a Rio y sus Tour, la agencia preocupada de todos los detalles y siempre disponibles, lo que hace que el viaje se cumpla de acuerdo a lo programado y uno se dedique a disfrutar de un destino hermoso…..100% recomendado viajar con Universo Nomada ☀️😎🍹🇧🇷❤️",
    destination: "Rio de Janeiro, Brasil",
    authorUrl: "https://www.google.com/maps/contrib/110083641139622228342/reviews",
  },
  {
    id: "google-monica-alarcon",
    name: "Monica Alarcon",
    photo: "",
    rating: 5,
    date: "Hace 2 meses",
    text: "“Tuve una experiencia maravillosa en San Pedro de Atacama. Los paisajes son impresionantes, la tranquilidad del lugar y sus cielos únicos hacen que el viaje sea inolvidable. Disfrutamos cada recorrido, la gastronomía y la calidez de las personas. Lo pasamos muy bien y sin duda volveríamos nuevamente. Totalmente recomendado para quienes buscan desconectarse y vivir una experiencia diferente.”\nY agradecer a Rocío de Universo Nómada quien se encargó de todo.\nMuchas gracias",
    destination: "San Pedro de Atacama",
    authorUrl: "https://www.google.com/maps/contrib/113277997708213709664/reviews",
  },
];

export function reviewsPublicUrl(): string {
  return (
    process.env.GOOGLE_REVIEWS_URL?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL?.trim() ||
    GOOGLE_REVIEWS_URL
  );
}
