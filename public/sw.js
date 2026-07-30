const CACHE = "finanzas-v1";

// Pre-cachear el shell de la app
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/"]))
  );
});

// Limpiar cachés antiguas al activar
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar GET del mismo origen
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API: network-first, sin caché (datos siempre frescos)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ error: "Sin conexión" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
      )
    );
    return;
  }

  // Assets estáticos de Next.js: cache-first (tienen hash en el nombre)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
            return res;
          })
      )
    );
    return;
  }

  // Páginas y otros recursos: network-first con fallback a caché
  event.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request))
  );
});
