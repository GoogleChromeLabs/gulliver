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

'use strict';

const fs = require('fs');
const template = require('lodash.template');
const config = require('./config/config');

const firebaseMsgSenderId = config.get('FIREBASE_MSG_SENDER_ID');

fs.readFile('./firebase-messaging-sw.tmpl', 'utf8', (error, data) => {
  if (error) {
    console.error('Error reading template: ', error);
    return;
  }

  const firebaseMessagingSwFileContent = template(data)({
    firebaseMsgSenderId: firebaseMsgSenderId
  });

  fs.writeFile('./public/firebase-messaging-sw.js', firebaseMessagingSwFileContent, err => {
    if (err) {
      console.log('Error Writing firebase-messaging-sw: ', err);
    }
  });
});
