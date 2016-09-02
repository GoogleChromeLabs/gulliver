/* eslint-env browser */

/**
 * Note: window.gapiReady must be a promise that resolves to
 * window.gapi.
 *
 * @template T
 * @param {string} name the library to load
 * @return {Promise<T>} resolves to window.gapi[name]
 */
function gapiLoad(name) {
  return new Promise((resolve, reject) => {
    if ('gapiReady' in window) {
      window.gapiReady.then(gapi => {
        gapi.load(name, () => resolve(gapi[name]));
      });
    } else {
      reject('Promise window.gapiReady not found');
    }
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
function clientLoad(name, version) { // eslint-disable-line no-unused-vars
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
function authInit(params) {
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

(() => {
  // LOGIN/LOGOUT HANDLER

  const [login, logout] = [document.getElementById('login'), document.getElementById('logout')];

  /**
   * @param {GoogleUser} user
   */
  function onChange(user) {
    if (user.isSignedIn()) {
      console.log('id_token', user.getAuthResponse().id_token);
      login.disabled = true;
      logout.disabled = false;
      const pwaForm = document.getElementById('pwaForm');
      if (pwaForm) {
        const idTokenInput = document.getElementById('idToken');
        idTokenInput.setAttribute('value', user.getAuthResponse().id_token);

        const pwaSubmit = document.getElementById('pwaSubmit');
        pwaSubmit.removeAttribute('disabled');
      }
    } else {
      console.log('user signed out/never signed in');
      login.disabled = false;
      logout.disabled = true;
      const pwaForm = document.getElementById('pwaForm');
      if (pwaForm) {
        const idTokenInput = document.getElementById('idToken');
        idTokenInput.setAttribute('value', '');

        const pwaSubmit = document.getElementById('pwaSubmit');
        pwaSubmit.setAttribute('disabled', '');
      }
    }
  }

  /* eslint-disable camelcase */
  const params = {
    scope: 'profile',
    client_id: window.__config.client_id,
    fetch_basic_profile: false
  };
  /* eslint-enable camelcase */

  authInit(params).then(auth => {
    auth.currentUser.listen(onChange);
    onChange(auth.currentUser.get()); // User may be signed in already

    login.addEventListener('click', () => auth.signIn());
    logout.addEventListener('click', () => auth.signOut());
  });

  // REGISTER SERVICE WORKER

  navigator.serviceWorker.register('/sw.js').then(r => {
    console.log('REGISTRATION', r);
  });
})();
