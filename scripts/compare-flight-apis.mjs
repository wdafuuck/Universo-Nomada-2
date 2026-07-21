import "dotenv/config";

console.log("Compare APIs — month-matrix is ONE-WAY only, not for round-trip packages.\n");

const token = process.env.TRAVELPAYOUTS_TOKEN?.trim();
if (!token) {
  console.log("No token");
  process.exit(1);
}

const max = 420000;
const origin = "SCL";
const destination = "IPC";
const month = "2026-08";
const monthStart = `${month}-01`;
const nights = 4;

async function tp(path, params) {
  const url = new URL(`https://api.travelpayouts.com${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { "x-access-token": token } });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { status: res.status, error: text.slice(0, 100) };
  }
  return { status: res.status, json };
}

function summarize(label, rows, dateKey = "depart_date", priceKey = "value") {
  const inMonth = rows.filter((r) => {
    const d = r[dateKey] || r.departure_at?.slice(0, 10);
    return d?.startsWith(month);
  });
  const allowed = inMonth.filter((r) => {
    const p = r[priceKey] ?? r.price;
    return p > 0 && p <= max;
  });
  const dates = [...new Set(allowed.map((r) => r[dateKey] || r.departure_at?.slice(0, 10)))].sort();
  console.log(`\n${label}`);
  console.log(`  rows: ${rows.length} | in ${month}: ${inMonth.length} | allowed≤${max}: ${allowed.length}`);
  console.log(`  dates: ${dates.join(", ") || "(none)"}`);
}

const retDate = "2026-08-22"; // ~4 nights from mid-aug

const tests = [
  ["v3 prices_for_dates", "/aviasales/v3/prices_for_dates", {
    origin, destination, departure_at: month, return_at: month,
    currency: "clp", market: "cl", limit: 100, sorting: "price", one_way: "false",
  }],
  ["v2 month-matrix", "/v2/prices/month-matrix", {
    origin, destination, month: monthStart, currency: "clp", show_to_affiliates: "true",
  }],
  ["v2 month-matrix (all)", "/v2/prices/month-matrix", {
    origin, destination, month: monthStart, currency: "clp", show_to_affiliates: "false",
  }],
  ["v2 week-matrix", "/v2/prices/week-matrix", {
    origin, destination, depart_date: "2026-08-15", return_date: retDate,
    currency: "clp", show_to_affiliates: "true",
  }],
  ["v1 calendar length=4", "/v1/prices/calendar", {
    origin, destination, depart_date: month, calendar_type: "departure_date",
    length: nights, currency: "clp", market: "cl", limit: 31,
  }],
  ["v3 grouped_prices", "/aviasales/v3/grouped_prices", {
    origin, destination, departure_at: month, group_by: "departure_at",
    currency: "clp", market: "cl", limit: 100,
  }],
];

for (const [label, path, params] of tests) {
  const { status, json, error } = await tp(path, params);
  if (error) {
    console.log(`\n${label}: HTTP ${status} ${error}`);
    continue;
  }
  if (!json?.success) {
    console.log(`\n${label}: success=false`, JSON.stringify(json).slice(0, 200));
    continue;
  }
  if (Array.isArray(json.data)) {
    summarize(label, json.data);
    if (label.includes("month-matrix") && json.data[0]) {
      console.log("  sample:", JSON.stringify(json.data[0]));
    }
  } else if (json.data && typeof json.data === "object") {
    const rows = Object.entries(json.data).map(([date, row]) => ({ depart_date: date, ...row, value: row.price }));
    summarize(label, rows);
  } else {
    console.log(`\n${label}: unexpected shape`);
  }
}
