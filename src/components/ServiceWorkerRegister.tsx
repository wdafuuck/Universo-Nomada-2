"use client";

import { useEffect } from "react";

const MIGRATION_KEY = "un-sw-cleared-v6";

/** Solo limpia SW/caches. Sin reload automático (provocaba bucles en móviles). */
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
        localStorage.setItem(MIGRATION_KEY, "1");
      } catch {
        // ignore
      }
    })();
  }, []);

  return null;
}
