/* eslint-env serviceworker, browser */

importScripts('/sw-toolbox/sw-toolbox.js');

self.addEventListener('install', () => {
  console.log('INSTALL');
});

self.addEventListener('activate', () => {
  console.log('ACTIVATE');
});

self.addEventListener('fetch', e => {
  console.log('FETCH', e.request.url);
});
