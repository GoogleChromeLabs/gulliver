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

    this._idTokenInput = this._pwaForm.querySelector('#idToken');
    if (!this._idTokenInput) {
      console.log('%c#idToken not found.', 'color:red');
    }

    this._submitButton = this._pwaForm.querySelector('#pwaSubmit');
    if (!this._idTokenInput) {
      console.log('%c#pwaSubmit not found.', 'color:red');
    }

    this._updateFormFields();
    this._setupListeners();
  }

  _updateFormFields() {
    this._idTokenInput.setAttribute('value', this._signIn.signedIn ? this._signIn.idToken : '');
  }

  /**
   * Sets up a listeners for events.
   */
  _setupListeners() {
    // Setup listener for the userchange event.
    this._window.addEventListener('userchange', this._updateFormFields.bind(this));

    // Disable the save button after been clicked to avoid double submission.
    this._submitButton.addEventListener('click', _ => {
      this._submitButton.disabled = true;
      this._pwaForm.submit();
    });
  }
}
