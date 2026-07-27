import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";
import { listFeatureFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    let tenantOk = false;
    try {
      const t = await db.tenant.findUnique({ where: { id: DEFAULT_TENANT_ID } });
      tenantOk = Boolean(t);
    } catch {
      tenantOk = false;
    }

    return NextResponse.json({
      status: "ok",
      db: "connected",
      tenant: tenantOk ? DEFAULT_TENANT_ID : "missing",
      featureFlags: listFeatureFlags(),
      uptimeMs: Math.round(process.uptime() * 1000),
      latencyMs: Date.now() - started,
      version: process.env.npm_package_version ?? "0.2.0",
      platform: "universo-nomada",
      node: process.version,
    });
  } catch (error) {
    console.error("[health] DB check failed:", error);
    return NextResponse.json(
      {
        status: "degraded",
        db: "disconnected",
        latencyMs: Date.now() - started,
      },
      { status: 503 },
    );
  }
}
