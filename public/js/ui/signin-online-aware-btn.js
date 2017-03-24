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

export default class SignInOnlineAwareButton {
  static setup(querySelector) {
    const changeListener = e => {
      const element = e.target;
      const online = element.dataset.online === 'true';
      const signedin = element.dataset.signedin === 'true';
      if (online && signedin) {
        element.style.opacity = 1;
        element.onclick = null;
      } else {
        element.style.opacity = 0.5;
        element.onclick = f => f.preventDefault();
      }
    };

    document.querySelectorAll(querySelector)
      .forEach(element => {
        element.addEventListener('change', changeListener);
      });
  }
}
