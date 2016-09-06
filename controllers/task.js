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

/**
 * POST /task/lighthouse/:pwaid
 *
 * Fetch and store a lighthouse report for the pwaid
 */
router.post('/lighthouse/:pwaid', (req, res, next) => {
  lighthouseLib.fetchAndSave(req.params.pwaid)
    .then(lighthouse => {
      res.json(lighthouse);
    })
    .catch(err => {
      switch (err) {
        case lighthouseLib.E_PWA_NOT_FOUND:
          return res.status(404).send('Error loading PWA before fetching the Lighthouse report');
        case lighthouseLib.E_FETCHING_STORING_LIGHTHOUSE:
          return res.status(500).send('Error fetching/saving the Lighthouse report');
        default:
          return next(err);
      }
    });
});

/**
 * Errors on "/task/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code
  };
  next(err);
});

module.exports = router;