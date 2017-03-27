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

import PwaCard from './pwa-card';
import SignInOnlineAwareButton from './signin-online-aware-btn';

export default class ClientTransition {

 /**
  * * Setup client side transtions, needs to be called once.
  */
  static setup() {
    ClientTransition.rewriteOnClicks();
    // handles backclicks/backlinks
    window.onpopstate = _ => {
      let main = document.getElementsByTagName('main')[0];
      ClientTransition.fetchInnerContent(main,
        ClientTransition.contentOnlyUrl(window.location.href))
        .then(_ => {
          ClientTransition.rewriteOnClicks();
        });
    };
  }

  static contentOnlyUrl(url) {
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'contentOnly=true';
  }

 /**
  * Fetches inner html content for client side transitions.
  */
  static fetchInnerContent(element, newContentUrl) {
    ClientTransition.headerVisualChanges(newContentUrl);
    return fetch(newContentUrl)
      .then(response => {
        return response.text();
      }).then(html => {
        window.scrollTo(0, 0);
        element.innerHTML = html;
        element.style.transition = 'opacity 0.1s ease-in-out';
        element.style.opacity = 1;
      });
  }

 /**
  * Rewrites links with gulliver-content-only class to trigger client
  * side transitions.
  */
  static newOnClick(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const main = document.getElementsByTagName('main')[0];
    let url = element.getAttribute('href');

    // only transition if click is different from current location
    if (!window.location.href.endsWith(url)) {
      const cardPwas = document.querySelectorAll('.card-pwa');
      for (const card of cardPwas) {
        // hide other cards quicker than clicked card
        if (card.href !== element.href) {
          card.style.transition = 'opacity .1s ease-out';
          card.style.opacity = 0.3;
        }
      }

      ClientTransition.fetchInnerContent(main, ClientTransition.contentOnlyUrl(url))
        .then(_ => {
          window.history.pushState(window.location.href, 'PWA Directory', url);
          ClientTransition.rewriteOnClicks();
        });
    }
  }

 /**
  * Shows/hides content in the header according to location.
  */
  static headerVisualChanges(newUrl) {
    if (newUrl.includes('/pwas/add')) {
      // show Submit PWA subtitle
      document.querySelector('div#subtitle').classList.remove('hidden');
    } else {
      document.querySelector('div#subtitle').classList.add('hidden');
    }
    if (newUrl.includes('/pwas/')) {
      // show backlink
      document.querySelector('a#newest').classList.add('hidden');
      document.querySelector('a#score').classList.add('hidden');
      document.querySelector('a#backlink').classList.remove('hidden');
    } else {
      // set active tab
      if (newUrl.includes('score')) {
        document.querySelector('a#score').classList.add('activetab');
        document.querySelector('a#newest').classList.remove('activetab');
      } else {
        document.querySelector('a#score').classList.remove('activetab');
        document.querySelector('a#newest').classList.add('activetab');
      }
      // show tabs
      document.querySelector('a#newest').classList.remove('hidden');
      document.querySelector('a#score').classList.remove('hidden');
      document.querySelector('a#backlink').classList.add('hidden');
    }
  }

 /**
  * Rewrites links for client side transitions,
  * Needs to be called everytime the page/body changes.
  */
  static rewriteOnClicks() {
    SignInOnlineAwareButton.setup('#pwaSubmit, #pwaAdd');
    PwaCard.setup('.gulliver-online-aware');
    const contentOnlyElements = document.getElementsByClassName('gulliver-content-only');
    for (const element of contentOnlyElements) {
      if (!element.dataset.rewroteClick) {
        element.dataset.rewroteClick = true;
        element.addEventListener('click', ClientTransition.newOnClick);
      }
      element.dispatchEvent(new CustomEvent('change'));
    }
  }
}
