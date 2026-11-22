// Service hors ligne minimal : l'application s'ouvre même sans réseau.
const CACHE = 'mon-poulailler-v3'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './favicon.png', './logo-ttb-rond.webp', './icone-192.png'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  // Pages : réseau d'abord, cache en secours. Fichiers : cache d'abord.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copie = r.clone()
          caches.open(CACHE).then((c) => c.put('./index.html', copie))
          return r
        })
        .catch(() => caches.match('./index.html')),
    )
    return
  }
  e.respondWith(
    caches.match(req).then(
      (trouve) =>
        trouve ||
        fetch(req).then((r) => {
          if (r.ok) {
            const copie = r.clone()
            caches.open(CACHE).then((c) => c.put(req, copie))
          }
          return r
        }),
    ),
  )
})
