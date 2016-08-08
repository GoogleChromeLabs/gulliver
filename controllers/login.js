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

const express = require('express');
const bodyParser = require('body-parser');
const config = require('../config/config');

const router = express.Router(); // eslint-disable-line new-cap

const CLIENT_ID = config.get('CLIENT_ID');
const CLIENT_SECRET = config.get('CLIENT_SECRET');

/**
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {string} idToken
 * @return {Promise<GoogleLogin>}
 */
function verifyIdToken(clientId, clientSecret, idToken) {
  const authFactory = new (require('google-auth-library'))();
  const client = new authFactory.OAuth2(clientId, clientSecret);
  return new Promise((resolve, reject) => {
    client.verifyIdToken(idToken, clientId, (err, user) => {
      if (err) {
        reject(err);
      }
      resolve(user);
    });
  });
}

// Automatically parse request body as JSON
router.use(bodyParser.json());

// Handle middleware errors
router.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.stack);
  res.status(400).send({
    error: 'couldn\'t parse JSON'
  });
});

router.post('/', (req, res) => {
  const body = req.body;
  if (body && body.idToken) {
    verifyIdToken(CLIENT_ID, CLIENT_SECRET, body.idToken)
    .then(user => {
      console.log(user.getPayload());
      const payload = user.getPayload();
      res.json({
        email: payload.email
      });
    })
    .catch(err => {
      console.error(err.stack);
      res.status(400).send({
        error: 'idToken invalid'
      });
    });
  } else {
    res.status(400).send({
      error: 'idToken not found'
    });
  }
});

module.exports = router;
