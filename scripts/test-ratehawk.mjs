/**
 * Prueba la API B2B de RateHawk (ETG) y verifica un hotel por hid.
 *
 * Uso:
 *   node --env-file=.env scripts/test-ratehawk.mjs 10004873
 *   node --env-file=.env scripts/test-ratehawk.mjs 10004873 150
 *     ↑ segundo argumento = tope USD para simular recargo
 *
 * Requiere en .env:
 *   RATEHAWK_KEY_ID
 *   RATEHAWK_API_KEY
 *   RATEHAWK_API_BASE (opcional, sandbox por defecto)
 *   RATEHAWK_RESIDENCY (opcional, default cl)
 *   RATEHAWK_USD_CLP (opcional, default 1000)
 */
const hid = Number(process.argv[2]) || 10004873;
const maxPriceUsd = process.argv[3] ? Number(process.argv[3]) : null;

const keyId = process.env.RATEHAWK_KEY_ID?.trim();
const apiKey = process.env.RATEHAWK_API_KEY?.trim();
const base = (process.env.RATEHAWK_API_BASE ?? "https://api-sandbox.worldota.net/api/b2b/v3").replace(/\/$/, "");
const residency = process.env.RATEHAWK_RESIDENCY?.trim() || "cl";
const usdClp = Number(process.env.RATEHAWK_USD_CLP) || 1000;

const checkIn = new Date();
checkIn.setDate(checkIn.getDate() + 30);
const checkOut = new Date(checkIn);
checkOut.setDate(checkOut.getDate() + 4);
const fmt = (d) => d.toISOString().slice(0, 10);

if (!keyId || !apiKey) {
  console.log("❌ Faltan credenciales RateHawk en .env\n");
  console.log("Agrega estas líneas a tu archivo .env:\n");
  console.log('RATEHAWK_KEY_ID="1000"');
  console.log('RATEHAWK_API_KEY="tu-uuid-de-api-key"');
  console.log('RATEHAWK_API_BASE="https://api-sandbox.worldota.net/api/b2b/v3"');
  console.log('RATEHAWK_USD_CLP="1000"');
  console.log('RATEHAWK_RESIDENCY="cl"\n');
  console.log("Cómo obtenerlas:");
  console.log("  1. Contrato B2B con RateHawk / Emerging Travel Group (ETG)");
  console.log("  2. En el panel ETG te entregan Key ID + API Key (formato Basic auth)");
  console.log("  3. Sandbox: https://api-sandbox.worldota.net");
  console.log("  4. Producción: https://api.worldota.net/api/b2b/v3");
  console.log("  5. Reinicia el servidor (npm run dev) tras guardar .env\n");
  console.log(`Hotel de prueba (hid): ${hid}`);
  process.exit(1);
}

const auth = Buffer.from(`${keyId}:${apiKey}`).toString("base64");

console.log("\n🔍 RateHawk B2B API");
console.log(`   Base: ${base}`);
console.log(`   Key ID: ${keyId}`);
console.log(`   Residency: ${residency}`);
console.log(`   Hotel hid: ${hid}`);
console.log(`   Fechas: ${fmt(checkIn)} → ${fmt(checkOut)} (2 adultos, USD)\n`);

const res = await fetch(`${base}/search/serp/hotels/`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
  },
  body: JSON.stringify({
    checkin: fmt(checkIn),
    checkout: fmt(checkOut),
    residency,
    language: "es",
    currency: "USD",
    guests: [{ adults: 2, children: [] }],
    hids: [hid],
  }),
});

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  data = { raw: text.slice(0, 800) };
}

if (!res.ok) {
  console.error(`❌ HTTP ${res.status}`);
  console.error(JSON.stringify(data, null, 2));
  if (res.status === 401 || res.status === 403) {
    console.error("\n💡 Key ID o API Key incorrectos. Revisa el panel ETG / RateHawk.");
  }
  process.exit(1);
}

const hotels = data?.data?.hotels ?? [];
const hotel = hotels.find((h) => h.hid === hid) ?? hotels[0];

if (!hotel) {
  console.log("⚠️  Sin respuesta para ese hid (puede no existir en sandbox o sin cupo).");
  console.log(JSON.stringify(data, null, 2).slice(0, 1200));
  process.exit(1);
}

let minPrice;
for (const rate of hotel.rates ?? []) {
  for (const pt of rate.payment_options?.payment_types ?? []) {
    const n = Number(pt.show_amount);
    if (!Number.isFinite(n) || n <= 0) continue;
    minPrice = minPrice == null ? n : Math.min(minPrice, n);
  }
}

console.log(`✅ Hotel encontrado: ${hotel.id ?? hotel.hid}`);
console.log(`   Tarifas en respuesta: ${(hotel.rates ?? []).length}`);

if (minPrice == null) {
  console.log("⚠️  Hotel respondió pero sin precio usable (sin cupo o tarifas vacías).");
} else {
  console.log(`   Precio mínimo (USD, hab. doble 2 pax): $${minPrice.toFixed(2)}`);
  if (maxPriceUsd != null && Number.isFinite(maxPriceUsd)) {
    if (minPrice <= maxPriceUsd) {
      console.log(`   Tope $${maxPriceUsd} → ✅ dentro del tope (sin recargo)`);
    } else {
      const surcharge = Math.round(((minPrice - maxPriceUsd) * usdClp) / 2);
      console.log(`   Tope $${maxPriceUsd} → recargo $${surcharge.toLocaleString("es-CL")}/persona CLP`);
    }
  }
}

console.log("\nSi funciona, configura en Admin → Precios del paquete:");
console.log("  Proveedor: RateHawk");
console.log(`  ID RateHawk (hid): ${hid}`);
if (maxPriceUsd) console.log(`  Tope USD: ${maxPriceUsd}`);
console.log("");
