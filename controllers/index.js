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

const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap
const config = require('../config/config');

// API
router.use('/api', require('./api'));

// Tasks
router.use('/tasks', require('./tasks'));

// PWAs
router.use('/pwas', require('./pwa'));

router.get('/', (req, res) => {
  req.url = '/pwas';
  router.handle(req, res);
});

// /.shell hosts app shell dependencies
router.use('/.shell', require('./shell'));

// Make node_modules/sw-toolbox available at /sw-toolbox
router.use('/sw-toolbox', express.static('node_modules/sw-toolbox'));
// Make node_modules/sw-offline-google-analytics available at /sw-offline-google-analytics
router.use(
  '/sw-offline-google-analytics',
  express.static('node_modules/sw-offline-google-analytics')
);

/**
 * This route is used to send config.json to firebase-messaging-sw.js
 */
router.get('/messaging-config.json', (req, res) => {
  // eslint-disable-next-line camelcase
  res.json({firebase_msg_sender_id: config.get('FIREBASE_MSG_SENDER_ID')});
});

module.exports = router;
