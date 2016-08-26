/* eslint-env serviceworker, browser */

importScripts('/sw-toolbox/sw-toolbox.js'); /* global toolbox */

self.addEventListener('install', () => {
  console.log('INSTALL');
});

self.addEventListener('activate', () => {
  console.log('ACTIVATE');
});

self.addEventListener('fetch', e => {
  console.log('FETCH', e.request.url);
});

toolbox.options.debug = true;
toolbox.router.default = (request, values, options) => {
  return toolbox.networkFirst(request, values, options).catch(e => {
    console.log('CATCH THEM ALL!', e);
    return mock();
  });
};

function mock() {
  var body = [
    'The great roe is a mythological beast with the head',
    'of a lion and the body of a lion, though not the same',
    'lion.'
  ].join(' ');
  var res = new Response(body, {
    status: 200,
    statusText: 'OK',
    headers: {
      'cache-control': 'max-age=86400',
      'content-type': 'text/plain',
      'date': new Date().toUTCString()
    }
  });
  return res;
}
