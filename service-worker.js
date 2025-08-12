// Версию увеличивай при изменениях, чтобы обновлялся кэш
const CACHE_NAME = 'trainnig-pwa-v1';

// Кэшируем только то, что точно есть в репозитории
const ASSETS = [
  './',
  './index.html',
  './src/styles.css',
  './src/app.js',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// Стратегия: cache-first, потом сеть
self.addEventListener('fetch', event => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // Кэшируем GET-ответы (без ошибок)
        if (req.method === 'GET' && res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return res;
      }).catch(() => {
        // Фолбеков пока нет — можно добавить оффлайн-страницу
        return caches.match('./index.html');
      });
    })
  );
});
