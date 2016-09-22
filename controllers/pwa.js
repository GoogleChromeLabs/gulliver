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
const pwaLib = require('../lib/pwa');
const Pwa = require('../models/pwa');
const router = express.Router(); // eslint-disable-line new-cap
const config = require('../config/config');
const CLIENT_ID = config.get('CLIENT_ID');
const CLIENT_SECRET = config.get('CLIENT_SECRET');
const LIST_PAGE_SIZE = 12;
const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_SORT_ORDER = 'newest';

/**
 * GET /pwas/add
 *
 * Display a page of PWAs (up to ten at a time).
 */
router.get('/', (req, res, next) => {
  const pageNumber = parseInt(req.query.page, 10) || DEFAULT_PAGE_NUMBER;
  const sortOrder = req.query.sort || DEFAULT_SORT_ORDER;
  const start = (pageNumber - 1) * LIST_PAGE_SIZE;

  pwaLib.list(start, LIST_PAGE_SIZE, sortOrder)
    .then(result => {
      res.render('pwas/list.hbs', {
        pwas: result.pwas,
        hasNextPage: result.hasMore,
        hasPreviousPage: pageNumber > 1,
        nextPageNumber: pageNumber + 1,
        previousPageNumber: pageNumber - 1,
        currentPageNumber: pageNumber
      });
    })
    .catch(err => {
      next(err);
    });
});

/**
 * GET /pwas/add
 *
 * Display a form for creating a PWA.
 */
router.get('/add', (req, res) => {
  res.render('pwas/form.hbs', {
    pwa: {},
    action: 'Add'
  });
});

/**
 * POST /pwas/add
 *
 * Create a PWA.
 */
router.post('/add', (req, res, next) => {
  const manifestUrl = req.body.manifestUrl;
  const idToken = req.body.idToken;
  let pwa = new Pwa(manifestUrl);

  if (!manifestUrl) {
    res.render('pwas/form.hbs', {
      pwa,
      error: 'no manifest provided'
    });
    return;
  }

  if (!idToken) {
    res.render('pwas/form.hbs', {
      pwa,
      error: 'user not logged in'
    });
    return;
  }

  verifyIdToken(CLIENT_ID, CLIENT_SECRET, idToken)
    .then(user => {
      pwa.setUserId(user);
      return pwaLib.save(pwa);
    })
    .then(savedData => {
      res.redirect(req.baseUrl + '/' + savedData.id);
      return;
    })
    .catch(err => {
      if (typeof err === 'number') {
        switch (err) {
          case pwaLib.E_MANIFEST_INVALID_URL:
            err = `pwa.manifestUrl [${pwa.manifestUrl}] is not a valid URL`;
            break;
          case pwaLib.E_MISING_USER_INFORMATION:
            err = 'Missing user information';
            break;
          case pwaLib.E_MANIFEST_URL_MISSING:
            err = 'Missing manifestUrl';
            break;
          case pwaLib.E_NOT_A_PWA:
            err = 'pwa is not an instance of Pwa';
            break;
          default:
            return next(err);
        }
      }
      // Transform err from an array of strings (in a particular format) to a
      // comma-separated string.
      if (Array.isArray(err)) {
        const s = err.map(e => {
          const m = e.match(/^ERROR:\s+(.*)\.$/);
          return m ? m[1] : e; // if no match (format changed?), just return the string
        }).join(', ');
        err = s;
      }
      res.render('pwas/form.hbs', {
        pwa,
        error: err
      });
      return;
    });
});

/**
 * GET /pwas/:id
 *
 * Display a PWA.
 */
router.get('/:pwa', (req, res, next) => {
  pwaLib.find(req.params.pwa)
    .then(entity => {
      res.render('pwas/view.hbs', {
        pwa: entity
      });
    })
    .catch(() => {
      return next();
    });
});

/**
 * Errors on "/pwas/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = err.message;
  next(err);
});

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

module.exports = router;
