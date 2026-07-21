/**
 * Buscar hoteles LiteAPI y probar disponibilidad
 *
 * Buscar por ciudad:
 *   node --env-file=.env scripts/test-liteapi.mjs --search "San Pedro de Atacama" CL
 *   node --env-file=.env scripts/test-liteapi.mjs --search "San Pedro de Atacama" CL --all
 *
 * Guardar lista en archivo:
 *   node --env-file=.env scripts/test-liteapi.mjs --search "San Pedro de Atacama" CL --all > hoteles-atacama.txt
 *
 * Buscar por ciudad + nombre:
 *   node --env-file=.env scripts/test-liteapi.mjs --search "San Pedro de Atacama" CL --name Kimal
 *
 * Probar disponibilidad de un ID:
 *   node --env-file=.env scripts/test-liteapi.mjs lp66f9e
 */
const apiKey = process.env.LITEAPI_API_KEY?.trim();
const base = (process.env.LITEAPI_API_BASE ?? "https://api.liteapi.travel/v3.0").replace(/\/$/, "");

const args = process.argv.slice(2);
const searchMode = args[0] === "--search";
const listAll = args.includes("--all");
const nameFlag = args.indexOf("--name");
const hotelNameFilter = nameFlag >= 0 ? args[nameFlag + 1] : null;
const hotelId = searchMode ? null : (args[0] ?? "lp3803c");
const cityName = searchMode ? args[1] ?? "Santiago" : null;
const countryCode = searchMode ? args[2] ?? "CL" : null;

if (!apiKey) {
  console.log("❌ Falta LITEAPI_API_KEY en .env\n");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-API-Key": apiKey,
};

const checkIn = new Date();
checkIn.setDate(checkIn.getDate() + 30);
const checkOut = new Date(checkIn);
checkOut.setDate(checkOut.getDate() + 4);
const fmt = (d) => d.toISOString().slice(0, 10);

async function searchHotels() {
  const params = new URLSearchParams({
    countryCode,
    cityName,
    limit: listAll ? "500" : "20",
  });
  if (hotelNameFilter) params.set("hotelName", hotelNameFilter);

  const res = await fetch(`${base}/data/hotels?${params}`, { headers });
  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("❌ Búsqueda falló:", data.error ?? res.status);
    process.exit(1);
  }

  const hotels = data.data ?? [];
  console.log(`✅ ${hotels.length} hoteles en ${cityName}, ${countryCode}`);
  if (hotelNameFilter) console.log(`   filtro nombre: "${hotelNameFilter}"`);
  console.log("");

  if (hotels.length === 0) {
    console.log("Sin resultados. Prueba otra ciudad o quita --name.");
    return;
  }

  for (const h of hotels) {
    console.log(`  ${h.id} — ${h.name}`);
  }
  console.log("\nCopia el ID (lp...) en Admin → LiteAPI.");
}

async function checkRates() {
  const res = await fetch(`${base}/hotels/rates`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      hotelIds: [hotelId],
      checkin: fmt(checkIn),
      checkout: fmt(checkOut),
      currency: "USD",
      guestNationality: "CL",
      occupancies: [{ adults: 2, children: [] }],
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("❌ Disponibilidad falló:", data.error ?? res.status);
    process.exit(1);
  }

  const hotels = data.data ?? [];
  const withRates = hotels.filter((h) => (h.roomTypes?.length ?? 0) > 0);
  console.log(
    `✅ Hotel ${hotelId}: ${withRates.length ? "DISPONIBLE" : "sin cupo"} (${fmt(checkIn)} → ${fmt(checkOut)})`,
  );
  if (withRates[0]?.roomTypes?.[0]?.rates?.[0]?.retailRate?.total?.[0]) {
    const total = withRates[0].roomTypes[0].rates[0].retailRate.total[0];
    console.log(`   Desde ${total.amount} ${total.currency}`);
  }
}

async function main() {
  if (searchMode) await searchHotels();
  else await checkRates();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
