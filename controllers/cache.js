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
const libCache = require('../lib/data-cache');

const CACHE_LIFETIME = 60 * 60 * 6; // 6 hours

/**
 * GET *
 *
 * Serves cached HTML or
 * overrides res.send to be able to cache rendered HTML before sending.
 */
router.get('*', (req, res, next) => {
  const url = req.originalUrl;
  libCache.get(url)
    .then(cachedHtml => {
      console.log('From cache: ' + url);
      res.send(cachedHtml);
    })
    .catch(_ => {
      // Overrides res.send to be able to cache before sending.
      res.sendResponse = res.send;
      res.send = body => {
        libCache.set(url, body, CACHE_LIFETIME)
          .then(_ => {
            libCache.storeCachedUrls(url);
            console.log('Stored in cache: ' + url);
          })
          .catch(_ => {
            console.log('Error setting cache for: ' + url);
          });
        res.sendResponse(body);
      };
      next();
    });
});

module.exports = router;
