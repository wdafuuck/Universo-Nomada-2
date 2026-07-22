"use client";

import { useEffect } from "react";

const MIGRATION_KEY = "un-sw-cleared-v5";
const RELOAD_KEY = "un-sw-reload-v5";

/**
 * Desregistra cualquier Service Worker y limpia caches.
 * Si había uno activo (p. ej. Netlify viejo), recarga una sola vez.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        const hadWorker = regs.length > 0;
        await Promise.all(regs.map((r) => r.unregister()));

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }

        const alreadyCleared = localStorage.getItem(MIGRATION_KEY) === "1";
        localStorage.setItem(MIGRATION_KEY, "1");

        if ((hadWorker || !alreadyCleared) && !sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  return null;
}
