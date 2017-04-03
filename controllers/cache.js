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
const cache = require('../lib/data-cache');

const CACHE_LIFETIME = 60 * 60 * 6; // 6 hours
const PAGELIST_URLS = 'PAGELIST_URLS';

/**
 * GET *
 *
 * Serves cached HTML or
 * overrides res.send to be able to cache rendered HTML before sending.
 */
router.get('*', (req, res, next) => {
  const url = req.originalUrl;
  cache.get(url)
    .then(cachedHtml => {
      console.log('From cache: ' + url);
      res.send(cachedHtml);
    })
    .catch(_ => {
      // Overrides res.send to be able to cache before sending.
      res.sendResponse = res.send;
      res.send = body => {
        cache.set(url, body, CACHE_LIFETIME)
          .then(_ => {
            storeCachedUrls(url);
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

/**
 * Stores URLs in PAGELIST_URLS that need to be removed from cache.
 */
function storeCachedUrls(url) {
  // Stores list PWA pages (the ones without '/pwas/' in the URL)
  if (url.indexOf('/pwas/') < 0) {
    cache.get(PAGELIST_URLS)
      .then(array => {
        let urlSet = new Set(array);
        urlSet.add(url);
        cache.set(PAGELIST_URLS, Array.from(urlSet), CACHE_LIFETIME);
      })
      .catch(_ => {
        let urlSet = new Set();
        urlSet.add(url);
        cache.set(PAGELIST_URLS, Array.from(urlSet), CACHE_LIFETIME);
      });
  }
}

/**
 * Flush URLs from PAGELIST_URLS list.
 */
exports.flushCacheUrls = function() {
  cache.get(PAGELIST_URLS)
    .then(array => {
      array.forEach(url => {
        cache.del(url);
      });
      cache.del(PAGELIST_URLS);
    })
    .catch(_ => {
      // Not lists in cache.
    });
};

module.exports = router;
