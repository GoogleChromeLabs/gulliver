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
    this.routes = new Set();
    this.shell = shell;
    this.window = window;
    this.container = container;

    // Update UI when back is pressed.
    this.window.addEventListener('popstate', this._updateContent.bind(this));
    this._control(this.window.document);
  }

  _findRoute(url) {
    for (let route of this.routes) {
      if (route.matches(url)) {
        console.log('Matched route ', route, ' for url ', url);
        return route;
      }
    }
    return null;
  }

  _updateContent() {
    const location = window.document.location.href;
    const page = this._findRoute(location);
    if (!page) {
      console.error('Url did not match any router: ', location);
      // TODO: navigate to 404?
      return;
    }

    page.transitionOut(this.container);
    page.getContent(location)
      .then(content => {
        this.container.innerHTML = content;
        this.shell.afterAttach(page);
        this.window.scrollTo(0, 0);
        page.transitionIn(this.container);
        this._control(this.container);
      })
      .catch(err => {
        console.error('Error getting page content for: ', location, ' Error: ', err);
      });
  }

  addRoute(route) {
    this.routes.add(route);
  }

  navigate(url) {
    console.log('Navigating To: ', url);
    this.window.history.pushState(null, null, url);
    this._updateContent();
  }

  _control(root) {
    root.querySelectorAll('a').forEach(element => {
      element.addEventListener('click', e => {
        // Link does not have an url.
        if (!e.currentTarget.href) {
          return false;
        }

        // Never catch links to external websites.
        if (!e.currentTarget.href.startsWith(this.window.location.origin)) {
          return false;
        }

        // Check if there's a route for this url.
        const page = this._findRoute(e.currentTarget.href);
        if (!page) {
          return false;
        }

        e.preventDefault();
        this.navigate(e.currentTarget.href);
      });
    });
  }
}
