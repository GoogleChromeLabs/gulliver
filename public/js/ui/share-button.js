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

export class ShareButton {
  constructor(window, element, nameElement) {
    this.element = element;
    this._nameElement = nameElement;
    this._window = window;
    this._init();
  }

  _init() {
    if (this._window.navigator.share) {
      this._setupEventListeners();
    } else {
      this.element.disabled = true;
    }
  }

  _setupEventListeners() {
    const clickListener = () => {
      this.share();
    };
    this.element.addEventListener('click', clickListener);
  }

  _getTitle() {
    const pwaName = this._window.document.querySelector('#pwa-name');
    if (!pwaName) {
      return 'PWA Directory';
    }
    return pwaName.innerText.trim();
  }

  share() {
    if (!this._window.navigator.share) {
      return;
    }

    const title = this._getTitle();
    this._window.navigator.share({
      title,
      url: this._window.location.href
    }).catch(err => {
      console.log(`Share failed, reason: ${err}`);
    });
  }
}
