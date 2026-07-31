/**
 * TrainLog offline service worker
 *
 * Caches the application shell for offline use on GitHub Pages. Workout data,
 * preferences, backups, and body photos remain managed by the app's existing
 * browser-storage code and are not changed by this service worker.
 */

const CACHE_PREFIX = 'trainlog-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;

/**
 * Files required for TrainLog to start and render offline.
 *
 * Relative URLs keep the service worker compatible with both a local server
 * and the /trainlog/ subdirectory used by GitHub Pages.
 */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/trainlog.css',
  './assets/js/app.js',
  './assets/js/events.js',
  './assets/js/core/constants.js',
  './assets/js/core/helpers.js',
  './assets/js/core/state.js',
  './assets/js/core/storage.js',
  './assets/js/features/calendar.js',
  './assets/js/features/home.js',
  './assets/js/features/modals.js',
  './assets/js/features/profile.js',
  './assets/js/features/prs.js',
  './assets/js/features/workout.js',
  './assets/js/ui/chart.js',
  './assets/js/ui/components.js',
  './assets/js/ui/icons.js',
];

/**
 * Installation icons are cached separately so an unexpected icon problem must
 * not prevent the rest of TrainLog from becoming available offline.
 */
const OPTIONAL_ASSETS = [
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

/**
 * Precache the complete application shell.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await cache.addAll(APP_SHELL);

      await Promise.allSettled(
        OPTIONAL_ASSETS.map((asset) => cache.add(asset))
      );

      await self.skipWaiting();
    })()
  );
});

/**
 * Remove caches created by older TrainLog service-worker versions.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName.startsWith(CACHE_PREFIX) &&
              cacheName !== CACHE_NAME
          )
          .map((cacheName) => caches.delete(cacheName))
      );

      await self.clients.claim();
    })()
  );
});

/**
 * Store a successful same-origin response for later offline use.
 */
async function updateCache(request, response) {
  if (
    response &&
    response.ok &&
    response.type === 'basic'
  ) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }

  return response;
}

/**
 * Use the network first for page navigations so deployments appear promptly.
 * If the device is offline, return the cached TrainLog shell.
 */
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    return await updateCache(request, response);
  } catch (error) {
    return (
      (await caches.match(request)) ||
      (await caches.match('./')) ||
      (await caches.match('./index.html')) ||
      Response.error()
    );
  }
}

/**
 * Use the network first for app files so GitHub Pages updates appear on the
 * next launch. Fall back to the cached copy when the device is offline.
 */
async function handleAppAsset(request) {
  try {
    const response = await fetch(request);
    return await updateCache(request, response);
  } catch (error) {
    return (await caches.match(request)) || Response.error();
  }
}

/**
 * Serve only same-origin GET requests through TrainLog's cache.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(handleAppAsset(request));
});
