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
const bodyParser = require('body-parser');
const pwaModel = require('../../lib/pwa');
const router = express.Router(); // eslint-disable-line
const LIST_PAGE_SIZE = 10;

// Automatically parse request body as JSON
router.use(bodyParser.json());

/**
 * GET /api/pwas
 *
 * Retrieve a page of PWAs (up to ten at a time).
 */
router.get('/', (req, res, next) => {
  pwaModel.list(LIST_PAGE_SIZE, req.query.pageToken)
    .then(result => {
      res.json({
        items: result.pwas,
        nextPageToken: result.hasMore
      });
    })
    .catch(err => {
      next(err);
    });
});

/**
 * POST /api/pwas
 *
 * Create a new PWA.
 */
router.post('/', (req, res, next) => {
  pwaModel.save(req.body)
    .then(entity => {
      res.json(entity);
    })
    .catch(err => {
      return next(err);
    });
});

/**
 * GET /api/pwas/:id
 *
 * Retrieve a PWA.
 */
router.get('/:pwa', (req, res, next) => {
  pwaModel.find(req.params.pwa)
    .then(pwa => {
      res.json(pwa);
      return;
    })
    .catch(err => {
      return next(err);
    });
});

/**
 * PUT /api/pwas/:id
 *
 * Update a PWA.
 */
router.put('/:pwa', (req, res, next) => {
  const pwa = req.body;
  pwa.id = req.params.pwa;
  pwaModel.save(pwa)
    .then(entity => {
      res.json(entity);
    })
    .catch(err => {
      return next(err);
    });
});

/**
 * DELETE /api/pwas/:id
 *
 * Delete a PWA.
 */
router.delete('/:pwa', (req, res, next) => {
  pwaModel.delete(req.params.pwa)
    .then(() => {
      res.status(200).send('OK');
    })
    .catch(err => {
      return next(err);
    });
});

/**
 * Errors on "/api/pwas/*" routes.
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
