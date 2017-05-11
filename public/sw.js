/* eslint-env serviceworker, browser */

// sw-offline-google-analytics *must* be imported and initialized before
// sw-toolbox, because its 'fetch' event handler needs to run first.
importScripts('/sw-offline-google-analytics/offline-google-analytics-import.js');
goog.offlineGoogleAnalytics.initialize();

// Use sw-toolbox
importScripts('/sw-toolbox/sw-toolbox.js'); /* global toolbox */
toolbox.options.debug = false;

importScripts('/js/sw-assets-precache.js'); /* global ASSETS */

const VERSION = '7';
const PREFIX = 'gulliver';
const CACHE_NAME = `${PREFIX}-v${VERSION}`;
const PWA_OPTION = {
  cache: {
    name: `PWA-${CACHE_NAME}`,
    maxAgeSeconds: 60 * 60 * 12,
    queryOptions: {
      ignoreSearch: true
    }
  }
};
const PWA_LIST_OPTION = {
  cache: {
    name: `LIST-${CACHE_NAME}`,
    maxAgeSeconds: 60 * 60 * 6
  }
};

// URL to return in place of the "offline dino" when client is
// offline and requests a URL that's not in the cache.
const OFFLINE_URL = '/.app/offline';
const SHELL_URL = '/.app/shell';

const OFFLINE = [
  OFFLINE_URL,
  SHELL_URL,
  '/?cacheOnly=true',
  '/favicons/android-chrome-72x72.png',
  '/manifest.json',
  '/img/GitHub-Mark-Light-24px.png',
  '/img/GitHub-Mark-Light-48px.png',
  '/img/lighthouse-18.png',
  '/img/lighthouse-36.png',
  '/messaging-config.json'
];

toolbox.precache(OFFLINE.concat(ASSETS));
toolbox.options.cache.name = CACHE_NAME;

/**
 * Utility method to retrieve a url from the `toolbox.options.cache.name` cache
 *
 * @param {*} url url to be requested fromt he cache.
 */
const getFromCache = url => {
  return caches.open(toolbox.options.cache.name)
    .then(cache => cache.match(url));
};

/**
 * A sw-toolbox handler that tries to serve content using networkFirst, and if
 * it fails, returns a custom offline page.
 */
const gulliverHandler = (request, values, options) => {
  return toolbox.fastest(request, values, options)
    .catch(_ => {
      // networkFirst failed (no network and not in cache)
      getFromCache(OFFLINE_URL).then(response => {
        return response || new Response('', {
          status: 500,
          statusText: 'Offline Page Missing'
        });
      });
    });
};

toolbox.router.default = (request, values, options) => {
  if (request.mode === 'navigate') {
    return getFromCache(SHELL_URL)
      .then(response => response || gulliverHandler(request, values, options));
  }
  return gulliverHandler(request, values, options);
};

toolbox.router.get(/\/pwas\/\d+/, toolbox.router.default, PWA_OPTION);

toolbox.router.get('/', (request, values) => {
  // Replace requests to start_url with the lastest version of the root page.
  // TODO Make more generic: strip utm_* parameters from *every* request.
  // TODO Pass through credentials (e.g. cookies) and other request metadata, see
  // https://github.com/ithinkihaveacat/sw-proxy/blob/master/http-proxy.ts#L249.
  if (request.url.endsWith('/?utm_source=homescreen')) {
    request = new Request('/');
  }
  return toolbox.router.default(request, values, PWA_LIST_OPTION);
});

toolbox.router.get(/.*\.(js|png|svg|jpg|css)$/, (request, values, options) => {
  return toolbox.cacheFirst(request, values, options);
});

// Claim all clients and delete old caches that are no longer needed.
self.addEventListener('activate', event => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      )
    )
  );
});

// Make sure the SW the page we register() is the service we use.
self.addEventListener('install', () => self.skipWaiting());
