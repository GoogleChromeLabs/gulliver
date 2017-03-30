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
import {authInit} from './gapi.es6.js';

export default class SignIn {
  init(config) {
    /* eslint-disable camelcase */
    const params = {
      scope: 'profile',
      client_id: config.client_id,
      fetch_basic_profile: false
    };
    /* eslint-enable camelcase */

    return authInit(params).then(auth => {
      this.auth = auth;
      this._setupUserChangeEvents(auth);
      return this;
    });
  }

  _setupUserChangeEvents(auth) {
    window.auth = auth; // TODO: Temporary Hack to Make 'ui/client-transition.js' work.
    // Fire 'userchange' event on page load (not just when status changes)
    window.dispatchEvent(new CustomEvent('userchange', {
      detail: auth.currentUser.get()
    }));

    // Fire 'userchange' event when status changes
    auth.currentUser.listen(user => {
      window.dispatchEvent(new CustomEvent('userchange', {
        detail: user
      }));
    });
  }

  signIn() {
    if (!this.auth) {
      console.log('Auth not ready!');
      return;
    }
    this.auth.signIn();
  }

  signOut() {
    if (!this.auth) {
      console.log('Auth not ready!');
      return;
    }
    this.auth.signOut();
  }

  /**
   * All elements with class .gulliver-signedin-aware will:
   * have a 'signedin' dataset property that reflects the current signed in state.
   * receive a 'change' event whenever the state changes.
   */
  static setupEventHandlers() {
    const body = document.querySelector('body');
    window.addEventListener('userchange', e => {
      const user = e.detail;
      if (user.isSignedIn()) {
        body.setAttribute('signedIn', 'true');
      } else {
        body.removeAttribute('signedIn');
      }
      const signedinAware = document.querySelectorAll('.gulliver-signedin-aware');
      for (const e of signedinAware) {
        e.dataset.signedin = JSON.stringify(user.isSignedIn());
        e.dataset.idToken = user.isSignedIn() ? user.getAuthResponse().id_token : '';
        e.dispatchEvent(new CustomEvent('change'));
      }
    });
  }
}
