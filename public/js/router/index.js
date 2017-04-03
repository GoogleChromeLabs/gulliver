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

import Shell from './shell';
import Page from './page';

export default class Router {
  constructor(window, container) {
    this.routeMap = new Map();
    this.shell = new Shell(window.document);
    this.window = window;
    this.container = container;
    this.addRoute(/\/pwas\/add\//, new Page('pwa-add'));
    this.addRoute(/\/pwas\/(\d+)/, new Page('pwa-detail'));
    this.addRoute(/\/\?.*sort=score/, new Page('list-topscores'));
    this.addRoute(/.+/, new Page('list-newest'));

    // Update UI when back is pressed.
    this.window.addEventListener('popstate', this._update.bind(this));
    this.control(this.window.document);
  }

  _findPage(url) {
    const routes = Array.from(this.routeMap.keys());
    const route = routes.find(key => key.test(url));
    console.log('Matched route ', route, ' for url ', url);
    return this.routeMap.get(route);
  }

  _update() {
    const location = window.document.location.href;
    const page = this._findPage(location);
    console.log('Page Type: ', page.type);
    if (!page) {
      console.error('Url did not match any router: ', location);
      // TODO: navigate to 404?
      return;
    }
    const contentUrl = page.getContentOnlyUrl(location);
    fetch(contentUrl)
      .then(response => response.text())
      .then(html => {
        this.container.innerHTML = html;
        this.shell.afterAttach(page.type);
        this.control(this.container);
      });
  }

  addRoute(regexp, page) {
    this.routeMap.set(regexp, page);
  }

  navigate(url) {
    console.log('Navigating To: ', url);
    this.window.history.pushState(null, null, url);
    this._update();
  }

  control(root) {
    root.querySelectorAll('a').forEach(element => {
      element.addEventListener('click', e => {
        e.preventDefault();
        this.navigate(e.target.href);
      });
    });
  }
}
