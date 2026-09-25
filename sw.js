/* ============================================================
   SERVICE WORKER — Genesis Global Academy PWA
   ============================================================
   Strategy:
   - Precache the app shell (HTML, CSS, JS, logos, offline page)
   - Firestore / Realtime DB — bypass SW (SDK handles its own cache)
   - Firebase SDK scripts — network-first
   - Images — cache-first with offline SVG placeholder
   - HTML navigation — network-first with offline.html fallback
   - JS / CSS / JSON — network-first (so updates land promptly)
   - Fonts / everything else — cache-first
============================================================ */

const CACHE_VERSION = 'wol-v1.0.65';
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
  'logo1.png',
  'logo2.png',
  'logo3.png',
  'bgvideo.webm',
  'bgvideo.mp4',
  'poster.jpg'
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
      // NOTE: intentionally NOT calling self.skipWaiting() here.
      // The page controls activation via postMessage({type:'SKIP_WAITING'})
      // when it detects an update — this avoids mid-session reloads.
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

  // Ignore browser extension URLs
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') return;

  // ---- Firestore / Realtime DB — let the browser handle these directly.
  // The Firebase SDK has its own IndexedDB cache and offline layer.
  // Intercepting them here adds latency and can conflict with the SDK.
  if (
    url.hostname === 'firestore.googleapis.com' ||
    url.hostname.endsWith('.firebaseio.com')
  ) {
    return; // no event.respondWith() → browser fetches normally
  }

  // ---- Firebase SDK scripts from gstatic — network-first
  if (url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/')) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // ---- Images — cache-first with long expiry
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // ---- HTML navigation — network-first with offline fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // ---- JS, CSS, JSON — network-first so content updates show up
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

  // ---- Everything else (fonts, etc.) — cache-first
  event.respondWith(cacheFirst(request, RUNTIME_CACHE));
});

/* ============================================================
   STRATEGY: Cache First
============================================================ */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Cache successful responses — allow basic (same-origin) and
    // cors (e.g. Google Fonts) responses. Opaque responses can't
    // be inspected and put() may fail, so we skip them.
    if (
      response &&
      response.status === 200 &&
      (response.type === 'basic' || response.type === 'cors')
    ) {
      cache.put(request, response.clone()).catch(() => {});
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
============================================================ */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('Offline — please check your connection.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/* ============================================================
   STRATEGY: Navigation (HTML pages)
============================================================ */
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(APP_SHELL_CACHE);
      cache.put(request, response.clone()).catch(() => {});
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
