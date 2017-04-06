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

import Messaging from './messaging';
import NotificationCheckbox from './ui/notification-checkbox';
import Config from './gulliver-config';
import SignIn from './signin';
import OfflineSupport from './offline-support';
import SignInButton from './ui/signin-button';
import Analytics from './analytics';
import Router from './routing/router';
import Route from './routing/route';
import Shell from './shell';
import FadeInOutTransitionStrategy from './routing/transitions';

class Gulliver {
  constructor() {
    this.config = Config.from(document.querySelector('#config'));
    this.shell = new Shell(document);
    this.router = new Router(window, this.shell, document.querySelector('main'));
    this.offlineSupport = new OfflineSupport(window, this.router);
    this._setupRoutes();
    const currentPage = this.router.findRoute(window.location.href);
    if (currentPage) {
      currentPage.onAttached();
    }
    this.setupBacklink();
    this.setupServiceWorker();
    this.setupMessaging();

    // Setup SignIn
    this.signIn = new SignIn(window, this.config);
    this.signInButton = new SignInButton(this.signIn, document.querySelector('#auth-button'));

    // Setup Analytics
    this.analytics = new Analytics(window, this.config);
    this.analytics.trackPageView(window.location.href);
  }

  _addRoute(regexp, transitionStrategy, shellState, onAttached) {
    const route = new Route(regexp, transitionStrategy, onAttached);
    this.shell.addState(route, shellState);
    this.router.addRoute(route);
  }

  _setupRoutes() {
    const fadeInOutTransitionStrategy = new FadeInOutTransitionStrategy();
    // Route for `/pwas/add`.
    this._addRoute(/\/pwas\/add/, fadeInOutTransitionStrategy, {
      showTabs: false,
      backlink: true,
      subtitle: true
    }, () => {
      import('./pwa-form').then(module => {      
        const pwaForm = new module.PwaForm(window);
        pwaForm.setup();
      });          
    });

    // Route for `/pwas/[id]`.
    this._addRoute(/\/pwas\/(\d+)/, fadeInOutTransitionStrategy, {
      showTabs: false,
      backlink: true,
      subtitle: false
    }, () => {
      import('./lighthouse-chart').then(module => {      
        const lighthouseChart = new module.LighthouseChart();
        lighthouseChart.load();
      });          
    });

    // Route for `/?sort=score`.
    this._addRoute(/\/\?.*sort=score/, fadeInOutTransitionStrategy, {
      showTabs: true,
      backlink: false,
      subtitle: false,
      currentTab: 'score'
    });

    // Route for `/`.
    this._addRoute(/.+/, fadeInOutTransitionStrategy, {
      showTabs: true,
      backlink: false,
      subtitle: false,
      currentTab: 'newest'
    });
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

  /**
   * Setup/configure Firebase Cloud Messaging.
   */
  setupMessaging() {
    const NEW_APPS_TOPIC = 'new-apps';
    const firebaseMsgSenderId = this.config.firebase_msg_sender_id;
    const checkbox = document.getElementById('notifications');
    const messaging = new Messaging(firebaseMsgSenderId);
    // eslint-disable-next-line no-unused-vars
    const notificationCheckbox = new NotificationCheckbox(messaging, checkbox, NEW_APPS_TOPIC);
  }

 /**
  * Setup/configure header section-title's backlink chevron
  */
  setupBacklink() {
    document.querySelector('a#backlink').addEventListener('click', _ => {
      window.history.back();
    });
  }
}

window.gulliver = new Gulliver();
