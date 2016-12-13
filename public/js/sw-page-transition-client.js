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

class PageTransitionClient {

  constructor(url, serviceWorker) {
    this.originalUrl = url;
    this.urlWithoutFragment = this.removeHash(this.originalUrl);
    this.serviceWorker = serviceWorker;
    this.debug = false;
  }

  /**
   * Register client with serviceworker.
   *
   * @private
   */
  register() {
    this.log('page transition client registered for ' + this.urlWithoutFragment);
    // Register our serviceworker and let it know that we're waiting
    // for a fetch result
    if (this.serviceWorker && this.serviceWorker.controller) {
      this.registerLoadingPage();
      this.serviceWorker.addEventListener('controllerchange', () => {
        // re-register in case a new serviceworker gets installed and claims the page
        this.registerLoadingPage();
      });
    } else {
      // Redirect to target page if there is no serviceworker. This should never
      // happen as this page is only fetched by service workers.
      this.loadTargetPage();
    }
  }

  /**
   * Tell serviceworker we're waiting for a page to load.
   *
   * @private
   */
  registerLoadingPage() {
    this.serviceWorker.addEventListener('message', this.handleMessage.bind(this));
    this.serviceWorker.controller.postMessage({
      type: 'waiting',
      url: this.urlWithoutFragment
    });
  }

  /**
   * Redirect to target page (which should be cached).
   *
   * @private
   */
  loadTargetPage() {
    if (this.debug) {
      return;
    }
    window.location.href = this.originalUrl;
    location.reload();
  }

  /**
   * Wait for serviceworker to signal that the target page has been cached.
   *
   * @param evt serviceworker message event
   *
   * @private
   */
  handleMessage(evt) {
    const message = evt.data;
    if (message.type === 'fetch' && message.url === this.urlWithoutFragment) {
      this.log('page transition client: received fetch signal for ' + message.url);
      this.serviceWorker.removeEventListener('message', this.handleMessage);
      this.loadTargetPage();
    }
  }

  /**
   * Removes '#' and anything that comes after.
   *
   * @param {String} url an URL
   * @return {String}
   *
   * @private
   */
  removeHash(url) {
    const indexOfHash = url.indexOf('#');
    if (indexOfHash === -1) {
      return url;
    }
    return url.substring(0, indexOfHash);
  }

  log(string) {
    if (this.debug) {
      console.log(string);
    }
  }

}

// register page transition client
const pageTransitionClient = new PageTransitionClient(
  window.location.href, navigator.serviceWorker);
pageTransitionClient.register();
