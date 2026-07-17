const CACHE = 'meddocs-v1'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/', '/upload']))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // רק GET — שאר הבקשות עוברות ישר לרשת
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
