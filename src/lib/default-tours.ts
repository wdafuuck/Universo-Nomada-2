import { buildDefaultPromotions } from "@/lib/promo-utils";

export type DefaultTour = {
  tourId: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  tag: string;
  category: string;
  price: number;
  originalPrice: number | null;
  duration: string;
  active: boolean;
  sortOrder: number;
};

export const DEFAULT_TOURS: DefaultTour[] = [
  { tourId: "rapa-nui", name: "Rapa Nui", subtitle: "Isla de Pascua, Chile", description: "Misteriosos moais guardians del Pacifico. Vive la cultura ancestral rapanui en medio del oceano mas remoto del planeta. Tapati 2027 con 15% OFF.", image: "/images/rapanui.png", tag: "Cultura & Misterio", category: "internacional", price: 957100, originalPrice: 1126000, duration: "5 dias", active: true, sortOrder: 1 },
  { tourId: "san-pedro-uyuni", name: "San Pedro de Atacama + Uyuni", subtitle: "Chile - Bolivia", description: "Del desierto mas arido al espejo de sal mas grande del mundo. Geisers, lagunas altiplanicas y el Salar de Uyuni.", image: "/images/uyuni.png", tag: "Expedicion", category: "internacional", price: 1658600, originalPrice: null, duration: "10 dias", active: true, sortOrder: 2 },
  { tourId: "cusco-machupicchu", name: "Cusco + Machu Picchu", subtitle: "Peru", description: "La ciudadela inca entre las nubes. Recorre el Camino Inca, explora Cusco imperial y conecta con la historia viva.", image: "/images/cusco.png", tag: "Historia & Trekking", category: "internacional", price: 1200000, originalPrice: null, duration: "7 dias", active: true, sortOrder: 3 },
  { tourId: "terapias-ancestrales", name: "Terapias Ancestrales", subtitle: "Experiencias Andinas, Peru", description: "Terapia sonora ancestral, sanacion con arcilla y conexion con la tierra en los Andes.", image: "/images/terapias_ancestrales.png", tag: "Bienestar & Ancestral", category: "experiencial", price: 350000, originalPrice: null, duration: "3 dias", active: true, sortOrder: 4 },
  { tourId: "ballenas-elqui", name: "Ballenas + Valle del Elqui", subtitle: "Chile", description: "Avistamiento de ballenas en Caleta Chanaral de Aceituno y noches magicas bajo los cielos mas limpios del mundo.", image: "/images/ballenas.png", tag: "Naturaleza & Astro", category: "chile", price: 450000, originalPrice: null, duration: "3 dias", active: true, sortOrder: 5 },
  { tourId: "santiago-vinedos", name: "Santiago + Vinedos", subtitle: "Chile", description: "La vibracion de Santiago entre montanas y los mejores vinos de Chile.", image: "/images/vinedos.png", tag: "City & Vino", category: "chile", price: 280000, originalPrice: null, duration: "2 dias", active: true, sortOrder: 6 },
  { tourId: "bolivia-amazonica", name: "Bolivia Amazonica", subtitle: "Pampas del Yacuma + Selva", description: "Desde las Pampas del Yacuma hasta la selva amazonica.", image: "/images/bolivia.png", tag: "Selva & Wildlife", category: "internacional", price: 980000, originalPrice: null, duration: "6 dias", active: true, sortOrder: 7 },
  { tourId: "region-atacama", name: "Region de Atacama", subtitle: "Chile", description: "Valle de la Luna, Lagunas Altiplanicas, Geisers del Tatio y estrellas infinitas.", image: "/images/atacama-new.png", tag: "Desierto & Estrellas", category: "chile", price: 520000, originalPrice: null, duration: "4 dias", active: true, sortOrder: 8 },
  { tourId: "valle-aconcagua", name: "Valle del Aconcagua", subtitle: "Chile", description: "Vinedos boutique al pie del techo de America.", image: "/images/aconcagua.png", tag: "Montana & Vino", category: "chile", price: 320000, originalPrice: null, duration: "2 dias", active: true, sortOrder: 9 },
  { tourId: "catedrales-marmol", name: "Catedrales de Marmol + Carretera Austral", subtitle: "Patagonia, Chile", description: "Cuevas de marmol esculpidas por el agua turquesa y la ruta mas salvaje de Patagonia.", image: "/images/marmol.png", tag: "Patagonia Extrema", category: "chile", price: 1500000, originalPrice: null, duration: "8 dias", active: true, sortOrder: 10 },
  { tourId: "rio-janeiro", name: "Rio de Janeiro", subtitle: "Brasil", description: "Cristo Redentor, Copacabana, Ipanema y la energia carioca.", image: "/images/rio_janeiro.png", tag: "City & Playa", category: "internacional", price: 698000, originalPrice: null, duration: "5 dias", active: true, sortOrder: 11 },
  { tourId: "florianopolis", name: "Florianopolis", subtitle: "Brasil", description: "42 playas paradisiacas, dunas y selva atlantica.", image: "/images/florianopolis.png", tag: "Playa & Naturaleza", category: "internacional", price: 593000, originalPrice: 698000, duration: "5 dias", active: true, sortOrder: 12 },
  { tourId: "buenos-aires", name: "Buenos Aires", subtitle: "Argentina", description: "Tango, arquitectura europea y gastronomia portena.", image: "/images/buenos_aires.png", tag: "Cultura & Gastronomia", category: "internacional", price: 450000, originalPrice: null, duration: "4 dias", active: true, sortOrder: 13 },
  { tourId: "mendoza", name: "Mendoza", subtitle: "Argentina", description: "Vinos de altura al pie de los Andes. Ruta del malbec.", image: "/images/mendoza.png", tag: "Vino & Montana", category: "internacional", price: 586700, originalPrice: 690300, duration: "5 dias", active: true, sortOrder: 14 },
  { tourId: "group-atacama", name: "Grupal Atacama", subtitle: "San Pedro de Atacama", description: "Viaje grupal 4D/3N con vuelo, hotel, tours y lider de grupo.", image: "/images/atacama-new.png", tag: "Grupal", category: "grupal", price: 784000, originalPrice: null, duration: "4D/3N", active: true, sortOrder: 15 },
  { tourId: "group-uyuni", name: "Grupal Uyuni", subtitle: "Salar de Uyuni", description: "Viaje grupal 6D/5N todo incluido.", image: "/images/uyuni.png", tag: "Grupal", category: "grupal", price: 968700, originalPrice: null, duration: "6D/5N", active: true, sortOrder: 16 },
  { tourId: "group-rapa-nui", name: "Grupal Rapa Nui", subtitle: "Isla de Pascua", description: "Viaje grupal 5D/4N con vuelo y experiencias culturales.", image: "/images/rapanui.png", tag: "Grupal", category: "grupal", price: 1205000, originalPrice: null, duration: "5D/4N", active: true, sortOrder: 17 },
];

export const DEFAULT_PROMOTIONS = buildDefaultPromotions();
