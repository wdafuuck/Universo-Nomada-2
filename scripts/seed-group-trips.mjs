#!/usr/bin/env node
/**
 * Siembra viajes grupales en la base de datos.
 * Uso: npm run db:seed-group-trips
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const db = new PrismaClient({
  datasources: { db: { url: `file:${path.join(root, "prisma", "dev.db")}` } },
});

const GROUP_TRIPS = [
  {
    tourId: "group-atacama",
    name: "San Pedro de Atacama",
    duration: "4D/3N",
    image: "/images/atacama-new.png",
    gradient: "from-orange-500 to-red-600",
    reservation: 100000,
    price: 784000,
    includes: ["Vuelo", "Seguro", "Transfer", "Hotel + desayuno", "5 tours", "Entradas", "Líder de grupo", "Acompañamiento durante todo el viaje"],
    departures: [
      { date: "Del 25 al 28 de junio", spotsLeft: 4, totalSpots: 12 },
      { date: "Del 16 al 19 de junio", spotsLeft: 7, totalSpots: 12 },
    ],
  },
  {
    tourId: "group-uyuni",
    name: "Uyuni",
    duration: "6D/5N",
    image: "/images/uyuni.png",
    gradient: "from-cyan-500 to-blue-600",
    reservation: 100000,
    price: 968700,
    includes: ["Vuelo + equipaje", "Seguro", "Transfer", "Hotel + desayuno + almuerzo + cena", "Tours", "Entradas", "Líder de grupo", "Acompañamiento durante todo el viaje"],
    departures: [{ date: "Del 14 al 19 de Septiembre", spotsLeft: 3, totalSpots: 10 }],
  },
  {
    tourId: "group-rapa-nui",
    name: "Rapa Nui",
    duration: "5D/4N",
    image: "/images/rapanui.png",
    gradient: "from-purple-500 to-indigo-600",
    reservation: 200000,
    price: 1205000,
    includes: ["Vuelo + equipaje", "Seguro", "Transfer + collar de Flores", "Hotel + desayuno", "Tours", "Entradas", "Líder de grupo", "Acompañamiento durante todo el viaje"],
    departures: [{ date: "Del 14 al 18 de agosto", spotsLeft: 5, totalSpots: 14 }],
  },
];

async function main() {
  const existing = await db.groupTrip.count();
  if (existing > 0) {
    console.log(`✅ Ya hay ${existing} viaje(s) grupal(es) en la base de datos.`);
    return;
  }

  for (const [i, trip] of GROUP_TRIPS.entries()) {
    await db.groupTrip.create({
      data: {
        tourId: trip.tourId,
        name: trip.name,
        duration: trip.duration,
        image: trip.image,
        gradient: trip.gradient,
        reservation: trip.reservation,
        price: trip.price,
        includesJson: JSON.stringify(trip.includes),
        sortOrder: i,
        departures: {
          create: trip.departures.map((d) => ({
            date: d.date,
            spotsLeft: d.spotsLeft,
            totalSpots: d.totalSpots,
          })),
        },
      },
    });
  }

  console.log(`✅ ${GROUP_TRIPS.length} viajes grupales sembrados correctamente.`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
