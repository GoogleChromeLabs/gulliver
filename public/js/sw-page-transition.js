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

'use strict';

/* eslint-env serviceworker, browser */

const DEFAULT_CACHE_NAME = 'sw-page-transitions-cache';

/* eslint-disable no-unused-vars */

const transition = (function() {
/* eslint-enable no-unused-vars */

  /**
   * Controls lifecycle of page transitions: fetch, cache and match.
   */
  class SwPageTransitionController {

    constructor() {
      this._cacheName = DEFAULT_CACHE_NAME;
      this._transitionPageMatchers = [];
      self.addEventListener('message', this.onMessageReceived.bind(this));
      this._pagesBeingLoaded = [];
      this._debug = true;
    }

    /**
     * Register a page transition matcher.
     *
     * @param {String} cacheName cache name for page transitions
     * @return {SwPageTransitionController} return controller
     */
    cacheName(name) {
      this._cacheName = name;
      return this;
    }

    /**
     * Register a page transition matcher.
     *
     * @param {RegExp} regex matching an URL to the transition page
     * @param {String} url of the transition page
     * @return {SwPageTransitionController} return controller
     */
    registerPageTransition(regExp, url) {
      this._transitionPageMatchers.push([regExp, url]);
      return this;
    }

    /**
     * Returns the cached response or the transition page. Triggers a background
     * fetch of the requested resource.
     *
     * @param {Request} request a request
     * @return {Promise<Response>} null if there is no transition page or the
     * request is not a navigation request. Otherwise the transition page or
     * the cached response.
     */
    fetchWithPageTransition(request) {
      if (request.mode !== 'navigate') {
        return Promise.resolve(null);
      }
      this.log('fetchWithPageTransition: fetch ' + request.url);
      if (this._pagesBeingLoaded.includes(request.url)) {
        this.log('fetchWithPageTransition: returning cached page ' + request.url);
        return caches.match(request).then(response => {
          const index = this._pagesBeingLoaded.indexOf(request.url);
          this._pagesBeingLoaded.splice(index, 1);
          return response;
        });
      }
      this._pagesBeingLoaded.push(request.url);
      const transitionPage = this.findTransitionPage(request);
      // Return null if there is no transition page registered for this request.
      if (!transitionPage) {
        this.log('fetchWithPageTransition: no transition page found');
        return Promise.resolve(null);
      }
      // Returned the transition page
      return this.fetchTransitionPage(request, transitionPage);
    }

    /**
     * Returns the transition page and adds the requested page to the cache.
     *
     * @param {Request} request
     * @return {Promise<Response>} the fetched response
     *
     * @private
     */
    fetchTransitionPage(request, transitionPage) {
      // Return the transition page with the request URL
      // returns null if transition page not cached.
      return caches.match(new Request(transitionPage))
        .then(response => {
          if (!response) {
            this.log('fetchTransitionPage: loading page not found in cache');
            return Promise.resolve(null);
          }
          this.log('fetchTransitionPage: return transition page');
          // Fetch the actual page and notify transition page when it's ready
          this.openCache()
            .then(cache => cache.add(request)
              .then(() => this.notifyListeners(request.url))
              .catch(() => {
                // offline
                console.log('handling offline case');
                this.notifyListeners(request.url);
              })
            );
          return Promise.resolve(response);
        });
    }

    /**
     * Finds a transition page for the given request.
     *
     * @param {Request} request
     * @return {String} transition page path or null if no transition page exists
     *
     * @private
     */
    findTransitionPage(request) {
      for (let mapping of this._transitionPageMatchers) {
        if (request.url.match(mapping[0])) {
          this.log('fetchWithPageTransition: found transition page: ' + mapping[1]);
          return mapping[1];
        }
      }
      this.log('fetchWithPageTransition: found no transition page for "' + request.url + '"');
      return null;
    }

    /**
     * Adds all transition pages to the cache.
     *
     * @private
     */
    onInstall(event) {
      console.log('sw-page-transition: onInstall ' + this._cacheName);
      const transitionPages = this._transitionPageMatchers.map(p => p[1]);
      this.log('onInstall: caching ' + transitionPages.join(' ,'));
      event.waitUntil(
        this.openCache().then(cache => cache.addAll(transitionPages))
      );
    }

    /**
     * Tell all clients about the new page in the cache. We use a broadcast to
     * avoid storing currently active transition pages.
     *
     * @param {String} url
     *
     * @private
     */
    notifyListeners(url) {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          const message = {
            type: 'fetch',
            url: url
          };
          client.postMessage(message);
        });
      });
    }

    /**
     * Make sure that transition pages get notified if the page
     * is already in the cache when the page is loaded.
     *
     * @private
     */
    onMessageReceived(event) {
      const message = event.data;
      if (message.type === 'waiting') {
        const url = message.url;
        caches.match(new Request(url))
          .then(response => {
            if (response) {
              this.notifyListeners(url);
            }
          });
      }
    }

    /**
     * Open the cache.
     *
     * @return {Promise<Cache>} the cache
     *
     * @private
     */
    openCache() {
      return caches.open(this._cacheName);
    }

    /**
     * Logs the string if in debug mode.
     *
     * @private
     */
    log(string) {
      if (!this._debug) {
        return;
      }
      console.log('[sw-page-transition] ' + string);
    }
  }

  return new SwPageTransitionController();
})();

