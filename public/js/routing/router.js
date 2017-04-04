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

export default class Router {
  constructor(window, shell, container) {
    this._routes = [];
    this._shell = shell;
    this._window = window;
    this._container = container;

    // Update UI when back is pressed.
    this._window.addEventListener('popstate', this._updateContent.bind(this));
    this._takeOverAnchorLinks(this._window.document);
  }

  findRoute(url) {
    return this._routes.find(route => route.matches(url));
  }

  _updateContent() {
    const location = this._window.document.location.href;
    const page = this.findRoute(location);
    if (!page) {
      console.error('Url did not match any router: ', location);
      // TODO: navigate to 404?
      return;
    }

    page.transitionOut(this._container);
    page.retrieveContent(location)
      .then(content => {
        this._container.innerHTML = content;
        this._shell.afterAttach(page);
        this._window.scrollTo(0, 0);
        page.transitionIn(this._container);
        this._takeOverAnchorLinks(this._container);
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

  _takeOverAnchorLinks(root) {
    root.querySelectorAll('a').forEach(element => {
      element.addEventListener('click', e => {
        // Link does not have an url.
        if (!e.currentTarget.href) {
          return true;
        }

        // Never catch links to external websites.
        if (!e.currentTarget.href.startsWith(this._window.location.origin)) {
          return true;
        }

        // Check if there's a route for this url.
        const page = this.findRoute(e.currentTarget.href);
        if (!page) {
          return true;
        }

        e.preventDefault();
        this.navigate(e.currentTarget.href);
        return false;
      });
    });
  }
}
