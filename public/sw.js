/* Universo Nómada — SW desactivado (evita crashes / caché vieja post-Netlify).
   Si quedó registrado, se desinstala solo. */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      const regs = await self.registration.unregister();
      await self.clients.claim();
      return regs;
    })(),
  );
});

self.addEventListener("fetch", () => {
  // no interceptar
});
