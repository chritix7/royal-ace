const CACHE = "royal-ace-v1";
const APP_SHELL = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);

      await cache.addAll(APP_SHELL).catch(() => {
        // Une ressource manquante ne doit pas empêcher l’installation.
      });

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();

      await Promise.all(
        names
          .filter((name) => name !== CACHE)
          .map((name) => caches.delete(name)),
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

  // Les pages HTML restent network-first : tu reçois toujours la dernière version en ligne.
  if (
    url.pathname.startsWith("/api/") ||
    request.headers.get("accept")?.includes("text/html")
  ) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE);

        return (
          (await cache.match("/")) ??
          new Response("Royal Ace is offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          })
        );
      }),
    );

    return;
  }

  // JS, CSS, images et autres assets : cache d’abord, rafraîchissement en arrière-plan.
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