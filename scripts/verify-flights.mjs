import "dotenv/config";

const token = process.env.TRAVELPAYOUTS_TOKEN?.trim();
if (!token || token.length < 8) {
  console.log("FAIL: TRAVELPAYOUTS_TOKEN missing or empty in .env");
  process.exit(1);
}

console.log("TRAVELPAYOUTS configured: true (length", token.length + ")");

const calendarUrl =
  "https://api.travelpayouts.com/v1/prices/calendar?origin=SCL&destination=IPC&depart_date=2026-07&calendar_type=departure_date&length=4&currency=clp&market=cl&limit=31";

const res = await fetch(calendarUrl, {
  headers: { "x-access-token": token },
});

console.log("Calendar API status:", res.status);
if (!res.ok) {
  const text = await res.text();
  console.log("FAIL: API returned", res.status, text.slice(0, 120));
  process.exit(1);
}

const json = await res.json();
if (!json.success || !json.data) {
  console.log("FAIL: API success=false or no data");
  process.exit(1);
}

const dates = Object.entries(json.data);
const adults = 2;
const maxBudget = 350000;
const allowed = dates.filter(([, row]) => row.price > 0 && row.price <= maxBudget);

console.log("Total dates in July:", dates.length);
console.log("Allowed (per person ≤ $350.000):", allowed.length);

if (dates.length > 0) {
  const cheapest = dates.reduce((best, [date, row]) =>
    row.price < best.price ? { date, price: row.price, airline: row.airline } : best,
  { date: dates[0][0], price: dates[0][1].price, airline: dates[0][1].airline });
  console.log(
    "Cheapest found:",
    cheapest.date,
    "| ~$" + cheapest.price.toLocaleString("es-CL"),
    "per person (tope $350.000)",
  );
}

if (allowed.length > 0) {
  const [date, row] = allowed[0];
  console.log("Sample:", date, "|", row.airline, "| total ~$" + (row.price * adults).toLocaleString("es-CL"));
}

if (allowed.length > 0 && allowed.length < dates.length) {
  console.log("OK: Filtering works — not all dates pass budget");
} else if (allowed.length === dates.length && dates.length > 0) {
  console.log("WARN: All dates pass budget (tope may be high for this route)");
} else if (allowed.length === 0) {
  console.log("WARN: No dates under budget — check flightBudgetMax or route");
}

console.log("OK: Travelpayouts token is valid and API responds");
