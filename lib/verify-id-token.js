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

const config = require('../config/config');
const CLIENT_ID = config.get('CLIENT_ID');
const CLIENT_SECRET = config.get('CLIENT_SECRET');

/**
 * @param {string} idToken
 * @return {Promise<GoogleLogin>}
 */
exports.verifyIdToken = function(idToken) {
  const {OAuth2Client} = require('google-auth-library');
  const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
  return new Promise((resolve, reject) => {
    client.verifyIdToken({idToken, CLIENT_ID}, (err, googleLogin) => {
      if (err) {
        reject(err);
      }
      resolve(googleLogin);
    });
  });
};
