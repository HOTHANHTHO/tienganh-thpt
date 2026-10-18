// Tăng CACHE_VERSION mỗi khi đổi file tĩnh (html/css/js/data), nếu không trình duyệt giữ bản cũ.
const CACHE_VERSION = 'tathpt-v1';
const FILES = ['./', './index.html', './css/style.css', './js/app.js', './js/data.bundle.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
