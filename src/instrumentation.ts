export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionEnv } = await import("@/lib/env");
    assertProductionEnv();
    try {
      const { initObservability } = await import("@/lib/observability");
      await initObservability();
    } catch (e) {
      console.error("[instrumentation] observability init falló:", e);
    }
    try {
      const { db } = await import("@/lib/db");
      await db.$connect();
      const { ensureDefaultTenant } = await import("@/lib/tenant");
      await ensureDefaultTenant();
    } catch (e) {
      console.error("[instrumentation] Prisma $connect falló:", e);
    }
  }
}
