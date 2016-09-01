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
