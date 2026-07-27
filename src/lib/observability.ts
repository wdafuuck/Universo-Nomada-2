/**
 * Observabilidad opcional. Sin SENTRY_DSN = no-op (solo console).
 */

let sentryReady: Promise<boolean> | null = null;

async function ensureSentry(): Promise<boolean> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return false;
  if (!sentryReady) {
    sentryReady = (async () => {
      try {
        const Sentry = await import("@sentry/node");
        Sentry.init({
          dsn,
          environment: process.env.NODE_ENV ?? "development",
          tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.05"),
        });
        return true;
      } catch (e) {
        console.error("[observability] Sentry init failed:", e);
        return false;
      }
    })();
  }
  return sentryReady;
}

export async function initObservability(): Promise<void> {
  await ensureSentry();
}

export async function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  console.error("[captureException]", error, context ?? "");
  if (!(await ensureSentry())) return;
  try {
    const Sentry = await import("@sentry/node");
    Sentry.withScope((scope) => {
      if (context) {
        for (const [k, v] of Object.entries(context)) {
          scope.setExtra(k, v);
        }
      }
      Sentry.captureException(error);
    });
  } catch {
    /* ignore */
  }
}

export async function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
): Promise<void> {
  if (!(await ensureSentry())) return;
  try {
    const Sentry = await import("@sentry/node");
    Sentry.captureMessage(message, level);
  } catch {
    /* ignore */
  }
}
