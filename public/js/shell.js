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

export default class Shell {
  constructor(document) {
    this.document = document;
    this.backlink = document.querySelector('#backlink');
    this.tabs = document.querySelectorAll('#newest, #score');
    this.subtitle = document.querySelector('#subtitle');
    this.states = new Map();
  }

  addState(page, state) {
    this.states.set(page, state);
  }

  _showElement(element, visible) {
    if (visible) {
      element.classList.remove('hidden');
      return;
    }
    element.classList.add('hidden');
  }

  _updateTab(tab, options) {
    this._showElement(tab, options.showTabs);
    if (!options.currentTab) {
      return;
    }

    if (tab.id === options.currentTab) {
      tab.classList.add('activetab');
      return;
    }
    tab.classList.remove('activetab');
  }

  afterAttach(page) {
    const options = this.states.get(page);
    this._showElement(this.backlink, options.backlink);
    this._showElement(this.subtitle, options.subtitle);
    this.tabs.forEach(tab => this._updateTab(tab, options));
  }
}
