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
import Offline from '../offline';

const DISABLED_CARD_CLASS = 'card-pwa_disabled';

export default class PwaCard {
  static setup(querySelector) {
    const changeListener = event => {
      const element = event.target;
      element.addEventListener('click', ClientTransition.newOnClick);
      Offline.isAvailable(element.href)
        .then(available => {
          if (available) {
            element.classList.remove(DISABLED_CARD_CLASS);
            return;
          }
          element.classList.add(DISABLED_CARD_CLASS);
        });
    };

    document.querySelectorAll(querySelector)
      .forEach(element => {
        element.addEventListener('change', changeListener);
      });
  }
}
