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

export default class Offline {
  /**
   * All elements with class .gulliver-online-aware will:
   * have an 'online' dataset property that reflects the current online state.
   * receive a 'change' event whenever the state changes.
   */
  static setupEventhandlers() {
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
  }

  /**
   * Check if a Url is navigable.
   * @param url the url to be checke for availability
   * @returns true if the user is online or the URL is cached
   */
  static isAvailable(href) {
    if (!href || window.navigator.onLine) return Promise.resolve(true);
    return caches.match(href)
      .then(response => {
        if (response.status === 200) {
          return true;
        }
        return false;
      })
      .catch(() => {
        return false;
      });
  }
}
