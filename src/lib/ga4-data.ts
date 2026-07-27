/**
 * GA4 Data API (realtime + summary) vía REST + service account.
 * Sin credenciales: funciones retornan configured:false (el panel no se rompe).
 */

export type Ga4RealtimeResult = {
  configured: boolean;
  activeUsers: number | null;
  topPages: { path: string; users: number }[];
  error?: string;
  generatedAt: string;
};

export type Ga4SummaryResult = {
  configured: boolean;
  sessions: number | null;
  users: number | null;
  pageviews: number | null;
  error?: string;
  generatedAt: string;
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

function propertyId(): string | null {
  const raw = process.env.GA4_PROPERTY_ID?.trim();
  if (!raw) return null;
  return raw.replace(/^properties\//, "");
}

export function hasGa4Credentials(): boolean {
  if (process.env.GA4_SERVICE_ACCOUNT_JSON?.trim()) return true;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) return true;
  return false;
}

function loadServiceAccount(): ServiceAccount | null {
  const inline = process.env.GA4_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    try {
      const parsed = JSON.parse(inline) as ServiceAccount;
      if (parsed.client_email && parsed.private_key) return parsed;
    } catch {
      return null;
    }
  }

  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (path) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs") as typeof import("fs");
      const parsed = JSON.parse(fs.readFileSync(path, "utf8")) as ServiceAccount;
      if (parsed.client_email && parsed.private_key) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

function base64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const crypto = await import("crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: sa.token_uri || "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const key = sa.private_key.replace(/\\n/g, "\n");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsigned);
  sign.end();
  const signature = base64url(sign.sign(key));
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`OAuth GA4 falló (${res.status})`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Sin access_token GA4");
  return data.access_token;
}

export async function getGa4Realtime(): Promise<Ga4RealtimeResult> {
  const generatedAt = new Date().toISOString();
  const prop = propertyId();
  const sa = loadServiceAccount();
  if (!prop || !sa) {
    return {
      configured: false,
      activeUsers: null,
      topPages: [],
      error: !prop
        ? "Falta GA4_PROPERTY_ID"
        : "Falta GA4_SERVICE_ACCOUNT_JSON (service account con Viewer en GA4)",
      generatedAt,
    };
  }

  try {
    const token = await getAccessToken(sa);
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runRealtimeReport`;

    const [totalRes, pagesRes] = await Promise.all([
      fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metrics: [{ name: "activeUsers" }],
        }),
      }),
      fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metrics: [{ name: "activeUsers" }],
          dimensions: [{ name: "unifiedPagePathScreen" }],
          limit: 8,
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        }),
      }),
    ]);

    if (!totalRes.ok) {
      const errText = await totalRes.text().catch(() => "");
      throw new Error(`Realtime API ${totalRes.status}: ${errText.slice(0, 200)}`);
    }

    const totalData = (await totalRes.json()) as {
      rows?: { metricValues?: { value?: string }[] }[];
    };
    const activeUsers = Number(totalData.rows?.[0]?.metricValues?.[0]?.value || 0);

    const topPages: { path: string; users: number }[] = [];
    if (pagesRes.ok) {
      const pagesData = (await pagesRes.json()) as {
        rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
      };
      for (const row of pagesData.rows ?? []) {
        topPages.push({
          path: row.dimensionValues?.[0]?.value || "(not set)",
          users: Number(row.metricValues?.[0]?.value || 0),
        });
      }
    }

    return { configured: true, activeUsers, topPages, generatedAt };
  } catch (e) {
    return {
      configured: true,
      activeUsers: null,
      topPages: [],
      error: e instanceof Error ? e.message : "Error GA4 realtime",
      generatedAt,
    };
  }
}

export async function getGa4Summary(days = 28): Promise<Ga4SummaryResult> {
  const generatedAt = new Date().toISOString();
  const prop = propertyId();
  const sa = loadServiceAccount();
  if (!prop || !sa) {
    return {
      configured: false,
      sessions: null,
      users: null,
      pageviews: null,
      error: !prop ? "Falta GA4_PROPERTY_ID" : "Falta service account",
      generatedAt,
    };
  }

  try {
    const token = await getAccessToken(sa);
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`Report API ${res.status}`);
    }
    const data = (await res.json()) as {
      rows?: { metricValues?: { value?: string }[] }[];
    };
    const m = data.rows?.[0]?.metricValues ?? [];
    return {
      configured: true,
      sessions: Number(m[0]?.value || 0),
      users: Number(m[1]?.value || 0),
      pageviews: Number(m[2]?.value || 0),
      generatedAt,
    };
  } catch (e) {
    return {
      configured: true,
      sessions: null,
      users: null,
      pageviews: null,
      error: e instanceof Error ? e.message : "Error GA4 summary",
      generatedAt,
    };
  }
}
