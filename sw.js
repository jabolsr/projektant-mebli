// sw.js — Service Worker: cache'uje całą aplikację (kod, dane, obrazy),
// żeby działała w 100% offline po pierwszym otwarciu.
//
// CACHE_VERSION jest automatycznie podbijany przez skrypt pakujący
// (spakuj_do_apki.py) przy każdej aktualizacji bazy kolorów, żeby telefon
// pobrał świeże dane zamiast trzymać się starej wersji z cache.
const CACHE_VERSION = "v1788815107";
const CACHE_NAME = "projektant-mebli-" + CACHE_VERSION;

const APP_SHELL = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "calc.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      try {
        const resp = await fetch("data/kolory.json");
        const kolory = await resp.json();
        await cache.put("data/kolory.json", new Response(JSON.stringify(kolory), {
          headers: { "Content-Type": "application/json" },
        }));
        const obrazy = new Set();
        kolory.forEach((k) => {
          if (k.miniatura) obrazy.add(k.miniatura);
          if (k.pelny) obrazy.add(k.pelny);
        });
        await cache.addAll(Array.from(obrazy));
      } catch (e) {
        console.error("Błąd cache'owania danych/obrazów:", e);
      }
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      try {
        const resp = await fetch(event.request);
        if (resp && resp.ok && event.request.method === "GET") {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, resp.clone());
        }
        return resp;
      } catch (e) {
        return cached || Response.error();
      }
    })()
  );
});
