/*
 * Service worker de l'application : le jeu fonctionne hors connexion après
 * une première visite.
 * - pages : le réseau d'abord (pour recevoir les mises à jour), la copie en
 *   cache si l'on est hors ligne ;
 * - fichiers de l'application (noms uniques à chaque version) : le cache
 *   d'abord, puis le réseau.
 */
const CACHE = 'chef-de-gouvernement-v14';
const ESSENTIELS = ['./', './index.html', './manifest.webmanifest', './icones/icone-192.png', './icones/icone-512.png'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESSENTIELS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    ev.respondWith(
      fetch(req)
        .then((rep) => { const copie = rep.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copie)); return rep; })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }
  ev.respondWith(
    caches.match(req).then((enCache) => enCache || fetch(req).then((rep) => {
      if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then((c) => c.put(req, copie)); }
      return rep;
    })),
  );
});
