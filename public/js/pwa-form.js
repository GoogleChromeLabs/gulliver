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

export class PwaForm {
  constructor(window) {
    this.window = window;
    this.signIn = window.gulliver.signIn;
  }

  setup() {
    console.log('Setting up PWA Form');
    this.pwaForm = document.querySelector('#pwaForm');
    if (!this.pwaForm) {
      console.log('%c#pwaForm not found.', 'color:red');
      return;
    }

    this.idTokenInput = this.pwaForm.querySelector('#idToken');
    if (!this.idTokenInput) {
      console.log('%c#idToken not found.', 'color:red');
    }

    this.submitButton = this.pwaForm.querySelector('#pwaSubmit');
    if (!this.idTokenInput) {
      console.log('%c#pwaSubmit not found.', 'color:red');
    }

    this._updateFormFields();
    this._setupListeners();
  }

  _updateFormFields() {
    this.idTokenInput.setAttribute('value', this.signIn.signedIn ? this.signIn.idToken : '');
  }

  /**
   * Sets up a listeners for events.
   */
  _setupListeners() {
    // Setup listener for the userchange event.
    window.addEventListener('userchange', this._updateFormFields.bind(this));

    // Disable the save button after been clicked to avoid double submission.
    this.submitButton.addEventListener('click', _ => {
      this.submitButton.disabled = true;
      this.pwaForm.submit();
    });
  }
}
