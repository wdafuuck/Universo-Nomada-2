import { NextRequest, NextResponse } from "next/server";
import { requireFullAdmin } from "@/lib/auth-session";
import { ensureDefaultTenant, getRequestTenant, parseTenantConfig } from "@/lib/tenant";
import { listFeatureFlags } from "@/lib/feature-flags";
import { listChannelProviders, syncChannelInventory } from "@/lib/channel-manager";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await requireFullAdmin(request))) {
    return NextResponse.json({ error: "Solo admin completo" }, { status: 401 });
  }

  await ensureDefaultTenant();
  const tenant = await getRequestTenant(request);
  const flags = listFeatureFlags(tenant.configJson);

  return NextResponse.json({
    tenant,
    config: parseTenantConfig(tenant.configJson),
    featureFlags: flags,
    channelProviders: listChannelProviders(),
    platformVersion: process.env.npm_package_version ?? "0.2.0",
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await requireFullAdmin(request))) {
    return NextResponse.json({ error: "Solo admin completo" }, { status: 401 });
  }

  await ensureDefaultTenant();
  const tenant = await getRequestTenant(request);
  const body = await request.json();
  const current = parseTenantConfig(tenant.configJson);
  const next = {
    ...current,
    ...(body.config && typeof body.config === "object" ? body.config : {}),
    featureFlags: {
      ...(current.featureFlags ?? {}),
      ...(body.featureFlags && typeof body.featureFlags === "object" ? body.featureFlags : {}),
    },
  };

  const updated = await db.tenant.update({
    where: { id: tenant.id },
    data: {
      name: body.name ? String(body.name).trim() : undefined,
      configJson: JSON.stringify(next),
    },
  });

  return NextResponse.json({ tenant: updated, config: next });
}

export async function POST(request: NextRequest) {
  if (!(await requireFullAdmin(request))) {
    return NextResponse.json({ error: "Solo admin completo" }, { status: 401 });
  }
  const body = await request.json();
  if (body.action === "sync_channel") {
    const result = await syncChannelInventory(body.provider ?? "manual");
    return NextResponse.json(result);
  }
  return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
}
