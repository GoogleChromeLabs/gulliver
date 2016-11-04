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

const path = require('path');
const url = require('url');
const config = require('../config/config');

const libImages = require('../lib/images');
const dataFetcher = require('../lib/data-fetcher');
const libLighthouse = require('../lib/lighthouse');
const libManifest = require('../lib/manifest');

const Pwa = require('../models/pwa');
const cache = require('../lib/data-cache');

const db = require('../lib/model-' + config.get('DATA_BACKEND'));
const gcloud = require('google-cloud');
const ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT')
});

const DEFAULT_SORT_TYPE_KEY = 'score';
const ENTITY_NAME = 'PWA';
const E_MANIFEST_INVALID_URL = exports.E_MANIFEST_INVALID_URL = 2;
const E_MANIFEST_URL_MISSING = exports.E_MANIFEST_URL_MISSING = 3;
const E_MISING_USER_INFORMATION = exports.E_MISING_USER_INFORMATION = 4;
const E_NOT_A_PWA = exports.E_NOT_A_PWA = 5;
const LIST_ENTITY_NAME = 'PWA_LIST';
const LIST_LAST_UPDATE_KEY = 'PWA_LIST_LAST_UPDATE';
const CACHE_TIMEOUT = 60;

const SORT_TYPE_MAP = new Map([
  ['name', {name: 'name', field: 'manifest.name'}],
  ['newest', {name: 'newest', field: 'created', config: {descending: true}}],
  ['score', {name: 'score', field: 'lighthouseScore', config: {descending: true}}]
]);

/**
 * List of PWAs.
 *
 * @param {number} skip specifies the starting point for handling pagination
 * @param {number} limit number of results to return
 * @param {string} sort the field name to sort the results
 * @return {Pwa} the PWA from DB
 */
exports.list = function(skip, limit, sort) {
  let sortType = SORT_TYPE_MAP.get(DEFAULT_SORT_TYPE_KEY);
  if (sort) {
    sortType = SORT_TYPE_MAP.get(sort) || sortType;
  }

  const cacheKey = JSON.stringify({
    kind: LIST_ENTITY_NAME,
    skip: skip,
    limit: limit,
    sort: sortType.name
  });

  return this.getListFromCache(cacheKey)
    .then(result => {
      const pwas = result.pwas.map(pwa => {
        return Object.assign(new Pwa(), pwa);
      });

      return {
        pwas: pwas,
        hasMore: result.hasMore
      };
    })
    .catch(_ => {
      return db.list(ENTITY_NAME, skip, limit, sortType)
        .then(result => {
          const pwas = result.entities.map(pwa => {
            return Object.assign(new Pwa(), pwa);
          });

          const resultPage = {
            pwas: pwas,
            hasMore: result.hasMore
          };

          this.addListToCache(cacheKey, resultPage);
          return resultPage;
        });
    });
};

/**
 * Get a PWA page from cache.
 *
 * @param key {string} the key for the page
 * @return Promise.
 */
exports.getListFromCache = function(key) {
  return new Promise((resolve, reject) => {
    cache.getMulti([key, LIST_LAST_UPDATE_KEY])
      .then(data => {
        // Key not found.
        if (!data[key]) {
          return reject('Not Found. Key: ' + key);
        }

        // No last update timestamp on cache. Since last update timeout is larger than the page
        // timeout, we know that no update happened after page was loaded. Page is up to date.
        if (!data[LIST_LAST_UPDATE_KEY]) {
          return resolve(data[key]);
        }

        // last update timestamp happened after page was added to cache. Page is expired.
        if (data[LIST_LAST_UPDATE_KEY] >= data[key].cacheTimestamp) {
          return reject('Data Expired: ' + key);
        }

        // last update timestamp happened before page was added to cache. Page is up to date.
        resolve(data[key]);
      })
      .catch(err => {
        console.log(err);
        return reject(err);
      });
  });
};

/**
 * Adds a PWA page to the Cache. Adds a cacheTimestamp property
 * to the value in order to validate it agains last update later.
 *
 * @param key {string} the cache key
 * @param value {object} the value
 * @return a Promise
 */
exports.addListToCache = function(key, value) {
  value.cacheTimestamp = Date.now();
  return cache.set(key, value, CACHE_TIMEOUT);
};

/**
 * Adds a single PWA to the Cache. Also updates the last update timestamp
 * on the cache.
 *
 * @param {Pwa} the Pwa to be added to the cache.
 * @return a Promise.
 */
exports.addPwaToCache = function(pwa) {
  const pwaCacheKey = JSON.stringify({kind: ENTITY_NAME, key: pwa.id});
  return Promise.all([
    cache.set(pwaCacheKey, pwa, CACHE_TIMEOUT),
    cache.set(LIST_LAST_UPDATE_KEY, Date.now(), CACHE_TIMEOUT * 5)
  ]);
};

/**
 * Finds a PWA by key.
 *
 * @param {number} key of the PWA
 * @return {Pwa} the PWA from DB
 */
exports.find = function(key) {
  const cacheKey = JSON.stringify({kind: ENTITY_NAME, key: key});
  return cache.get(cacheKey)
    .then(pwa => {
      return Object.assign(new Pwa(), pwa);
    })
    .catch(_ => {
      return db.read(ENTITY_NAME, key)
        .then(pwa => {
          const pwaInstance = Object.assign(new Pwa(), pwa);
          cache.set(cacheKey, pwaInstance, CACHE_TIMEOUT);
          return pwaInstance;
        });
    });
};

/**
 * Finds a PWA by its manifest URL from DB.
 *
 * @param {string} manifestUrl of the PWA's manifest
 * @return {Pwa|null} the PWA from DB, or null if not found
 */
exports.findByManifestUrl = function(manifestUrl) {
  return new Promise((resolve, reject) => {
    const query = ds.createQuery(ENTITY_NAME).filter('manifestUrl', manifestUrl);
    ds.runQuery(query, (err, pwas) => {
      if (err) {
        return reject(err);
      }

      if (pwas.length === 0) {
        return resolve(null);
      }

      pwas[0].data.id = pwas[0].key.id;
      let pwa = Object.assign(new Pwa(), pwas[0].data);
      return resolve(pwa);
    });
  });
};

/**
 * Finds a PWA by its slugified from DB.
 *
 * @param {string} slugified of the PWA's manifest
 * @return {Pwa|null} the PWA from DB, or null if not found
 */
exports.findBySlugified = function(slugified) {
  return new Promise((resolve, reject) => {
    const query = ds.createQuery(ENTITY_NAME).filter('slugified', slugified);
    ds.runQuery(query, (err, pwas) => {
      if (err) {
        return reject(err);
      }

      if (pwas.length === 0) {
        return resolve(null);
      }

      pwas[0].data.id = pwas[0].key.id;
      let pwa = Object.assign(new Pwa(), pwas[0].data);
      return resolve(pwa);
    });
  });
};

/**
 * Saves a PWA to the DB.
 *
 * Steps:
 *  1) Fetches the manifest.
 *  2) Validates the manifest.
 *  3) Fetches the description from the metadata if needed.
 *  4) Saves the PWA to get the autogenerated id.
 *  5) Updates the main Icon of the PWA.
 *  6) Fetches and saves the Lighthouse info.
 *  7) Updates the lighthouseScore of the PWA.
 *
 * @param {Pwa} pwa to update
 * @param {Manifest} manifest that contains the icon url to fetch
 * @return {Pwa} the updated PWA
 */
exports.save = function(pwa) {
  if (!pwa) {
    return Promise.reject('pwa is null');
  }

  if (!(pwa instanceof Pwa)) {
    return Promise.reject(E_NOT_A_PWA);
  }

  if (!pwa.manifestUrl) {
    return Promise.reject(E_MANIFEST_URL_MISSING);
  }

  if (!(url.format(pwa.manifestUrl).startsWith('http://') ||
        url.format(pwa.manifestUrl).startsWith('https://'))) {
    return Promise.reject(E_MANIFEST_INVALID_URL);
  }

  if (!pwa.user || !pwa.user.id) {
    return Promise.reject(E_MISING_USER_INFORMATION);
  }

  return this._save(pwa);
};

// Internal only; we only export so that we can monkey patch in tests…
exports.fetchManifest = function(pwa) {
  return new Promise((resolve, reject) => {
    libManifest.fetchManifest(pwa.manifestUrl)
      .then(manifest => {
        resolve(manifest);
      })
      .catch(_ => {
        // if there is not a manifest in the pwa.manifestUrl
        // we check if it is a webpage with a link rel=manifest to the manifest
        dataFetcher.fetchLinkRelManifestUrl(pwa.manifestUrl)
          .then(newManifestUrl => {
            pwa.manifestUrl = newManifestUrl;
            resolve(libManifest.fetchManifest(newManifestUrl));
          })
          .catch(err => {
            console.log(err);
            return reject(err);
          });
      });
  });
};

// Internal only; we only export so that we can monkey patch in tests…
exports._save = function(pwa) {
  return this.fetchManifest(pwa)
    .then(manifest => {
      return this.findByManifestUrl(pwa.manifestUrl)
        .then(existingPwa => {
          pwa = existingPwa || pwa;
          pwa.updated = new Date();
          return manifest;
        })
        .then(manifest => {
          // If manifest is invalid, reject and return errors in an array
          const manifestUrl = pwa.manifestUrl;
          // We don't have a separate documentUrl, so just pass manifestUrl for the moment
          // to avoid validation errors.
          const documentUrl = manifestUrl;
          const res = libManifest.validateManifest(manifest.raw, manifestUrl, documentUrl);
          return res.length === 0 ? manifest : Promise.reject(res);
        })
        .then(manifest => {
          pwa.manifest = manifest;
          return this.fetchMetadataDescription(pwa);
        })
        .then(metaDescription => {
          pwa.metaDescription = metaDescription;
          const parsedUrl = url.parse(pwa.absoluteStartUrl);
          pwa.encodedStartUrl = encodeURIComponent(parsedUrl.hostname + parsedUrl.pathname);
          return db.update(ENTITY_NAME, pwa.id, pwa);
        })
        .then(savedPwa => {
          this.addPwaToCache(savedPwa);
          this.updateIcon(savedPwa, pwa.manifest)
            .then(_ => {
              this.updateLighthouseInfo(savedPwa)
                .then(_ => {
                  this.addPwaToCache(savedPwa);
                });
            });
          return savedPwa;
        });
    });
};

/**
 * Deletes a PWA from DB.
 *
 * @param {number} key of the PWA
 * @return {Promise<>}
 */
exports.delete = function(key) {
  return db.delete(ENTITY_NAME, key);
};

/**
 * Updates the description from the webpage's metadata if not present in the Manifest.
 *
 * @param {Pwa} pwa to update
 * @return {Promise<string>} with the description or error
 */
exports.fetchMetadataDescription = function(pwa) {
  return new Promise((resolve, reject) => {
    if (!pwa.description && pwa.absoluteStartUrl) {
      dataFetcher.fetchMetadataDescription(pwa.absoluteStartUrl)
        .then(description => {
          resolve(description);
        })
        .catch(err => {
          console.log(err);
          resolve(null);
        });
    } else {
      resolve(null);
    }
  });
};

/**
 * Updates the main icon of a PWA.
 *
 * @param {Pwa} pwa to update
 * @param {Manifest} manifest that contains the icon url to fetch
 * @return {Pwa} the updated PWA
 */
exports.updateIcon = function(pwa, manifest) {
  return new Promise((resolve, reject) => {
    const bestIconUrl = manifest.getBestIconUrl();
    if (!bestIconUrl) {
      console.log('bestIconUrl is null');
      resolve(null);
    }
    const extension = path.extname(url.parse(bestIconUrl).pathname);
    const bucketFileName = pwa.id + extension;

    libImages.fetchAndSave(bestIconUrl, bucketFileName)
      .then(savedUrl => {
        pwa.iconUrl = savedUrl[0];
        pwa.iconUrl128 = savedUrl[1];
        pwa.iconUrl64 = savedUrl[2];
        let updatedPwa = db.update(ENTITY_NAME, pwa.id, pwa);
        console.log('Updated PWA Image: ', pwa.id);
        resolve(updatedPwa);
      })
      .catch(err => {
        console.log(err);
        resolve(null);
      });
  });
};

/**
 * Updates the Lighthouse information and sets the lighthouseScore for a PWA.
 *
 * @param {Pwa} pwa to get and update the lighthouse info.
 * @return {Pwa} the updated PWA
 */
exports.updateLighthouseInfo = function(pwa) {
  return new Promise((resolve, reject) => {
    libLighthouse.fetchAndSave(pwa.id)
    .then(lighthouse => {
      pwa.lighthouseScore = lighthouse.lighthouseInfo.totalScore;
      let updatedPwa = db.update(ENTITY_NAME, pwa.id, pwa);
      console.log('Updated PWA Lighthouse info for: ', pwa.id);
      resolve(updatedPwa);
    })
    .catch(err => {
      console.log(err);
      resolve(null);
    });
  });
};
