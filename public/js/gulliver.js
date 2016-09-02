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

/**
 * Setup handlers for the 'online', 'offline' and 'userchange' events. ('userchange' is
 * a custom event fired when a user logs in or out.)
 */
function setupEventHandlers() {
  window.addEventListener('online', () => {
    console.log('ONLINE');
    const onlineAware = document.querySelectorAll('.gulliver-online-aware');
    for (const e of onlineAware) {
      e.dataset.online = JSON.stringify(true);
      e.dispatchEvent(new CustomEvent('change'));
    }
  });

  window.addEventListener('offline', () => {
    console.log('OFFLINE');
    const onlineAware = document.querySelectorAll('.gulliver-online-aware');
    for (const e of onlineAware) {
      e.dataset.online = JSON.stringify(false);
      e.dispatchEvent(new CustomEvent('change'));
    }
  });

  window.addEventListener('userchange', e => {
    const user = e.detail;
    if (user.isSignedIn()) {
      console.log('id_token', user.getAuthResponse().id_token);
      const pwaForm = document.getElementById('pwaForm');
      if (pwaForm) {
        const idTokenInput = document.getElementById('idToken');
        idTokenInput.setAttribute('value', user.getAuthResponse().id_token);
      }
    } else {
      console.log('user signed out/never signed in');
      const pwaForm = document.getElementById('pwaForm');
      if (pwaForm) {
        const idTokenInput = document.getElementById('idToken');
        idTokenInput.setAttribute('value', '');
      }
    }
    const signedinAware = document.querySelectorAll('.gulliver-signedin-aware');
    for (const e of signedinAware) {
      e.dataset.signedin = JSON.stringify(user.isSignedIn());
      e.dispatchEvent(new CustomEvent('change'));
    }
  });
}

/**
 * Setup elements that are aware of the signed in state.
 */
function setupSignedinAware() {
  const list = document.querySelectorAll('.gulliver-signedin-aware.gulliver-online-aware');
  for (const e of list) {
    e.dataset.online = JSON.stringify(false);
    e.dataset.signedin = JSON.stringify(false);
    e.addEventListener('change', function() {
      const online = JSON.parse(this.dataset.online);
      const signedin = JSON.parse(this.dataset.signedin);
      switch (e.tagName.toLowerCase()) {
        case 'button':
          if (e.id === 'login') {
            // Login is "reversed" for login button
            this.disabled = !online || signedin;
          } else {
            this.disabled = !online || !signedin;
          }
          break;
        case 'div':
          if (online && signedin) {
            this.style.opacity = 1;
            this.onclick = null;
          } else {
            this.style.opacity = 0.5;
            this.onclick = f => f.preventDefault();
          }
          break;
        default:
      }
    });
  }
}

/**
 * Setup elements that are aware of the online state.
 */
function setupOnlineAware() {
  const list = document.querySelectorAll('div.gulliver-online-aware');
  for (const e of list) {
    e.addEventListener('change', function() {
      if (JSON.parse(this.dataset.online)) {
        this.style.opacity = 1;
        this.onclick = null;
      } else {
        this.style.opacity = 0.5;
        this.onclick = f => f.preventDefault();
      }
    });
  }
}

/**
 * Setup/configure Google signin itself. This translates GSI events into 'userchange'
 * events on the window object.
 */
function setupSignin(login, logout) {
  /* eslint-disable camelcase */
  const params = {
    scope: 'profile',
    client_id: '605287872172-js6omne47i1k79hnfo7d4bdu9rlemslr.apps.googleusercontent.com',
    fetch_basic_profile: false
  };
  /* eslint-enable camelcase */

  return authInit(params).then(auth => {
    // Fire 'userchange' event on page load (not just when status changes)
    window.dispatchEvent(new CustomEvent('userchange', {
      detail: auth.currentUser.get()
    }));

    // Fire 'userchange' event when status changes
    auth.currentUser.listen(user => {
      window.dispatchEvent(new CustomEvent('userchange', {
        detail: user
      }));
    });

    // Bind buttons to signIn(), signOut() actions
    login.addEventListener('click', () => auth.signIn());
    logout.addEventListener('click', () => auth.signOut());

    return auth;
  });
}

/**
 * Register service worker.
 */
function setupServiceWorker() {
  navigator.serviceWorker.register('/sw.js').then(r => {
    console.log('REGISTRATION', r);
  });
}

setupOnlineAware();
setupSignedinAware();
setupSignin(
  document.getElementById('login'),
  document.getElementById('logout')
);
setupEventHandlers();
setupServiceWorker();

// Fire 'online' or 'offline' event on page load. (Without this, would only
// fire on change.)
window.dispatchEvent(new CustomEvent(navigator.onLine ? 'online' : 'offline'));
