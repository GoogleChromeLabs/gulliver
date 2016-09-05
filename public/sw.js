/* eslint-env serviceworker, browser */

importScripts('/sw-toolbox/sw-toolbox.js'); /* global toolbox */

// The offline page itself *and* its dependencies
const OFFLINE = [
  '/.shell/offline',
  '/sw.js',
  '/js/gulliver.js'
];

const OFFLINE_URL = '/.shell/offline';

toolbox.precache(OFFLINE);

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
