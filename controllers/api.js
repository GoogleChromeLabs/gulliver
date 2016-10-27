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
const lighthouseLib = require('../lib/lighthouse');
const router = express.Router(); // eslint-disable-line new-cap
const CACHE_CONTROL_EXPIRES = 60 * 60 * 24; // 1 day.

/**
 * GET /api/lighthouse-graph/:pwaId
 *
 * Returns the Lighthouse Graph information for a PWA
 * it uses the Google Charts JSON format:
 *  https://developers.google.com/chart/interactive/docs/reference#dataparam
 */
router.get('/lighthouse-graph/:pwaId', (req, res) => {
  lighthouseLib.getLighthouseGraphByPwaId(req.params.pwaId)
    .then(lighthouseGraph => {
      if (lighthouseGraph) {
        res.setHeader('Cache-Control', 'public, max-age=' + CACHE_CONTROL_EXPIRES);
        res.json(lighthouseGraph);
      } else {
        res.status(404);
        res.json('not found');
      }
    })
    .catch(err => {
      res.status(500);
      res.json(err);
    });
});

module.exports = router;
