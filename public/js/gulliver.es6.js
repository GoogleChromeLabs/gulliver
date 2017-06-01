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
import {LoaderTransitionStrategy} from './routing/transitions';
import PwaForm from './pwa-form';
import Chart from './chart';
import SearchInput from './search-input';

const CHART_BASE_URLS = {
  lighthouse: '/api/lighthouse/graph/PWAID',
  psi: 'https://web-performance-dot-pwa-directory.appspot.com/pagespeedreport/PWAID?graph=true',
  wpt: 'https://web-performance-dot-pwa-directory.appspot.com/webpagetestreport/PWAID?graph=true'
};

class Gulliver {
  constructor() {
    this.config = Config.from(document.querySelector('#config'));
    this.shell = new Shell(document);
    this.router = new Router(window, document.querySelector('main'));
    this.offlineSupport = new OfflineSupport(window, this.router);
    this._setupRoutes();
    this.setupBacklink();
    this.setupServiceWorker();
    this.setupMessaging();
    SearchInput.setupSearchElements(this.router);

    // Setup SignIn
    this.signIn = new SignIn(window, this.config);
    this.signInButton = new SignInButton(this.signIn, document.querySelector('#auth-button'));

    // Setup Analytics
    this.analytics = new Analytics(window, this.config);
    this.analytics.trackPageView(window.location.href);
    this.router.addEventListener('navigate', e => {
      this.analytics.trackPageView(e.detail.url);
      this.shell.onRouteChange(e.detail.route);
      this.offlineSupport.markAsCached(document.querySelectorAll('.offline-aware'));
    });
  }

  _addRoute(regexp, transitionStrategy, onRouteAttached, shellState) {
    const route = new Route(regexp, transitionStrategy, onRouteAttached);
    this.shell.setStateForRoute(route, shellState);
    this.router.addRoute(route);
  }

  _setupRoutes() {
    const transitionStrategy = new LoaderTransitionStrategy(window);
    // Route for `/pwas/add`.
    const setupPwaForm = () => {
      const pwaForm = new PwaForm(window, this.signIn);
      pwaForm.setup();
    };

    // Link search-input value to search query paramter
    const setupSearchInput = () => {
      const urlParams = new URLSearchParams(window.location.search);
      document.querySelector('#search-input').value = urlParams.get('query');
    };

    this._addRoute(/\/pwas\/add/, transitionStrategy, [setupPwaForm, setupSearchInput], {
      showTabs: false,
      backlink: true,
      subtitle: true,
      search: true
    });

    const setupCharts = () => {
      const generateChartConfig = chartElement => {
        const pwaId = chartElement.getAttribute('pwa');
        const type = chartElement.getAttribute('type');
        const url = CHART_BASE_URLS[type].replace('PWAID', pwaId);
        return {chartElement: chartElement, url: url};
      };
      const charts = Array.from(document.getElementsByClassName('chart'));
      charts.forEach(chart => new Chart(generateChartConfig(chart)).load());
    };

    // Route for `/pwas/[id]`.
    this._addRoute(/\/pwas\/(\d+)/, transitionStrategy, [setupCharts, setupSearchInput], {
      showTabs: false,
      backlink: true,
      subtitle: true,
      search: true
    });

    // Route for `/?search=`.
    this._addRoute(/\/pwas\/search\?query/, transitionStrategy, setupSearchInput, {
      showTabs: false,
      backlink: true,
      subtitle: true,
      search: true
    });

    // Route for `/?sort=score`.
    this._addRoute(/\/\?.*sort=score/, transitionStrategy, setupSearchInput, {
      showTabs: true,
      backlink: false,
      subtitle: true,
      search: true,
      currentTab: 'score'
    });

    // Route for `/`.
    this._addRoute(/.+/, transitionStrategy, setupSearchInput, {
      showTabs: true,
      backlink: false,
      subtitle: true,
      search: true,
      currentTab: 'newest'
    });

    this.router.setupInitialRoute();
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
