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

/* eslint-env serviceworker, browser */
/* global firebase */
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-messaging.js');

const configUrl = '/messaging-config.json';
caches.match(configUrl)
  .then(response => response || fetch(configUrl))
  .then(response => response.json())
  .then(config => {
    firebase.initializeApp({
      messagingSenderId: config.firebase_msg_sender_id
    });
    const messaging = firebase.messaging();
    messaging.setBackgroundMessageHandler(_ => {
      return self.registration.showNotification();
    });
  });
