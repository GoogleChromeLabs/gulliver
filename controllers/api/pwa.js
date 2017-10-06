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
require('express-csv');
const pwaLib = require('../../lib/pwa');
const router = express.Router(); // eslint-disable-line new-cap
const CACHE_CONTROL_EXPIRES = 60 * 60 * 1; // 1 hour

const config = require('../../config/config');
const apiKeyArray = config.get('API_TOKENS');

/**
 * Checks for the presence of an API key from API_TOKENS in config.json
 */
function checkApiKey(req, res, next) {
  if (req.query.key &&
      (apiKeyArray === req.query.key || apiKeyArray.indexOf(req.query.key) !== -1)) {
    return next();
  }
  return res.sendStatus(403);
}

/**
 * GET /api/pwa
 *
 * Returns all PWAs as JSON or ?format=csv for CSV.
 */
router.get('/', checkApiKey, (req, res) => {
  let format = req.query.format;
  pwaLib.list()
    .then(result => {
      let pwaList = [];
      result.pwas.forEach(dbPwa => {
        let created = new Date(dbPwa.created);
        created = created.toISOString().split('T')[0];
        let updated = new Date(dbPwa.updated);
        updated = updated.toISOString().split('T')[0];
        let pwa;
        if (format && format === 'csv') {
          pwa = [];
          pwa.push(dbPwa.id);
          pwa.push(dbPwa.absoluteStartUrl);
          pwa.push(dbPwa.manifestUrl);
          pwa.push(dbPwa.lighthouseScore);
          pwa.push(created);
          pwa.push(updated);
        } else {
          pwa = {};
          pwa.id = dbPwa.id;
          pwa.absoluteStartUrl = dbPwa.absoluteStartUrl;
          pwa.manifestUrl = dbPwa.manifestUrl;
          pwa.lighthouseScore = dbPwa.lighthouseScore;
          pwa.webPageTest = dbPwa.webPageTest;
          pwa.pageSpeed = dbPwa.pageSpeed;
          pwa.created = created;
          pwa.updated = updated;
        }
        pwaList.push(pwa);
      });
      res.setHeader('Cache-Control', 'public, max-age=' + CACHE_CONTROL_EXPIRES);
      if (format && format === 'csv') {
        res.set('Content-Type', 'text/csv');
        pwaList.unshift(
          ['id', 'absoluteStartUrl', 'manifestUrl', 'lighthouseScore', 'created', 'updated']);
        res.csv(pwaList);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.json(pwaList);
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500);
      res.json(err);
    });
});

module.exports = router;
