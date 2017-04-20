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

import EventTarget from 'event-target-shim/dist/event-target-shim.min.js';

export default class Router extends EventTarget {
  constructor(window, container) {
    super();
    this._routes = [];
    this._window = window;
    this._container = container;
    this._document = window.document;

    // Update UI when back is pressed.
    this._window.addEventListener('popstate', this._updateContent.bind(this));
    this._takeOverAnchorLinks(this._window.document);
  }

  findRoute(url) {
    return this._routes.find(route => route.matches(url));
  }

  _updateContent() {
    const location = this._window.document.location.href;
    const route = this.findRoute(location);
    if (!route) {
      console.error('Url did not match any router: ', location);
      // TODO: navigate to 404?
      return;
    }

    route.transitionOut(this._container);
    route.retrieveContent(location)
      .then(content => {
        this._container.innerHTML = content;
        this._window.scrollTo(0, 0);
        route.transitionIn(this._container);
        this._takeOverAnchorLinks(this._container);
        route.onAttached();
        this._dispatchNavigateEvent(location, route);
      })
      .catch(err => {
        console.error('Error getting page content for: ', location, ' Error: ', err);
      });
  }

  addRoute(route) {
    this._routes.push(route);
  }

  navigate(url) {
    console.log('Navigating To: ', url);
    this._window.history.pushState(null, null, url);
    this._updateContent();
  }

  setupInitialRoute() {
    const body = this._document.querySelector('body');
    if (body.hasAttribute('data-empty-shell')) {
      this._updateContent();
      return;
    }
    const location = this._document.location.href;
    const route = this.findRoute(location);
    this._takeOverAnchorLinks(this._container);
    route.onAttached();
  }

  _dispatchNavigateEvent(url, route) {
    const event = this._document.createEvent('CustomEvent');
    const detail = {
      url: url,
      route: route
    };
    event.initCustomEvent(
        'navigate', /* bubbles */ false, /* cancelable */ false, detail);
    this.dispatchEvent(event);
  }

  _isNotLeftClickWithoutModifiers(e) {
    return e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
  }

  _takeOverAnchorLinks(root) {
    root.querySelectorAll('a').forEach(element => {
      element.addEventListener('click', e => {
        if (this._isNotLeftClickWithoutModifiers(e)) {
          return true;
        }

        // Link does not have an url.
        if (!e.currentTarget.href) {
          return true;
        }

        // Never catch links to external websites.
        if (!e.currentTarget.href.startsWith(this._window.location.origin)) {
          return true;
        }

        // Check if there's a route for this url.
        const route = this.findRoute(e.currentTarget.href);
        if (!route) {
          return true;
        }

        e.preventDefault();
        this.navigate(e.currentTarget.href);
        return false;
      });
    });
  }
}
