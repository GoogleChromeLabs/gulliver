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

export class SignInButton {
  constructor(window, signIn, element) {
    this.signIn = signIn;
    this.element = element;
    this._window = window;
    this._setupEventListeners();
  }

  _setupEventListeners() {
    // Make SignIn button react to userchange events.
    this._window.addEventListener('userchange', () => {
      if (this.signIn.signedIn) {
        this.element.classList.add('hidden');
      } else {
        this.element.classList.remove('hidden');
      }
    });

    const clickListener = () => {
      if (!this.signIn.signedIn) {
        this.signIn.signIn();
      }
    };
    this.element.addEventListener('click', clickListener);
  }
}

export class SignOutButton {
  constructor(window, signIn, element) {
    this.signIn = signIn;
    this.element = element;
    this._window = window;
    this._setupEventListeners();
  }

  _setupEventListeners() {
    // Make SignOut button react to userchange events.
    this._window.addEventListener('userchange', () => {
      if (this.signIn.signedIn) {
        this.element.classList.remove('hidden');
      } else {
        this.element.classList.add('hidden');
      }
    });

    const clickListener = () => {
      if (this.signIn.signedIn) {
        this.signIn.signOut();
      }
    };
    this.element.addEventListener('click', clickListener);
  }
}
