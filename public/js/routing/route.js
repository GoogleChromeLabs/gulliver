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

import 'url-polyfill/url-polyfill';

export default class Route {
  constructor(matchRegex, transitionStrategy, onAttached) {
    this._transitionStrategy = transitionStrategy;
    this._matchRegex = matchRegex;
    this._onAttached = onAttached;
  }

  matches(url) {
    return this._matchRegex.test(url);
  }

  retrieveContent(url) {
    const contentUrl = this.getContentOnlyUrl(url);
    return fetch(contentUrl)
      .then(response => response.text());
  }

  transitionOut(container) {
    this._transitionStrategy.transitionOut(container);
  }

  transitionIn(container) {
    this._transitionStrategy.transitionIn(container);
  }

  onAttached() {
    console.log('onAttached');
    return this._onAttached && this._onAttached();
  }

  getContentOnlyUrl(url) {
    const u = new URL(url);
    u.searchParams.append('contentOnly', 'true');
    return u.toString();
  }
}
