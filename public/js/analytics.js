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

export default class Analytics {
  constructor(navigator, window, config) {
    this.navigator = navigator;
    this.window = window;
    this.config = config;
    this._init();
    this._setupA2HTracking();
  }

  _init() {
    // Setup Tracking if analytics is not loaded yet.
    if (!this.window.ga) {
      this.window.ga = (...args) => {
        (this.window.ga.q = this.window.ga.q || []).push(args);
      };
    }

    this.window.ga('create', this.config.ga_id, 'auto');
    this.window.ga('set', 'transport', 'beacon');
  }

  /**
   * Setup a listener to track Add to Homescreen events.
   */
  _setupA2HTracking() {
    this.window.addEventListener('beforeinstallprompt', e => {
      e.userChoice.then(choiceResult => {
        this.window.ga('send', 'event', 'A2H', choiceResult.outcome);
      });
    });
  }

  trackPageView(url) {
    this.window.ga('set', 'page', url);
    this.window.ga('set', 'dimension1', this.navigator.onLine);
    this.window.ga('send', 'pageview');
  }
}
