/* ============================================================
   SERVICE WORKER — World of Light School PWA
   ============================================================
   Strategy:
   - Precache the app shell (HTML, CSS, JS, logo, offline page)
   - Network-first for Firebase requests (always fresh data)
   - Cache-first for static assets (images, fonts, CSS, JS)
   - Fallback to offline.html when the network is unavailable
============================================================ */

const CACHE_VERSION = 'wol-v1.0.7';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  'logo1.png'
];

/* ============================================================
   INSTALL — precache the app shell
============================================================ */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL).catch(err => {
        console.warn('[SW] Precache had errors (some assets may be missing):', err);
      }))
      .then(() => self.skipWaiting())
  );
});

/* ============================================================
   ACTIVATE — clean up old cache versions
============================================================ */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(name => !name.startsWith(CACHE_VERSION))
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      ))
      .then(() => self.clients.claim())
  );
});

/* ============================================================
   FETCH — routing strategy
============================================================ */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (POST to Firestore etc.)
  if (request.method !== 'GET') return;

  // Ignore browser extensions and chrome-extension:// URLs
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') return;

  // ---- Firebase / Firestore / gstatic APIs — always network-first ----
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com/firebasejs')
  ) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // ---- Images — cache-first with long expiry ----
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // ---- HTML navigation — network-first with offline fallback ----
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // ---- Everything else (CSS, JS, fonts) — cache-first ----
  // ---- JS, CSS, JSON — network-first, so content updates show up ----
if (
  request.destination === 'script' ||
  request.destination === 'style' ||
  url.pathname.endsWith('.js') ||
  url.pathname.endsWith('.css') ||
  url.pathname.endsWith('.json')
) {
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
  return;
}

// ---- Everything else (fonts, etc.) — cache-first ----
event.respondWith(cacheFirst(request, RUNTIME_CACHE));
return;
});

/* ============================================================
   STRATEGY: Cache First
   Return from cache if available; otherwise fetch and cache.
============================================================ */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // If it's an image and we're offline, return a placeholder
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#F8F7F2" width="400" height="300"/><text x="50%" y="50%" fill="#6B7280" font-family="sans-serif" font-size="14" text-anchor="middle">Image unavailable offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

/* ============================================================
   STRATEGY: Network First
   Try the network; fall back to cache.
============================================================ */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // No cache and no network — return an error response
    return new Response('Offline — please check your connection.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/* ============================================================
   STRATEGY: Navigation (HTML pages)
   Network-first. If network fails, show cached page or offline.html.
============================================================ */
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(APP_SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(APP_SHELL_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const offline = await cache.match('/offline.html');
    if (offline) return offline;

    return new Response('You are offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/* ============================================================
   MESSAGE — allow the page to trigger skipWaiting
============================================================ */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});