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

import ClientTransition from './client-transition';

export default class PwaCard {
  static setup(querySelector) {
    const changeListener = event => {
      const element = event.target;

      const enableWhenOnline = (element => {
        element.style.transition = 'opacity .2s ease-in-out';
        element.style.opacity = 1;
        element.style.cursor = 'pointer';
        if (element.classList.contains('card-pwa')) {
          element.classList.add('box-shadow');
        }
        if (element.classList.contains('gulliver-content-only')) {
          element.addEventListener('click', ClientTransition.newOnClick);
        }
        element.onclick = null;
      });

      const disableWhenOffline = (element => {
        if (element.id !== 'title' && element.id !== 'subtitle') {
          element.style.transition = 'opacity .2s ease-in-out';
          element.style.opacity = 0.3;
          if (element.classList.contains('card-pwa')) {
            element.classList.remove('box-shadow');
          }
        }
        element.style.cursor = 'default';
        if (element.classList.contains('gulliver-content-only')) {
          element.removeEventListener('click', ClientTransition.newOnClick);
        }
        element.onclick = f => f.preventDefault();
      });

      if (window.navigator.onLine) {
        enableWhenOnline(element);
      } else {
        this.isAvailableInCache(element)
          .then(isAvailable => {
            if (isAvailable) {
              enableWhenOnline(element);
            } else {
              disableWhenOffline(element);
            }
          });
      }
    };

    document.querySelectorAll(querySelector)
      .forEach(element => {
        if (!element.dataset.onlineAwareEvent &&
            !element.classList.contains('offline-status')) {
          element.addEventListener('change', changeListener);
          element.dataset.onlineAwareEvent = true;
        }
      });
  }

  // Used to find out if content/page is available while offline
  static isAvailableInCache(element) {
    if (!element || !element.href) {
      return Promise.resolve(false);
    }
    const contentOnlyUrl = element.href +
      (element.href.indexOf('?') >= 0 ? '&' : '?') + 'contentOnly=true';
    return fetch(contentOnlyUrl, {method: 'HEAD'})
      .then(response => {
        return (response.status === 200);
      }).catch(_ => {
        return false;
      });
  }
}
