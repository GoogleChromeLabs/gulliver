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
const config = require('../config/config');
const images = require('../lib/images');
const fetch = require('node-fetch');

const PWA = 'PWA';

function getModel() {
  return require('../lib/model-' + config.get('DATA_BACKEND'));
}

const router = express.Router(); // eslint-disable-line

// Set Content-Type for all responses for these routes
router.use(function(req, res, next) {
  res.set('Content-Type', 'text/html');
  next();
});

/**
 * GET /pwas/add
 *
 * Display a page of PWAs (up to ten at a time).
 */
router.get('/', function list(req, res, next) {
  function callback(err, entities, cursor) {
    if (err) {
      return next(err);
    }
    res.render('pwas/list.jade', {
      pwas: entities,
      nextPageToken: cursor
    });
  }
  getModel().list(PWA, 10, req.query.pageToken, callback);
});

/**
 * GET /pwas/add
 *
 * Display a form for creating a PWA.
 */
router.get('/add', function addForm(req, res) {
  res.render('pwas/form.jade', {
    pwa: {},
    action: 'Add'
  });
});

/**
 * POST /pwas/add
 *
 * Create a PWA.
 */
// [START add]
router.post(
  '/add',
  images.multer.single('image'),
  images.sendUploadToGCS,
  function insert(req, res, next) {
    const data = req.body;

    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      data.imageUrl = req.file.cloudStoragePublicUrl;
    }

    // Save the data to the database.
    getModel().create(PWA, data, function(err, savedData) {
      if (err) {
        return next(err);
      }

      fetch(savedData.manifestUrl).then(response => {
        response.json().then(json => {
          savedData.manifest = JSON.stringify(json);
          console.log(savedData);
          getModel().update(PWA, savedData.id, savedData);
        });
      });

      res.redirect(req.baseUrl + '/' + savedData.id);
    });
  }
);
// [END add]

/**
 * GET /pwas/:id/edit
 *
 * Display a pwa for editing.
 */
router.get('/:pwa/edit', function editForm(req, res, next) {
  getModel().read(PWA, req.params.pwa, function(err, entity) {
    if (err) {
      return next(err);
    }
    res.render('pwas/form.jade', {
      pwa: entity,
      action: 'Edit'
    });
  });
});

/**
 * POST /pwas/:id/edit
 *
 * Update a PWA.
 */
router.post(
  '/:pwa/edit',
  images.multer.single('image'),
  images.sendUploadToGCS,
  function update(req, res, next) {
    const data = req.body;

    fetch(data.manifestUrl).then(response => {
      response.json().then(json => {
        console.log(json);
        data.manifest = JSON.stringify(json);
        getModel().update(PWA, req.params.pwa, data);
      });
    });

    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      req.body.imageUrl = req.file.cloudStoragePublicUrl;
    }

    getModel().update(PWA, req.params.pwa, data, function(err, savedData) {
      if (err) {
        return next(err);
      }
      res.redirect(req.baseUrl + '/' + savedData.id);
    });
  }
);

/**
 * GET /pwas/:id
 *
 * Display a PWA.
 */
router.get('/:pwa', function get(req, res, next) {
  getModel().read(PWA, req.params.pwa, function(err, entity) {
    if (err) {
      return next(err);
    }
    res.render('pwas/view.jade', {
      pwa: entity
    });
  });
});

/**
 * GET /pwas/:id/delete
 *
 * Delete a PWA.
 */
router.get('/:pwa/delete', function _delete(req, res, next) {
  getModel().delete(PWA, req.params.pwa, function(err) {
    if (err) {
      return next(err);
    }
    res.redirect(req.baseUrl);
  });
});

/**
 * Errors on "/pwas/*" routes.
 */
router.use(function handleRpcError(err, req, res, next) {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = err.message;
  next(err);
});

module.exports = router;
