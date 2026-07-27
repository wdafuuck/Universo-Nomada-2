import { parseTenantConfig, type TenantConfig } from "@/lib/tenant";

export type FeatureFlagName =
  | "abandonedCartEmails"
  | "roulette"
  | "ga4Realtime"
  | "seoAssistant"
  | "multiCurrency"
  | "channelManagerStub"
  | "paymentReconciliation";

const ENV_FLAGS: Partial<Record<FeatureFlagName, string>> = {
  abandonedCartEmails: "FEATURE_ABANDONED_CART",
  roulette: "FEATURE_ROULETTE",
  ga4Realtime: "FEATURE_GA4_REALTIME",
  seoAssistant: "FEATURE_SEO_ASSISTANT",
  multiCurrency: "FEATURE_MULTI_CURRENCY",
  channelManagerStub: "FEATURE_CHANNEL_MANAGER_STUB",
  paymentReconciliation: "FEATURE_PAYMENT_RECONCILIATION",
};

const DEFAULTS: Record<FeatureFlagName, boolean> = {
  abandonedCartEmails: true,
  roulette: true,
  ga4Realtime: true,
  seoAssistant: true,
  multiCurrency: false,
  channelManagerStub: true,
  paymentReconciliation: true,
};

function envFlag(name: FeatureFlagName): boolean | undefined {
  const key = ENV_FLAGS[name];
  if (!key) return undefined;
  const raw = process.env[key]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return undefined;
  if (raw === "0" || raw === "false" || raw === "off") return false;
  if (raw === "1" || raw === "true" || raw === "on") return true;
  return undefined;
}

export function isFeatureEnabled(
  name: FeatureFlagName,
  tenantConfigJson?: string | null,
): boolean {
  const fromEnv = envFlag(name);
  if (fromEnv !== undefined) return fromEnv;

  const cfg: TenantConfig = parseTenantConfig(tenantConfigJson);
  if (cfg.featureFlags && typeof cfg.featureFlags[name] === "boolean") {
    return cfg.featureFlags[name]!;
  }

  return DEFAULTS[name];
}

export function listFeatureFlags(tenantConfigJson?: string | null): Record<FeatureFlagName, boolean> {
  const names = Object.keys(DEFAULTS) as FeatureFlagName[];
  return Object.fromEntries(names.map((n) => [n, isFeatureEnabled(n, tenantConfigJson)])) as Record<
    FeatureFlagName,
    boolean
  >;
}
