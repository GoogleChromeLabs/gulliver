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

/*
 * Generate gulliver.js from this file via `npm prestart`. (`npm start` will run
 * `prestart` automatically.)
 */

/* eslint-env browser */

class SearchButton {
 /**
  * Setup/configure search button
  */
  setupSearchElements(router) {
    const eventHandler = event => {
      event.preventDefault();
      const searchValue = document.querySelector('#search-input').value;
      if (searchValue.length === 0) {
        router.navigate('/');
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        // Only navigate if the search query changes
        if (searchValue !== urlParams.get('query')) {
          router.navigate('/pwas/search?query=' + searchValue);
        }
        document.querySelector('#search-input').blur();
      }
    };
    document.querySelector('#search').addEventListener('submit', eventHandler);
  }
}

export default new SearchButton();
