/**
 * Copyright 2015-2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-env browser */

export default class ClientEvents {
  constructor() {
    this.boundOnClickForClientTransition = event => this.onClickForClientTransition(event);
    this.setupClientTransition();
    this.setupEventHandlers();
    this.setupOfflineStatusBanner();

    // Fire 'online' or 'offline' event on page load. (Without this, would only
    // fire on change.)
    window.dispatchEvent(new CustomEvent(navigator.onLine ? 'online' : 'offline'));
  }

  /**
   * Translate generic "system" event like 'online', 'offline' and 'userchange'
   * into Gulliver-specific events. (e.g. as indicated by classes.)
   *
   * What this function does:
   *
   *   * all elements with class .gulliver-online-aware will:
   *     * have an 'online' dataset property that reflects the current online state.
   *     * receive a 'change' event whenever the state changes.
   *
   *   * all elements with class .gulliver-signedin-aware will:
   *     * have a 'signedin' dataset property that reflects the current signed in state.
   *     * receive a 'change' event whenever the state changes.
   */
  setupEventHandlers() {
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
      const signedinAware = document.querySelectorAll('.gulliver-signedin-aware');
      for (const e of signedinAware) {
        e.dataset.signedin = JSON.stringify(user.isSignedIn());
        e.dataset.idToken = user.isSignedIn() ? user.getAuthResponse().id_token : '';
        e.dispatchEvent(new CustomEvent('change'));
      }
    });
  }

  /**
   * Configures elements with class `gulliver-signed-aware` and
   * `gulliver-online-aware` to respond to 'change' events.
   */
  setupSignedinAware() {
    const list = document.querySelectorAll('.gulliver-signedin-aware.gulliver-online-aware');
    for (const e of list) {
      if (!e.dataset.signedinAwareEvent) {
        e.dataset.signedinAwareEvent = true;
        e.addEventListener('change', function() {
          const online = window.navigator.onLine;
          let signedin;
          if (document.getElementById('auth-button').dataset.signedin) {
            signedin = JSON.parse(document.getElementById('auth-button').dataset.signedin);
          }
          switch (e.tagName.toLowerCase()) {
            case 'button':
              if (e.id === 'auth-button') {
                // auth-button state depends only on online state
                this.disabled = !online;
              } else {
                this.disabled = !online || !signedin;
              }
              break;
            case 'div':
              if (online && signedin) {
                this.style.opacity = 1;
                this.onclick = null;
              } else {
                this.style.opacity = 0.3;
                this.onclick = f => f.preventDefault();
              }
              break;
            default:
          }
        });
      }
    }
  }

  // Used to find out if content/page is available while offline
  isAvailableInCache(element) {
    if (!element || !element.href) {
      return Promise.resolve(false);
    }
    const contentOnlyUrl = element.href +
      (element.href.indexOf('?') >= 0 ? '&' : '?') + 'contentOnly=true';
    return fetch(contentOnlyUrl, {method: 'HEAD'})
      .then(response => {
        return (response.status === 200);
      }).catch(_ => {
        return false;
      });
  }

  /**
   * Configures elements with class `gulliver-online-aware` to respond to 'change'
   * events.
   */
  setupOnlineAware() {
    const onlineAwareElements = document.getElementsByClassName('gulliver-online-aware');

    const enableWhenOnline = (element => {
      element.style.transition = 'opacity .2s ease-in-out';
      element.style.opacity = 1;
      element.style.cursor = 'pointer';
      if (element.classList.contains('card-pwa')) {
        element.classList.add('box-shadow');
      }
      if (element.classList.contains('gulliver-content-only')) {
        element.addEventListener('click', this.boundOnClickForClientTransition);
      }
      element.onclick = null;
    });

    const disableWhenOffline = (element => {
      if (element.id !== 'title' && element.id !== 'subtitle') {
        element.style.transition = 'opacity .2s ease-in-out';
        element.style.opacity = 0.3;
        if (element.classList.contains('card-pwa')) {
          element.classList.remove('box-shadow');
        }
      }
      element.style.cursor = 'default';
      if (element.classList.contains('gulliver-content-only')) {
        element.removeEventListener('click', this.boundOnClickForClientTransition);
      }
      element.onclick = f => f.preventDefault();
    });

    for (const element of onlineAwareElements) {
      if (!element.dataset.onlineAwareEvent &&
        !element.classList.contains('offline-status') &&
        !element.classList.contains('gulliver-signedin-aware')) {
        element.dataset.onlineAwareEvent = true;
        element.addEventListener('change', _ => {
          if (window.navigator.onLine) {
            enableWhenOnline(element);
          } else {
            this.isAvailableInCache(element)
              .then(isAvailable => {
                if (isAvailable) {
                  enableWhenOnline(element);
                } else {
                  disableWhenOffline(element);
                }
              });
          }
        });
      }
    }
  }

  /**
   * Trigers the footer's offline banner while offline.
   */
  setupOfflineStatusBanner() {
    const offlineBanner = document.getElementsByClassName('offline-status')[0];
    offlineBanner.innerHTML = 'Offline';
    offlineBanner.addEventListener('change', function() {
      this.style.opacity = 1;
      this.style.display = 'block';
      if (JSON.parse(this.dataset.online)) {
        this.style.transition = 'opacity .5s ease-in-out';
        this.style.opacity = 0;
      } else {
        this.style.transition = 'opacity .5s ease-in-out';
        this.style.opacity = 1;
      }
    });
  }

 /**
  * Fetches inner body content for client side transitions,
  * it uses the contentOnly parameter to gather part of the templates.
  */
  clientTransitionInnerContent(element, newUrl) {
    this.clientTransitionVisualChanges(newUrl);
    return fetch(newUrl)
      .then(response => {
        return response.text();
      }).then(body => {
        window.scrollTo(0, 0);
        element.innerHTML = body;
        element.style.transition = 'opacity 0.1s ease-in-out';
        element.style.opacity = 1;
      });
  }

 /**
  * Rewrites links with gulliver-content-only class to trigger client
  * side transitions.
  */
  onClickForClientTransition(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const main = document.getElementsByTagName('main')[0];
    let url = element.getAttribute('href');

    // only transition if click is different from current location
    if (!window.location.href.endsWith(url)) {
      const contentOnlyUrl = url +
        (url.indexOf('?') >= 0 ? '&' : '?') + 'contentOnly=true';

      const cardPwas = document.querySelectorAll('.card-pwa');
      for (const card of cardPwas) {
        // hide other cards quicker than clicked card
        if (card.href !== element.href) {
          card.style.transition = 'opacity .1s ease-out';
          card.style.opacity = 0.3;
        }
      }

      this.clientTransitionInnerContent(main, contentOnlyUrl)
        .then(_ => {
          window.history.pushState(window.location.href, 'PWA Directory', url);
          this.rewriteOnClicksForClientTransition();
        });
    }
  }

 /**
  * Shows/hides content in the header according to location.
  */
  clientTransitionVisualChanges(newUrl) {
    if (newUrl.includes('/pwas/add')) {
      // show Submit PWA subtitle
      document.querySelector('div#subtitle').classList.remove('hidden');
    } else {
      document.querySelector('div#subtitle').classList.add('hidden');
    }
    if (newUrl.includes('/pwas/')) {
      // show backlink
      document.querySelector('a#newest').classList.add('hidden');
      document.querySelector('a#score').classList.add('hidden');
      document.querySelector('a#backlink').classList.remove('hidden');
    } else {
      // set active tab
      if (newUrl.includes('score')) {
        document.querySelector('a#score').classList.add('activetab');
        document.querySelector('a#newest').classList.remove('activetab');
      } else {
        document.querySelector('a#score').classList.remove('activetab');
        document.querySelector('a#newest').classList.add('activetab');
      }
      // show tabs
      document.querySelector('a#newest').classList.remove('hidden');
      document.querySelector('a#score').classList.remove('hidden');
      document.querySelector('a#backlink').classList.add('hidden');
    }
  }

 /**
  * Rewrites links for client side transitions,
  * Needs to be called everytime the page/body changes.
  */
  rewriteOnClicksForClientTransition() {
    this.setupOnlineAware();
    this.setupSignedinAware();
    const contentOnlyElements = document.getElementsByClassName('gulliver-content-only');
    for (const element of contentOnlyElements) {
      if (!element.dataset.rewroteClick) {
        element.dataset.rewroteClick = true;
        element.addEventListener('click', this.boundOnClickForClientTransition);
      }
      element.dispatchEvent(new CustomEvent('change'));
    }
  }

 /**
  * * Setup client side transtions, needs to be called once.
  */
  setupClientTransition() {
    this.rewriteOnClicksForClientTransition();
    // handles backclicks/backlinks
    window.onpopstate = _ => {
      let main = document.getElementsByTagName('main')[0];
      let contentOnlyUrl = window.location.href +
        (window.location.href.indexOf('?') >= 0 ? '&' : '?') + 'contentOnly=true';
      this.clientTransitionInnerContent(main, contentOnlyUrl)
        .then(_ => {
          this.rewriteOnClicksForClientTransition();
        });
    };
  }
}
