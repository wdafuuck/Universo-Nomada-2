"use client";

import { useEffect } from "react";

const MIGRATION_KEY = "un-sw-cleared-v4";

/**
 * Tras Netlify, el SW viejo sirve la web antigua desde caché.
 * Por ahora solo limpiamos SW/caches y NO registramos uno nuevo
 * (evita crashes al girar la ruleta / formularios).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        if (!localStorage.getItem(MIGRATION_KEY)) {
          localStorage.setItem(MIGRATION_KEY, "1");
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  return null;
}
