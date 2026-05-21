"use client";

import { useEffect } from "react";

// Last-resort error boundary: kicks in when the root layout itself fails.
// Must render its own <html>/<body> because the layout is gone.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "-apple-system, system-ui, sans-serif", background: "#0D1B2A", color: "#fff" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.75rem" }}>Universo Nómada</h1>
            <p style={{ opacity: 0.7, margin: "0 0 1.5rem" }}>
              Estamos teniendo un problema técnico. Por favor intenta de nuevo en unos minutos.
            </p>
            {error.digest && (
              <p style={{ fontSize: "0.75rem", opacity: 0.4, fontFamily: "monospace", margin: "0 0 1rem" }}>
                Ref: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                background: "#2dd4bf",
                color: "#0D1B2A",
                fontWeight: 700,
                border: 0,
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
