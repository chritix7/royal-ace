const CACHE = "royal-ace-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);

      try {
        await cache.addAll(["/", "/manifest.webmanifest"]);
      } catch {
        // On n’empêche pas l’installation si une ressource change.
      }

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();

      await Promise.all(
        names.filter((name) => name !== CACHE).map((name) => caches.delete(name)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Pages : réseau d’abord, puis dernière page connue en cache.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);

        try {
          const response = await fetch(request);

          if (response.ok) {
            await cache.put(request, response.clone());
            await cache.put("/", response.clone());
          }

          return response;
        } catch {
          return (
            (await cache.match(request)) ??
            (await cache.match("/")) ??
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }
      })(),
    );

    return;
  }

  // Assets Next.js : cache d’abord, puis réseau et mise à jour.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);

      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached ?? network;
    })(),
  );
});