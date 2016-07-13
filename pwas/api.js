// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var config = require('../config/config');

var PWA = 'PWA';

function getModel() {
  return require('../lib/model-' + config.get('DATA_BACKEND'));
}

var router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());

/**
 * GET /api/pwas
 *
 * Retrieve a page of PWAs (up to ten at a time).
 */
router.get('/', function list(req, res, next) {
  getModel().list(PWA, 10, req.query.pageToken, function(err, entities, cursor) {
    if (err) {
      return next(err);
    }
    res.json({
      items: entities,
      nextPageToken: cursor
    });
  });
});

/**
 * POST /api/pwas
 *
 * Create a new PWA.
 */
router.post('/', function insert(req, res, next) {
  getModel().create(PWA, req.body, function(err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * GET /api/pwas/:id
 *
 * Retrieve a PWA.
 */
router.get('/:pwa', function get(req, res, next) {
  getModel().read(PWA, req.params.pwa, function(err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * PUT /api/pwas/:id
 *
 * Update a PWA.
 */
router.put('/:pwa', function update(req, res, next) {
  getModel().update(PWA, req.params.pwa, req.body, function(err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * DELETE /api/pwas/:id
 *
 * Delete a PWA.
 */
router.delete('/:pwa', function _delete(req, res, next) {
  getModel().delete(PWA, req.params.pwa, function(err) {
    if (err) {
      return next(err);
    }
    res.status(200).send('OK');
  });
});

/**
 * Errors on "/api/pwas/*" routes.
 */
router.use(function handleRpcError(err, req, res, next) {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code
  };
  next(err);
});

module.exports = router;
