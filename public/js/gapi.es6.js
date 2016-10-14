/* eslint-env browser */

/**
 * Returns a Promise that fulfills to `window.gapi`. Note that this function
 * will probably create the global properties `gapiReady` and `gapiResolve`.
 *
 * @param {typeof window} context
 * @param {typeof document} doc
 * @return {Promise<typeof window.gapi>}
 */
export function gapi(context = window, doc = document) {
  return context.gapiReady || new Promise(resolve => {
    // Adapted from GA embed code
    const c = 'gapiResolve';
    const s = doc.createElement('script');
    const p = doc.getElementsByTagName('script')[0];
    s.async = 1;
    s.src = `https://apis.google.com/js/api.js?onload=${c}`;
    p.parentNode.insertBefore(s, p);
    context[c] = () => resolve(window.gapi);
  });
}

/**
 * @template T
 * @param {string} name the library to load
 * @return {Promise<T>} resolves to window.gapi[name]
 */
export function gapiLoad(name) {
  return gapi().then(g => {
    return new Promise(resolve => {
      g.load(name, () => resolve(g[name]));
    });
  });
}

/**
 * Promise'd version of [`gapi.client.load`](https://developers.google.com/api-client-library/javascript/reference/referencedocs#gapiclientloadname--------version--------callback).
 *
 * @template T
 * @param {string} name the API client to load
 * @param {string} [version="v1"] version
 * @return {Promise<T>} resolves to gapi.client[name]
 */
export function clientLoad(name, version) {
  version = version ? version : 'v1';
  return gapiLoad('client').then(client => {
    return new Promise(resolve => {
      client.load(name, version, () => resolve(client[name]));
    });
  });
}

/**
 * Promise'd version of [`gapi.auth2.init`](https://developers.google.com/identity/sign-in/web/reference#gapiauth2initparams).
 *
 * @param {any} params https://developers.google.com/identity/sign-in/web/reference#gapiauth2initparams
 * @return {Promise<gapi.auth2.GoogleAuth>} Promise resolving to an initialized gapi.auth2.GoogleAuth object
 */
export function authInit(params) {
  return gapiLoad('auth2').then(auth2 => {
    /* Ideally we'd just return `auth2.init(params)` here, but
     * instead we need to work around a few bugs and surprises in
     * `auth2.init()` and the "Promise" it returns.
     */
    return new Promise(resolve => {
      auth2.init(params).then(t => {
        t.then = null;
        resolve(t);
      });
    });
  });
}
