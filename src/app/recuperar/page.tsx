/**
 * Página de recuperación: limpia SW/caché y vuelve al home.
 * Abrir https://universonomada.cl/recuperar si la web no carga.
 */
"use client";

import { useEffect, useState } from "react";

export default function RecuperarPage() {
  const [status, setStatus] = useState("Limpiando caché del navegador…");

  useEffect(() => {
    (async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        try {
          localStorage.removeItem("un_popup_day");
          localStorage.removeItem("un_popup_day_v2");
          sessionStorage.clear();
        } catch {
          // ignore
        }
        setStatus("Listo. Redirigiendo…");
      } catch {
        setStatus("Listo. Redirigiendo…");
      }
      // Cache-bust duro por si el HTML viejo apunta a CSS/JS borrados tras deploy
      window.setTimeout(() => {
        window.location.replace(`/?ok=1&t=${Date.now()}`);
      }, 600);
    })();
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        background: "#0D1B2A",
        color: "#fff",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <p style={{ fontSize: 18, fontWeight: 700 }}>{status}</p>
        <p style={{ opacity: 0.7, marginTop: 8, fontSize: 14 }}>
          Universo Nómada — recuperación de caché
        </p>
        <p style={{ opacity: 0.5, marginTop: 16, fontSize: 13 }}>
          Si sigue en blanco: Ctrl+Shift+R (o Cmd+Shift+R en Mac)
        </p>
      </div>
    </main>
  );
}
