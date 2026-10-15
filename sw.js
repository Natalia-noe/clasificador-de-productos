// Service worker: deja la app y el modelo en caché para que funcione sin internet
// después de la primera carga (la primera vez sí se necesita conexión).
const VERSION = "productos-v1";
const BASE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero la caché (rápido y sin conexión) y se actualiza en segundo plano.
// Aplica también a las librerías y a los pesos del modelo, que se guardan al usarse por primera vez.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  e.respondWith(
    caches.match(req).then(hit => {
      const red = fetch(req)
        .then(res => {
          if (res && (res.ok || res.type === "opaque")) {
            const copia = res.clone();
            caches.open(VERSION).then(c => c.put(req, copia)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || red;
    })
  );
});
