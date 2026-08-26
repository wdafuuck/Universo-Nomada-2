import { describe, expect, it, vi } from "vitest";
import {
  allowedCardProviders,
  cartTaxHint,
  resolveCardPaymentProvider,
} from "@/lib/payments/types";
import { canAccessTab, isFullAdmin, isStaffRole, tabsForRole } from "@/lib/admin-rbac";
import { DEFAULT_TENANT_ID, getRequestTenantId, parseTenantConfig } from "@/lib/tenant";
import { isFeatureEnabled, listFeatureFlags } from "@/lib/feature-flags";
import { canAcceptBooking } from "@/lib/overbooking";
import { normalizeDepartureAvailability } from "@/lib/group-departure-availability";
import { listChannelProviders, syncChannelInventory } from "@/lib/channel-manager";

describe("payments tax routing", () => {
  it("cartTaxHint detecta afecto / exento / mixto", () => {
    expect(cartTaxHint([{ title: "a", quantity: 1, unit_price: 1, taxType: "afecto" }])).toBe("afecto");
    expect(cartTaxHint([{ title: "a", quantity: 1, unit_price: 1, taxType: "exento" }])).toBe("exento");
    expect(
      cartTaxHint([
        { title: "a", quantity: 1, unit_price: 1, taxType: "afecto" },
        { title: "b", quantity: 1, unit_price: 1, taxType: "exento" },
      ]),
    ).toBe("mixto");
  });

  it("internacional solo SumUp si está configurado", () => {
    vi.stubEnv("SUMUP_API_KEY", "k");
    vi.stubEnv("SUMUP_MERCHANT_CODE", "m");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "mp");
    expect(allowedCardProviders([{ title: "x", quantity: 1, unit_price: 1, taxType: "exento" }])).toEqual([
      "sumup",
    ]);
    expect(resolveCardPaymentProvider([{ title: "x", quantity: 1, unit_price: 1, taxType: "exento" }])).toBe(
      "sumup",
    );
    vi.unstubAllEnvs();
  });

  it("nacional permite ambas pasarelas configuradas", () => {
    vi.stubEnv("SUMUP_API_KEY", "k");
    vi.stubEnv("SUMUP_MERCHANT_CODE", "m");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "mp");
    expect(allowedCardProviders([{ title: "x", quantity: 1, unit_price: 1, taxType: "afecto" }])).toEqual([
      "sumup",
      "mercadopago",
    ]);
    vi.unstubAllEnvs();
  });
});

describe("admin rbac", () => {
  it("reconoce staff roles", () => {
    expect(isStaffRole("admin")).toBe(true);
    expect(isStaffRole("ops")).toBe(true);
    expect(isStaffRole("user")).toBe(false);
    expect(isFullAdmin("admin")).toBe(true);
    expect(isFullAdmin("ops")).toBe(false);
  });

  it("filtra tabs por rol", () => {
    expect(tabsForRole("ops")).toContain("leads");
    expect(tabsForRole("ops")).not.toContain("plataforma");
    expect(tabsForRole("ops")).not.toContain("noticias");
    expect(canAccessTab("admin", "noticias")).toBe(true);
    expect(canAccessTab("marketing", "blog")).toBe(true);
    expect(canAccessTab("marketing", "noticias")).toBe(false);
    expect(canAccessTab("finance", "blog")).toBe(false);
  });
});

describe("tenant", () => {
  it("default tenant id", () => {
    expect(getRequestTenantId()).toBe(DEFAULT_TENANT_ID);
    expect(parseTenantConfig('{"emailFrom":"a@b.c"}').emailFrom).toBe("a@b.c");
    expect(parseTenantConfig("no-json")).toEqual({});
  });
});

describe("feature flags", () => {
  it("defaults and env override", () => {
    expect(isFeatureEnabled("paymentReconciliation")).toBe(true);
    expect(listFeatureFlags().roulette).toBe(true);
    vi.stubEnv("FEATURE_ROULETTE", "false");
    expect(isFeatureEnabled("roulette")).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe("overbooking / cupos", () => {
  it("bloquea sold_out", () => {
    const r = canAcceptBooking("sold_out", 0);
    expect(r.ok).toBe(false);
    expect(r.availability).toBe("sold_out");
  });

  it("normaliza por spotsLeft", () => {
    expect(normalizeDepartureAvailability(undefined, 1)).toBe("last_spots");
    expect(canAcceptBooking("available", 1).availability).toBe("last_spots");
    expect(canAcceptBooking("available", 5).ok).toBe(true);
  });
});

describe("channel manager stub", () => {
  it("lista providers y sync no-op", async () => {
    expect(listChannelProviders()).toContain("gds_stub");
    const r = await syncChannelInventory("gds_stub");
    expect(r.ok).toBe(true);
    expect(r.items).toEqual([]);
  });
});
