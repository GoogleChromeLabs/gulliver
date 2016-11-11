/* eslint-env serviceworker, browser */

// sw-offline-google-analytics *must* be imported and initialized before
// sw-toolbox, because its 'fetch' event handler needs to run first.
importScripts('/sw-offline-google-analytics/offline-google-analytics-import.js');
goog.offlineGoogleAnalytics.initialize();

importScripts('/sw-toolbox/sw-toolbox.js'); /* global toolbox */

// URL to return in place of the "offline dino" when client is
// offline and requests a URL that's not in the cache.
const OFFLINE_URL = '/.shell/offline';

const OFFLINE = [
  OFFLINE_URL,
  '/img/GitHub-Mark-Light-32px.png',
  '/img/GitHub-Mark-Light-64px.png',
  '/img/lighthouse.svg',
  '/css/style.css',
  '/sw.js',
  '/js/gulliver.js'
];

toolbox.precache(OFFLINE);

// Cache the page registering the service worker. Without this, the
// "first" page the user visits is only cached on the second visit,
// since the first load is uncontrolled.
toolbox.precache(
  clients.matchAll({includeUncontrolled: true}).then(l => {
    return l.map(c => c.url);
  })
);

toolbox.options.debug = true;

// Provide an API for the front end to determine which resources are available in the
// cache. We could have also established a new endpoint, or implemented support
// for 'only-if-cached', but the HEAD method was unused.
toolbox.router.head(/^/, request => {
  // Simulate RFC7234's only-if-cached mechanism so that the front end is able to
  // determine which links work offline. Also very similar to sw-toolbox's cacheOnly
  // strategy, except that we cache.match(url) rather than cache.match(request) so
  // that the HEAD method is ignored on cache.match().
  function onlyIfCached(url) {
    return caches.open(toolbox.options.cache.name).then(cache => {
      return cache.match(url).then(response => {
        return (response && response.status === 200) ? response : new Response('', {
          status: 504,
          statusText: 'Gateway Timeout'
        });
      });
    });
  }
  return onlyIfCached(request.url);
});

toolbox.router.get('/', (request, values, options) => {
  // Replace requests to start_url with the lastest version of the root page.
  if (request.url.endsWith('/?utm_source=homescreen')) {
    request = new Request('/');
  }
  return toolbox.router.default(request, values, options);
});

toolbox.router.default = (request, values, options) => {
  return toolbox.networkFirst(request, values, options)
    .catch(_ => {
      // networkFirst failed (no network and not in cache)
      return caches.open(toolbox.options.cache.name).then(cache => {
        return cache.match(OFFLINE_URL).then(response => {
          return response || new Response('', {
            status: 500,
            statusText: 'Offline Page Missing'
          });
        });
      });
    });
};

// Claim clients so that the very first page load is controlled by a service
// worker. (Important for responding correctly in offline state.)
self.addEventListener('activate', () => self.clients.claim());

// Make sure the SW the page we register() is the service we use.
self.addEventListener('install', () => self.skipWaiting());
