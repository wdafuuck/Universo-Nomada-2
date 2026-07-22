"use client";

import { useEffect } from "react";

/**
 * Tras migrar de Netlify, muchos navegadores conservan un Service Worker viejo
 * que sirve la web antigua desde caché. Limpiamos SW + caches y registramos el nuevo.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let cancelled = false;

    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        // Evitar re-registrar el SW viejo en el mismo load si aún controla la página
        if (cancelled) return;
        await navigator.serviceWorker.register("/sw.js?v=3");
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
