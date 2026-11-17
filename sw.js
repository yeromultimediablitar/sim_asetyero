/* Service worker cangkang PWA. Hanya mengurus berkas milik cangkang (satu origin);
   aplikasi Apps Script di dalam iframe TIDAK pernah dicache atau disentuh. */
const CACHE = 'sim-karyawan-pwa-v2';   // naikkan angkanya (v2, v3, ...) setiap kali berkas cangkang diubah
const ASET = [
  './', './index.html', './style.css', './app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASET)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nama) => Promise.all(nama.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;   // biarkan lintas-origin & non-GET

  if (req.mode === 'navigate') {   // halaman: utamakan jaringan, cadangan dari cache saat offline
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(   // aset: tampilkan cache segera, perbarui di latar belakang
    caches.match(req).then((hit) => {
      const dariJaringan = fetch(req).then((res) => {
        if (res && res.ok) { const salin = res.clone(); caches.open(CACHE).then((c) => c.put(req, salin)); }
        return res;
      }).catch(() => hit);
      return hit || dariJaringan;
    })
  );
});
