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

/*
 * Generate gulliver.js from this file via `npm prestart`. (`npm start` will run
 * `prestart` automatically.)
 */

/* eslint-env browser */

// A Promise polyfill, as used by
// https://github.com/Financial-Times/polyfill-service/blob/master/polyfills/Promise/config.json
import 'yaku/dist/yaku.browser.global.min.js';
// A fetch polyfill, as used by
// https://github.com/Financial-Times/polyfill-service/blob/master/polyfills/fetch/config.json
import 'whatwg-fetch/fetch';

import './loader.js';
import Messaging from './messaging';
import NotificationCheckbox from './ui/notification-checkbox';
import Config from './gulliver-config';
import SignIn from './signin';
import SignInButton from './ui/signin-button';
import PwaCard from './ui/pwa-card';
import OfflineBanner from './ui/offline-banner';
import SignInOnlineAwareButton from './ui/signin-online-aware-btn';

class Gulliver {
  constructor() {
    this.config = Config.from(document.querySelector('#config'));
    this._setupUIComponents();
    this._setupSignin();
    this.setupEventHandlers();
    this.setupServiceWorker();
    this.setupMessaging();
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

  _setupUIComponents() {
    SignInOnlineAwareButton.setup('#pwaSubmit, #pwaAdd');
    PwaCard.setup('a.card-pwa');
    OfflineBanner.setup('div.offline-status');
  }

  /**
   * Setup/configure Google signin itself. This translates GSI events into 'userchange'
   * events on the window object.
   */
  _setupSignin() {
    this.signIn = new SignIn();
    SignInButton.setup(this.signIn, '#auth-button');
    this.signIn.init(this.config);
  }

  /**
   * Register service worker.
   */
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(r => {
        console.log('REGISTRATION', r);
      });
    } else {
      console.log('SW not registered; navigator.serviceWorker is not available');
    }
  }

  setupMessaging() {
    const NEW_APPS_TOPIC = 'new-apps';
    const firebaseMsgSenderId = this.config.firebase_msg_sender_id;
    const checkbox = document.getElementById('notifications');
    const messaging = new Messaging(firebaseMsgSenderId);
    // eslint-disable-next-line no-unused-vars
    const notificationCheckbox = new NotificationCheckbox(messaging, checkbox, NEW_APPS_TOPIC);
  }
}

const gulliver = new Gulliver();

// Fire 'online' or 'offline' event on page load. (Without this, would only
// fire on change.)
window.dispatchEvent(new CustomEvent(navigator.onLine ? 'online' : 'offline'));

// GA embed code
/* eslint-disable */
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', gulliver.config.ga_id, 'auto');
ga('set', 'dimension1', navigator.onLine);
ga('send', 'pageview');

// Setup a listener to track Add to Homescreen events.
window.addEventListener('beforeinstallprompt', e => {
  e.userChoice.then(choiceResult => {
    ga('send', 'event', 'A2H', choiceResult.outcome);      
  });
});
/* eslint-enable */
