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
const verifyIdToken = require('../lib/verify-id-token');
const lighthouseLib = require('../lib/lighthouse');
const Pwa = require('../models/pwa');
const router = express.Router(); // eslint-disable-line new-cap
const libMetadata = require('../lib/metadata');
const cache = require('../lib/data-cache');

const LIST_PAGE_SIZE = 32;
const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_SORT_ORDER = 'newest';

const CACHE_LIFETIME = 60 * 60 * 24; // 24 hours

/**
 * GET /
 *
 * Display a page of PWAs (up to LIST_PAGE_SIZE at a time)
 * Stores the latest page in memcached.
 */
router.get('/', (req, res, next) => {
  cache.get(req.originalUrl)
    .then(cachedPage => {
      console.log('Served from memcache: ' + req.originalUrl);
      res.send(cachedPage);
      return cachedPage;
    })
    .catch(_ => {
      console.log('Not in memcache: ' + req.originalUrl);
    })
    .then(cachedPage => {
      renderPwaListPage(req, res)
        .then(html => {
          if (!cachedPage) {
            res.send(html);
          }
          if (html !== cachedPage) {
            cache.set(req.originalUrl, html, CACHE_LIFETIME)
            .catch(_ => {
              console.log('Error setting cache for: ' + req.originalUrl);
            });
          }
        }).catch(err => {
          err.status = 500;
          next(err);
        });
    });
});

/**
 * GET /pwas/add
 *
 * Display a form for creating a PWA.
 */
router.get('/add', (req, res) => {
  const contentOnly = false || req.query.contentOnly;
  let arg = Object.assign(libMetadata.fromRequest(req), {
    title: 'PWA Directory - Submit a PWA',
    description: 'PWA Directory: Submit a Progressive Web Apps',
    pwa: {},
    action: 'Add',
    backlink: true,
    submit: true,
    contentOnly: contentOnly
  });
  res.render('pwas/form.hbs', arg);
});

/**
 * POST /pwas/add
 *
 * Create a PWA.
 * Flushes memcached when a PWA is added.
 */
router.post('/add', (req, res, next) => {
  let manifestUrl = req.body.manifestUrl.trim();
  if (manifestUrl.startsWith('http://')) {
    manifestUrl = manifestUrl.replace('http://', 'https://');
  }
  const idToken = req.body.idToken;
  let pwa = new Pwa(manifestUrl);

  if (!manifestUrl || !idToken) {
    let arg = Object.assign(libMetadata.fromRequest(req), {
      pwa,
      backlink: true,
      error: (manifestUrl) ? 'user not logged in' : 'no manifest provided'
    });
    res.render('pwas/form.hbs', arg);
    return;
  }

  verifyIdToken.verifyIdToken(idToken)
    .then(user => {
      pwa.setUser(user);
      return pwaLib.createOrUpdatePwa(pwa);
    })
    .then(savedData => {
      cache.flush();
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
      let arg = Object.assign(libMetadata.fromRequest(req), {
        pwa,
        backlink: true,
        error: err
      });
      res.render('pwas/form.hbs', arg);
      return;
    });
});

/**
 * GET /pwas/:id
 *
 * Display a PWA.
 * Stores the latest detail page in memcached.
 */
router.get('/:pwa', (req, res, next) => {
  const pwaId = req.params.pwa;
  const contentOnly = false || req.query.contentOnly;
  const url = req.originalUrl;
  cache.get(url)
    .then(cachedPage => {
      console.log('Served from memcache: ' + url);
      res.send(cachedPage);
      return cachedPage;
    })
    .catch(_ => {
      console.log('Not in memcache: ' + url);
    })
    .then(cachedPage => {
      renderOnePwa(req, res, pwaId, contentOnly)
        .then(html => {
          if (!cachedPage) {
            res.send(html);
          }
          if (html !== cachedPage) {
            cache.set(url, html, CACHE_LIFETIME)
            .catch(_ => {
              console.log('Error setting cache for: ' + url);
            });
          }
        })
        .catch(err => {
          err.status = 404;
          return next(err);
        });
    });
});

/**
 * Generate the HTML with 'pwas/view.hbs' for one PWA
 */
function renderOnePwa(req, res, pwaId, contentOnly, url) {
  return pwaLib.find(pwaId)
    .then(pwa => {
      return lighthouseLib.findByPwaId(pwaId)
        .then(lighthouse => {
          let arg = Object.assign(libMetadata.fromRequest(req, url), {
            pwa: pwa,
            lighthouse: lighthouse,
            rawManifestJson: JSON.parse(pwa.manifest.raw),
            title: 'PWA Directory: ' + pwa.name,
            description: 'PWA Directory: ' + pwa.name + ' - ' + pwa.description,
            backlink: true,
            contentOnly: contentOnly
          });
          return render(res, 'pwas/view.hbs', arg);
        });
    });
}

/**
 * Generate the HTML with 'pwas/list.hbs' for a list of PWAs
 */
function renderPwaListPage(req, res) {
  const pageNumber = parseInt(req.query.page, 10) || DEFAULT_PAGE_NUMBER;
  const sortOrder = req.query.sort || DEFAULT_SORT_ORDER;
  const start = parseInt(req.query.start, 10) || (pageNumber - 1) * LIST_PAGE_SIZE;
  const limit = parseInt(req.query.limit, 10) || LIST_PAGE_SIZE;
  const end = pageNumber * LIST_PAGE_SIZE;
  const contentOnly = false || req.query.contentOnly;
  let pwaCount = 0;
  return pwaLib.count()
    .then(count => {
      pwaCount = count;
      return pwaLib.list(start, limit, sortOrder);
    })
    .then(result => {
      cachePwasFromList(req, res, result.pwas);
      let arg = Object.assign(libMetadata.fromRequest(req), {
        title: 'PWA Directory',
        description: 'PWA Directory: A Directory of Progressive Web Apps',
        pwas: result.pwas,
        hasNextPage: result.hasMore,
        hasPreviousPage: pageNumber > 1,
        nextPageNumber: pageNumber + 1,
        previousPageNumber: (pageNumber === 2) ? false : pageNumber - 1,
        currentPageNumber: pageNumber,
        sortOrder: (sortOrder === DEFAULT_SORT_ORDER) ? false : sortOrder,
        showNewest: sortOrder === 'newest',
        showScore: sortOrder === 'score',
        pwaCount: pwaCount,
        startPwa: start + 1,
        endPwa: Math.min(pwaCount, end),
        mainPage: true,
        contentOnly: contentOnly
      });
      return render(res, 'pwas/list.hbs', arg);
    });
}

/**
 * Cache individual PWAs from the list page if not in cache already.
 */
function cachePwasFromList(req, res, pwas) {
  pwas.forEach(pwa => {
    const url = '/pwas/' + pwa.id + '?contentOnly=true';
    cache.get(url)
    .catch(_ => {
      console.log('Not in memcache: ' + url);
    })
    .then(cachedPage => {
      renderOnePwa(req, res, pwa.id, true, url)
        .then(html => {
          if (html !== cachedPage) {
            cache.set(url, html, CACHE_LIFETIME);
          }
        });
    })
    .catch(err => {
      console.log(err);
    });
  });
}

/**
 * res.render as a Promise
 */
function render(res, view, options) {
  return new Promise((resolve, reject) => {
    res.render(view, options, (err, html) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve(html);
    });
  });
}

/**
 * Errors on "/pwas/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = err.message;
  console.log(err);
  next(err);
});

module.exports = router;
