const CACHE_NAME = "minha-adega-v47";

const PRECACHE_URLS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) =>
        Promise.all(
          clients.map((client) => {
            const url = new URL(client.url);
            if (url.origin !== self.location.origin) return undefined;
            if (url.searchParams.get("sw-refresh") === CACHE_NAME) return undefined;
            url.searchParams.set("sw-refresh", CACHE_NAME);
            return client.navigate(url.href);
          })
        )
      )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Never cache API calls — always go to network
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // For navigation requests (SPA): always prefer fresh HTML to avoid stale bundles after deploys.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/", clone));
          }
          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // For static assets: cache-first strategy
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request, { cache: "no-store" }).then((response) => {
          // Only cache valid responses for static assets
          if (
            response.ok &&
            (url.pathname.match(/\.(js|css|png|svg|woff2?|ico)$/) ||
              url.pathname === "/")
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
    )
  );
});
