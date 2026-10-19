const CACHE = "royal-ace-v4-cleanup";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();

      await Promise.all(names.map((name) => caches.delete(name)));

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});

self.addEventListener("fetch", () => {
  // Aucune interception : l’app redevient 100 % en ligne.
});