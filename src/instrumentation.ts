export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionEnv } = await import("@/lib/env");
    assertProductionEnv();
    try {
      const { db } = await import("@/lib/db");
      await db.$connect();
    } catch (e) {
      console.error("[instrumentation] Prisma $connect falló:", e);
    }
  }
}
