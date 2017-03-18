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

export default class SignInButton {
  constructor(signIn, element) {
    this.signIn = signIn;
    this.authButton = element;
    this._setupEventListeners();
  }

  _setupEventListeners() {
    this.authButton.addEventListener('change', () => {
      this.authButton.innerText = this.authButton.dataset.signedin === 'true' ?
        'Logout' :
        'Login';
    });

    this.authButton.addEventListener('click', () => {
      if (this.authButton.dataset.signedin === 'true') {
        this.signIn.signOut();
      } else {
        this.signIn.signIn();
      }
    });
  }
}
