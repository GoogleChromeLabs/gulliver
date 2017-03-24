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

export default class PwaCard {
  static setup(querySelector) {
    const changeListener = e => {
      const element = e.target;
      if (JSON.parse(element.dataset.online)) {
        // Online, make element active
        element.style.transition = 'opacity .5s ease-in-out';
        element.style.opacity = 1;
        element.onclick = null;
        return;
      }
      const href = element.getAttribute('href');
      if (href) {
        fetch(href, {method: 'HEAD'}).then(r => {
          if (r.status === 200) {
            // Available in cache, allow click
            element.style.transition = 'opacity .5s ease-in-out';
            element.style.opacity = 1;
            element.onclick = null;
          } else {
            // Not cached, prevent click
            element.style.transition = 'opacity .5s ease-in-out';
            element.style.opacity = 0.5;
            element.onclick = f => f.preventDefault();
          }
        });
      }
    };

    document.querySelectorAll(querySelector)
      .forEach(element => {
        element.addEventListener('change', changeListener);
      });
  }
}
