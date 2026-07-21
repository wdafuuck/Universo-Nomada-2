import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      uptimeMs: Math.round(process.uptime() * 1000),
      latencyMs: Date.now() - started,
      version: process.env.npm_package_version ?? "0.2.0",
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
