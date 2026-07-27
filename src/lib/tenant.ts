/** Tenant por defecto = Universo Nómada (web pública sin cambios). */
export const DEFAULT_TENANT_ID = "universo-nomada";
export const DEFAULT_TENANT_SLUG = "universo-nomada";
export const DEFAULT_TENANT_NAME = "Universo Nómada";

export type TenantRecord = {
  id: string;
  name: string;
  slug: string;
  configJson: string;
  active: boolean;
};

export type TenantConfig = {
  paymentProvider?: string;
  emailFrom?: string;
  ga4PropertyId?: string;
  featureFlags?: Record<string, boolean>;
};

export function parseTenantConfig(json: string | null | undefined): TenantConfig {
  if (!json?.trim()) return {};
  try {
    return JSON.parse(json) as TenantConfig;
  } catch {
    return {};
  }
}

/**
 * En prod actual siempre el tenant default.
 * Preparado para resolver por host/header en multi-tenant futuro.
 */
export function getRequestTenantId(_request?: Request): string {
  const fromEnv = process.env.TENANT_ID?.trim();
  return fromEnv || DEFAULT_TENANT_ID;
}

export async function ensureDefaultTenant(): Promise<void> {
  const { db } = await import("@/lib/db");
  await db.tenant.upsert({
    where: { id: DEFAULT_TENANT_ID },
    create: {
      id: DEFAULT_TENANT_ID,
      name: DEFAULT_TENANT_NAME,
      slug: DEFAULT_TENANT_SLUG,
      configJson: "{}",
      active: true,
    },
    update: {},
  });
}

export async function getRequestTenant(request?: Request): Promise<TenantRecord> {
  const id = getRequestTenantId(request);
  const { db } = await import("@/lib/db");
  await ensureDefaultTenant();
  const row = await db.tenant.findUnique({ where: { id } });
  if (row) return row;
  return {
    id: DEFAULT_TENANT_ID,
    name: DEFAULT_TENANT_NAME,
    slug: DEFAULT_TENANT_SLUG,
    configJson: "{}",
    active: true,
  };
}

export function tenantWhere(request?: Request): { tenantId: string } {
  return { tenantId: getRequestTenantId(request) };
}
