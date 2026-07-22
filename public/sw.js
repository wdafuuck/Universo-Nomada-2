/* Universo Nómada — SW desactivado. Solo limpia y se desregistra. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        // ignore
      }
      try {
        await self.registration.unregister();
      } catch {
        // ignore
      }
      await self.clients.claim();
    })(),
  );
});
