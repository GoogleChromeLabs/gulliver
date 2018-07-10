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

import Loader from './loader';

// SVG from https://svgsilh.com/svg/2026645.svg
const SVG = '<svg version="1" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 1280 1280"><path d="M610 .6c-46.3 3.1-74.1 6.8-109 14.5-86.5 19.1-171.8 58.2-243 111.4C117.6 231.5 26.3 387.8 5.1 560 1.9 585.6 1 598.4.3 626.5c-2.1 90.7 15.1 180.3 50.9 264.7 7.4 17.5 26.2 54.8 35.8 71.3 92.4 157.8 248.9 269.6 427 305 152.2 30.3 308.8 5 442.6-71.4 37.7-21.5 72.2-46 104.9-74.5 15.2-13.2 45.3-43.4 59.2-59.2 118.4-135.1 174.3-310.7 155.8-489.3-6.7-63.9-22.5-125-48-185.1-7.2-16.8-26.1-54.4-35.5-70.5C1097.8 155 935.5 41.9 751 9.6c-35.2-6.2-62.4-8.6-103-9-17.9-.2-35-.2-38 0zM667.5 58C798 64.9 914.4 110.6 1015 194.4c17 14.2 52.3 49 66.9 66.1 69.1 80.8 115.1 178.7 132.6 282.3 20.4 120.4 2.3 244.7-51.5 353.7-29 58.8-63.9 107.3-111 154.6-34.1 34.2-64.9 58.8-104.4 83.4-78.2 48.9-163.6 77.3-258.6 86.1-25.2 2.4-72.8 2.4-98 0-99.3-9.1-187.6-39.5-268.5-92.4C212.2 1056.1 129.4 949.5 87.9 826c-41.4-123.4-40.8-253.5 1.6-376.7 22.7-66 57.7-127.6 104.9-184.3 15.6-18.9 52.1-55.3 71.1-71.1 59.8-49.7 122.7-84.6 195.4-108.4C526.1 64.2 599.4 54.4 667.5 58z"/><path d="M347.2 359L266 412.9l15.7 23.6c9 13.5 16.2 23.4 16.9 23.1.6-.2 24-15.6 52-34.2 28-18.5 64.2-42.5 80.4-53.2 16.2-10.7 29.6-19.6 29.8-19.7.5-.4-31-47.5-31.7-47.5-.3 0-37.2 24.3-81.9 54zM833 328.6c-8.4 13-14.9 23.9-14.4 24.3 3 2.7 164.7 107.2 165.4 106.9 1.1-.4 31.4-46.8 30.9-47.3-1.3-1.2-165.2-107.5-165.8-107.5-.4 0-7.6 10.6-16.1 23.6zM397.5 460.4c-19 4.7-33.9 19.5-39 38.7-1.9 6.9-1.9 19.9 0 26.8 4.5 16.9 18.4 31.7 35.1 37.2 33.8 11.2 69.5-14.5 69.7-50.1.1-9.7-1.7-16.8-6.2-25.5-7-13.6-21.1-24.3-35.9-27.4-6.8-1.4-17.3-1.3-23.7.3zM850.3 460.4c-18.5 4.7-33.2 19-38.7 37.6-1 3.3-1.7 9.1-1.7 14.5 0 15.1 4.1 25.2 14.8 36.5 16 17 40 21.5 61.2 11.5 13.6-6.5 25.7-21.3 29-35.5 1.5-6.6 1.3-19.7-.4-26.3-4.3-16.7-17.5-31-34-36.8-7.5-2.7-22.7-3.4-30.2-1.5zM610 808.6c-1.9.2-8 .9-13.5 1.4-51.4 5.4-104 21.4-157.5 48.2-19.8 9.9-53.2 28.8-57.2 32.5-1.6 1.4-1.7 4.7-1.7 35.5 0 26.4.2 33.9 1.2 33.5.6-.3 7.5-4.8 15.2-10.2 70.7-49 142.7-77.1 213.3-83.5 17.2-1.6 60.5-.8 76.2 1.5 71 10 137 38.6 211.1 91.4 1.9 1.3 1.9.7 1.9-33.5v-34.9l-2.8-1.6c-1.5-.9-8-4.8-14.4-8.7-47.6-29.1-101.5-51.4-149.8-62.2-33.6-7.5-48.6-9.1-86.5-9.5-17.6-.2-33.6-.1-35.5.1z"/></svg>';

export default class PwaForm {
  constructor(window, signIn) {
    this._window = window;
    this._signIn = signIn;
  }

  setup() {
    console.log('Setting up PWA Form');
    this._pwaForm = document.querySelector('#pwaForm');
    if (!this._pwaForm) {
      console.log('%c#pwaForm not found.', 'color:red');
      return;
    }

    this._manifestUrlInput = document.querySelector('#manifestUrl');
    if (!this._manifestUrlInput) {
      console.log('%c#manifestUrl input not found.', 'color:red');
      return;
    } 

    this._pageContainer = document.querySelector('.items');
    this._loadingTemplate = document.querySelector('#template-load-pwa').
        content.querySelector('a');
    this._setupListeners();
  }

   _addPwa(container, manifestUrl) {
      console.log(container);
      const icon = container.querySelector('.icon');
      const text = container.querySelector('.pwa-name');
      const loader = new Loader(icon);
      text.innerText = manifestUrl;
      loader.show();

      fetch('/api/pwa/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idToken: this._signIn.idToken,
          manifestUrl: manifestUrl
        })
      })
      .then(response => response.json())
      .then(json => {
        loader.hide();
        if(json.error) {
          loader.hide();
          text.innerText = `Error: ${json.error}`;
          icon.innerHTML = SVG;
          return;
        }
        text.innerText = json.name;
        icon.innerText = json.name[0];
        container.setAttribute('href', '/pwas/' + json.id);
        container.classList.remove('link-disabled');
        container.style['background-color'] = json.backgroundColor;
        icon.style['color'] = json.foregroundColor;
        text.style['color'] = json.foregroundColor;
      })
      .catch(err => {
        loader.hide();
        text.innerText = `Error: ${text.innerText}`;
        icon.innerHTML = SVG;
        console.log(err);
      })
  }

  /**
   * Sets up a listeners for events.
   */
  _setupListeners() {
    this._pwaForm.addEventListener('submit', event => {
      event.preventDefault();
      const newLoading = this._loadingTemplate.cloneNode(true);
      this._pageContainer.appendChild(newLoading);
      this._addPwa(newLoading, this._manifestUrlInput.value);
      this._pwaForm.reset();
      return false;
    });

    // Setup listener for the userchange event.
    this._window.addEventListener('userchange', () => {
      console.log(this._signIn.signedIn);
    });
  }
}
