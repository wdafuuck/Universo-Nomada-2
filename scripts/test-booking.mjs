/**
 * Prueba Booking Demand API y verifica un ID de alojamiento.
 *
 * Uso:
 *   node --env-file=.env scripts/test-booking.mjs 1557298
 *   node --env-file=.env scripts/test-booking.mjs --details 1557298
 *
 * Requiere en .env:
 *   BOOKING_AFFILIATE_ID
 *   BOOKING_API_KEY
 *   BOOKING_API_BASE (opcional, default production 3.1)
 */
const args = process.argv.slice(2);
const detailsOnly = args[0] === "--details";
const hotelId = Number(detailsOnly ? args[1] : args[0]) || 1557298;

const base = (process.env.BOOKING_API_BASE ?? "https://demandapi.booking.com/3.1").replace(/\/$/, "");
const affiliateId = process.env.BOOKING_AFFILIATE_ID?.trim();
const apiKey = process.env.BOOKING_API_KEY?.trim();

const checkIn = new Date();
checkIn.setDate(checkIn.getDate() + 30);
const checkOut = new Date(checkIn);
checkOut.setDate(checkOut.getDate() + 5);

const fmt = (d) => d.toISOString().slice(0, 10);

function headers() {
  return {
    "Content-Type": "application/json",
    "X-Affiliate-Id": affiliateId,
    Authorization: `Bearer ${apiKey}`,
  };
}

if (!affiliateId || !apiKey) {
  console.log("❌ Faltan credenciales en .env\n");
  console.log("   BOOKING_AFFILIATE_ID=\"\"  ← tu affiliate ID (número)");
  console.log("   BOOKING_API_KEY=\"\"        ← token Bearer del Partner Centre\n");
  console.log("Cómo obtenerlas:");
  console.log("  1. Regístrate como afiliado: https://www.booking.com/affiliate-program/v2/index.html");
  console.log("  2. Entra al Affiliate Partner Centre y genera tu API key (Demand API v3)");
  console.log("  3. Copia el Affiliate ID y el token en .env");
  console.log("  4. Reinicia el servidor (npm run dev) y vuelve a ejecutar este script\n");
  console.log(`ID a probar cuando tengas credenciales: ${hotelId} (Cabañas Rangi Moana)`);
  process.exit(1);
}

async function bookingFetch(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  return { ok: res.ok, status: res.status, data };
}

console.log(`\n🔍 Booking Demand API`);
console.log(`   Base: ${base}`);
console.log(`   Affiliate ID: ${affiliateId}`);
console.log(`   Hotel ID: ${hotelId}\n`);

if (detailsOnly) {
  const { ok, status, data } = await bookingFetch("/accommodations/details", {
    accommodations: [hotelId],
    extras: ["description", "facilities", "photos", "policies", "rooms"],
    languages: ["es"],
  });

  if (!ok) {
    console.error(`❌ /accommodations/details → HTTP ${status}`);
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const prop = data?.data?.[0];
  if (!prop) {
    console.error("❌ ID no encontrado o sin acceso. Revisa el número en Partner Centre.");
    process.exit(1);
  }

  console.log("✅ Propiedad encontrada:");
  console.log(`   ID: ${prop.id}`);
  console.log(`   Nombre: ${prop.name ?? prop.accommodation_name ?? "(sin nombre)"}`);
  if (prop.location?.city) console.log(`   Ciudad: ${prop.location.city}`);
  if (prop.location?.address?.line_1) console.log(`   Dirección: ${prop.location.address.line_1}`);
  if (prop.url) console.log(`   URL: ${prop.url}`);
  process.exit(0);
}

const { ok, status, data } = await bookingFetch("/accommodations/availability", {
  accommodation: hotelId,
  booker: { country: "cl", platform: "desktop" },
  checkin: fmt(checkIn),
  checkout: fmt(checkOut),
  guests: {
    number_of_adults: 2,
    number_of_children: 0,
    number_of_rooms: 1,
  },
});

if (!ok) {
  console.error(`❌ /accommodations/availability → HTTP ${status}`);
  console.error(JSON.stringify(data, null, 2));
  if (status === 401) {
    console.error("\n💡 Token o Affiliate ID incorrectos. Regenera la API key en Partner Centre.");
  }
  if (status === 404) {
    console.error("\n💡 El ID no existe en Booking. Búscalo con /accommodations/search en el portal de desarrolladores.");
  }
  process.exit(1);
}

const products = data?.data?.products ?? data?.products ?? [];
const available = Array.isArray(products) && products.length > 0;
const priceFrom =
  data?.data?.recommendation?.price?.total?.amount ?? products[0]?.price?.total?.amount;

console.log(`📅 Fechas: ${fmt(checkIn)} → ${fmt(checkOut)} (2 adultos)`);
console.log(available ? "✅ DISPONIBLE" : "⚠️  SIN CUPO para esas fechas");
if (priceFrom) console.log(`   Precio referencial desde: ${priceFrom}`);
if (data?.data?.url ?? data?.url) console.log(`   Enlace: ${data?.data?.url ?? data?.url}`);
console.log("\nSi el ID y la disponibilidad son correctos, úsalo en Admin → ID Booking.com\n");
