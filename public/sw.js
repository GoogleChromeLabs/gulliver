/* eslint-env serviceworker, browser */

importScripts('/sw-toolbox/sw-toolbox.js'); /* global toolbox */

// URL to return in place of the "offline dino" when client is
// offline and requests a URL that's not in the cache.
const OFFLINE_URL = '/.shell/offline';

const OFFLINE = [
  OFFLINE_URL,
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
