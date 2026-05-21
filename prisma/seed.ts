import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const destinations = [
  {
    id: "rapa-nui", name: "Rapa Nui", subtitle: "Isla de Pascua, Chile", image: "/images/rapanui.png",
    description: "Misteriosos moais guardians del Pacifico. Vive la cultura ancestral rapanui en medio del oceano mas remoto del planeta. Tapati 2027 con 15% OFF.",
    tag: "Cultura & Misterio", tagColor: "bg-violet-500/20 text-violet-300", icon: "Compass", category: "internacional",
    price: 957100, originalPrice: 1126000, duration: "5 dias", order: 1,
    highlights: [
      "Visita a los moais en Ahu Tongariki",
      "Playa de Anakena y sus palmeras",
      "Volcán Rano Raraku",
      "Ceremonia de Takona tradicional",
      "Observación de estrellas en el pacífico",
    ],
    includes: [
      "Traslados aeropuerto-hotel-aeropuerto",
      "Alojamiento en hotel 3 estrellas",
      "Desayuno diario",
      "Guías locales bilingües",
      "Entradas a parques y sitios arqueológicos",
    ],
    notIncludes: [
      "Pasajes aéreos",
      "Almuerzos y cenas",
      "Seguro de viaje",
      "Propinas",
    ],
  },
  { id: "san-pedro-uyuni", name: "San Pedro de Atacama + Uyuni", subtitle: "Chile - Bolivia", image: "/images/uyuni.png", description: "Del desierto mas arido al espejo de sal mas grande del mundo. Geisers, lagunas altiplanicas y el Salar de Uyuni. Viaje grupal 10 dias.", tag: "Expedicion", tagColor: "bg-amber-500/20 text-amber-300", icon: "Mountain", category: "internacional", price: 1658600, originalPrice: null, duration: "10 dias", order: 2 },
  { id: "cusco-machupicchu", name: "Cusco + Machu Picchu", subtitle: "Peru", image: "/images/cusco.png", description: "La ciudadela inca entre las nubes. Recorre el Camino Inca, explora Cusco imperial y conecta con la historia viva.", tag: "Historia & Trekking", tagColor: "bg-emerald-500/20 text-emerald-300", icon: "Binoculars", category: "internacional", price: 1200000, originalPrice: null, duration: "7 dias", order: 3 },
  { id: "terapias-ancestrales", name: "Terapias Ancestrales", subtitle: "Experiencias Andinas, Peru", image: "/images/terapias_ancestrales.png", description: "Terapia sonora ancestral con vibraciones curativas de los Andes, sanacion con arcilla para transformacion ancestral y conexion con la tierra, terapia con alpacas para equilibrio emocional.", tag: "Bienestar & Ancestral", tagColor: "bg-orange-500/20 text-orange-300", icon: "Heart", category: "experiencial", price: 350000, originalPrice: null, duration: "3 dias", order: 4 },
  { id: "ballenas-elqui", name: "Ballenas + Valle del Elqui", subtitle: "Chile", image: "/images/ballenas.png", description: "Avistamiento de ballenas en Caleta Chanaral de Aceituno y noches magicas bajo los cielos mas limpios del mundo.", tag: "Naturaleza & Astro", tagColor: "bg-cyan-500/20 text-cyan-300", icon: "Waves", category: "chile", price: 450000, originalPrice: null, duration: "3 dias", order: 5 },
  { id: "santiago-vinedos", name: "Santiago + Vinedos", subtitle: "Chile", image: "/images/vinedos.png", description: "La vibracion de Santiago entre montanas y los mejores vinos de Chile. City tours, enoturismo y gastronomia de altura.", tag: "City & Vino", tagColor: "bg-rose-500/20 text-rose-300", icon: "Palmtree", category: "chile", price: 280000, originalPrice: null, duration: "2 dias", order: 6 },
  { id: "bolivia-amazonica", name: "Bolivia Amazonica", subtitle: "Pampas del Yacuma + Selva", image: "/images/bolivia.png", description: "Desde las Pampas del Yacuma hasta la selva amazonica. Caimanes, capibaras y la inmensidad verde del continente.", tag: "Selva & Wildlife", tagColor: "bg-green-500/20 text-green-300", icon: "TreePine", category: "internacional", price: 980000, originalPrice: null, duration: "6 dias", order: 7 },
  { id: "region-atacama", name: "Region de Atacama", subtitle: "Chile", image: "/images/atacama-new.png", description: "Valle de la Luna, Lagunas Altiplanicas, Geisers del Tatio y estrellas infinitas en el desierto mas antiguo del planeta.", tag: "Desierto & Estrellas", tagColor: "bg-yellow-500/20 text-yellow-300", icon: "Star", category: "chile", price: 520000, originalPrice: null, duration: "4 dias", order: 8 },
  { id: "valle-aconcagua", name: "Valle del Aconcagua", subtitle: "Chile", image: "/images/aconcagua.png", description: "Vinedos boutique al pie del techo de America. Montanismo, enoturismo y paisajes que inspiran.", tag: "Montana & Vino", tagColor: "bg-sky-500/20 text-sky-300", icon: "Mountain", category: "chile", price: 320000, originalPrice: null, duration: "2 dias", order: 9 },
  { id: "catedrales-marmol", name: "Catedrales de Marmol + Carretera Austral", subtitle: "Patagonia, Chile", image: "/images/marmol.png", description: "Cuevas de marmol esculpidas por el agua turquesa y la ruta mas salvaje de Patagonia. Aventura pura en el fin del mundo.", tag: "Patagonia Extrema", tagColor: "bg-teal-500/20 text-teal-300", icon: "Waves", category: "chile", price: 1500000, originalPrice: null, duration: "8 dias", order: 10 },
  { id: "rio-janeiro", name: "Rio de Janeiro", subtitle: "Brasil", image: "/images/rio_janeiro.png", description: "La ciudad maravillosa. Cristo Redentor, Copacabana, Ipanema y la energia carioca que lo contagia todo. Samba, playas y una cultura vibrante.", tag: "City & Playa", tagColor: "bg-yellow-500/20 text-yellow-300", icon: "Palmtree", category: "internacional", price: 698000, originalPrice: null, duration: "5 dias", order: 11 },
  { id: "florianopolis", name: "Florianopolis", subtitle: "Brasil", image: "/images/florianopolis.png", description: "La isla de la magia. 42 playas paradisiacas, dunas, selva atlantica y una gastronomia que enamora. El destino brasileno perfecto.", tag: "Playa & Naturaleza", tagColor: "bg-cyan-500/20 text-cyan-300", icon: "Waves", category: "internacional", price: 593000, originalPrice: 698000, duration: "5 dias", order: 12 },
  { id: "buenos-aires", name: "Buenos Aires", subtitle: "Argentina", image: "/images/buenos_aires.png", description: "La paris de Sudamerica. Tango en La Boca, arquitectura europea, bodegones y una noche portena que no tiene fin.", tag: "Cultura & Gastronomia", tagColor: "bg-rose-500/20 text-rose-300", icon: "Compass", category: "internacional", price: 450000, originalPrice: null, duration: "4 dias", order: 13 },
  { id: "mendoza", name: "Mendoza", subtitle: "Argentina", image: "/images/mendoza.png", description: "Vinos de altura al pie de los Andes. Bodegas boutique, Aconcagua imponente y la ruta del malbec mas famosa del continente. 15% OFF en abril.", tag: "Vino & Montana", tagColor: "bg-purple-500/20 text-purple-300", icon: "Mountain", category: "internacional", price: 586700, originalPrice: 690300, duration: "5 dias", order: 14 },
];

const promotions = [
  { title: "Destino del Mes ABRIL", subtitle: "Mendoza, Argentina", discount: "15% OFF", destination: "Mendoza", validUntil: new Date("2026-04-30"), originalPrice: 690300, discountPrice: 586700, emoji: "🍷", image: "/images/mendoza.png", order: 1 },
  { title: "Travel SALE", subtitle: "Florianopolis, Brasil", discount: "15% OFF", destination: "Florianopolis", validUntil: new Date("2026-05-31"), originalPrice: 698000, discountPrice: 593000, emoji: "🌴", image: "/images/florianopolis.png", order: 2 },
  { title: "Tapati 2027", subtitle: "Rapa Nui", discount: "15% OFF", destination: "Rapa Nui", validUntil: new Date("2027-02-28"), originalPrice: 1126000, discountPrice: 957100, emoji: "🗿", image: "/images/rapanui.png", order: 3 },
  { title: "Viaje Grupal Agosto", subtitle: "Atacama + Uyuni", discount: "10 dias", destination: "Atacama", validUntil: new Date("2026-08-03"), originalPrice: 1658600, discountPrice: 1658600, emoji: "🏜️", image: "/images/uyuni.png", order: 4 },
  { title: "Temporada Ballenas", subtitle: "Ballenas + Elqui", discount: "25% OFF", destination: "Ballenas", validUntil: new Date("2026-09-30"), originalPrice: 450000, discountPrice: 337500, emoji: "🐋", image: "/images/ballenas.png", order: 5 },
  { title: "Patagonia Extrema", subtitle: "Catedrales + Carretera", discount: "20% OFF", destination: "Patagonia", validUntil: new Date("2026-12-31"), originalPrice: 1500000, discountPrice: 1200000, emoji: "🏔️", image: "/images/marmol.png", order: 6 },
];

async function main() {
  console.log("Seeding destinations...");
  for (const dest of destinations) {
    await prisma.destination.upsert({
      where: { id: dest.id },
      update: dest,
      create: dest,
    });
  }
  console.log(`  ✓ ${destinations.length} destinations`);

  console.log("Seeding promotions...");
  for (const promo of promotions) {
    await prisma.promotion.upsert({
      where: { id: promo.order },
      update: promo,
      create: { id: promo.order, ...promo },
    });
  }
  console.log(`  ✓ ${promotions.length} promotions`);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
