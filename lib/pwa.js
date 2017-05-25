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
const libWebPerformance = require('../lib/web-performance');
const libManifest = require('../lib/manifest');
const notificationsLib = require('../lib/notifications');
const promiseSequential = require('../lib/promise-sequential');
const libPwa = require('./pwa');
const libPwaIndex = require('./pwa-index');
const libCache = require('../lib/data-cache');

const Pwa = require('../models/pwa');

const db = require('../lib/model-datastore');
const gcloud = require('google-cloud');
const ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT')
});

const DEFAULT_SORT_TYPE_KEY = 'score';
const ENTITY_NAME = 'PWA';
const E_MANIFEST_INVALID_URL = exports.E_MANIFEST_INVALID_URL = 2;
const E_MANIFEST_URL_MISSING = exports.E_MANIFEST_URL_MISSING = 3;
const E_MISSING_USER_INFORMATION = exports.E_MISSING_USER_INFORMATION = 4;
const E_NOT_A_PWA = exports.E_NOT_A_PWA = 5;
// Waiting time to fetch external info and send notification for new PWAs
const WAIT_TIME_NEW_PWAS = 10 * 60 * 1000; // 10 minutes

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
 * @return {resultPage} resultPage with an arrays of PWAs and hasMore boolean
 */
exports.list = function(skip, limit, sort) {
  let sortType = SORT_TYPE_MAP.get(DEFAULT_SORT_TYPE_KEY);
  if (sort) {
    sortType = SORT_TYPE_MAP.get(sort) || sortType;
  }

  return db.list(ENTITY_NAME, skip, limit, sortType)
    .then(result => {
      const pwas = result.entities.map(pwa => {
        return Object.assign(new Pwa(), pwa);
      });

      const resultPage = {
        pwas: pwas,
        hasMore: result.hasMore
      };

      return resultPage;
    });
};

/**
 * Saves a PWA to DB.
 *
 * @param {Pwa} the Pwa to be saved.
 * @return a Promise.
 */
exports.savePwa = function(pwa) {
  return db.updateWithCounts(ENTITY_NAME, pwa.id, pwa)
    .then(savedPwa => {
      return savedPwa;
    })
    .catch(err => {
      console.log('Error saving PWA err' + pwa.id);
      Promise.reject(err);
    });
};

/**
 * Finds a PWA by key.
 *
 * @param {number} key of the PWA
 * @return {Pwa} the PWA from DB
 */
exports.find = function(key) {
  return db.read(ENTITY_NAME, key)
    .then(pwa => {
      const pwaInstance = Object.assign(new Pwa(), pwa);
      return pwaInstance;
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
 * Finds a PWA by its encodedStartUrl from DB.
 *
 * @param {string} encodedStartUrl of the PWA's manifest
 * @return {Pwa|null} the PWA from DB, or null if not found
 */
exports.findByEncodedStartUrl = function(encodedStartUrl) {
  return new Promise((resolve, reject) => {
    const query = ds.createQuery(ENTITY_NAME).filter('encodedStartUrl', encodedStartUrl);
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
 * Creates or Updates a PWA.
 *
 * Steps:
 *  1) Validate Pwa
 *  2) Update Pwa's Manifest
 *  3) Save (to get the DB id for following steps)
 *  4) Update PWA's MetadataDescription
 *  5) Update PWA's Icon
 *  6) Save
 *  7) (in background):
 *    a) Submit PWA for WebPerformance info
 *    b) Get Pwa Performance info
 *    c) Delete modified PWAs from cache
 *
 * @param {Pwa} pwa to update
 * @return {Pwa} the updated PWA
 */
exports.createOrUpdatePwa = function(pwa) {
  return promiseSequential.all([
    _ => (pwa),
    this.validatePwa,
    this.updatePwaManifest,
    this.savePwa,
    this.updatePwaMetadataDescription,
    this.updatePwaIcon,
    this.savePwa,
    savedPwa => {
      // In background
      libPwaIndex.updateSearchIndex(savedPwa);
      this.submitWebPageUrlForWebPerformanceInformation(savedPwa);
      this.getPwaPerformanceInfo(savedPwa);
      return savedPwa;
    }
  ]);
};

/**
 * Get Pwa Performance info
 *
 * @param {Pwa} pwa to update
 * @return {Promise<Array>}
 */
exports.getPwaPerformanceInfo = function(pwa) {
  let timeout = pwa.isNew() ? WAIT_TIME_NEW_PWAS : 0;
  setTimeout(_ => {
    return promiseSequential.all([
      _ => (pwa),
      this.updatePwaLighthouseInfo,
      this.updatePwaPageSpeedInformation,
      this.updatePwaWebPageTestInformation,
      this.savePwa,
      this.removePwaFromCache,
      this.sendNewAppNotification
    ]);
  }, timeout);
};

/**
 * Remove PWA from cache
 *
 * @param {Pwa} pwa to remove
 * @return {Promise<Pwa>}
 */
exports.removePwaFromCache = function(pwa) {
  if (pwa.isNew()) {
    libCache.flushCacheUrls();
  }
  // Delete modified PWA from cache
  const url = '/pwas/' + pwa.id;
  libCache.del(url);
  libCache.del(url + '?contentOnly=true');
  return Promise.resolve(pwa);
};

/**
 * Validates PWA's data
 *
 * @param {Pwa} pwa to validate
 * @return {Promise<Pwa>} Promise with validated PWA or rejects with error
 */
exports.validatePwa = function(pwa) {
  if (!pwa || !(pwa instanceof Pwa)) {
    return Promise.reject(E_NOT_A_PWA);
  }
  if (!pwa.manifestUrl) {
    return Promise.reject(E_MANIFEST_URL_MISSING);
  }
  const manifestUrl = url.format(pwa.manifestUrl);
  if (!(manifestUrl.startsWith('http://') ||
        manifestUrl.startsWith('https://'))) {
    return Promise.reject(E_MANIFEST_INVALID_URL);
  }
  if (!pwa.user || !pwa.user.id) {
    return Promise.reject(E_MISSING_USER_INFORMATION);
  }
  return Promise.resolve(pwa);
};

/**
 * Fetches the manifest for a PWA using it's manifest URL
 * or the webpage's link rel=manifest
 *
 * @param {Pwa} the PWA to update
 * @return {Promise<Manifest>} with the manifest for the PWA
 */
exports.fetchManifest = function(pwa) {
  return libManifest.fetchManifest(pwa.manifestUrl)
    .then(manifest => {
      return manifest;
    })
    .catch(_ => {
      // if there is not a manifest in the pwa.manifestUrl
      // we check if it is a webpage with a link rel=manifest to the manifest
      return dataFetcher.fetchLinkRelManifestUrl(pwa.manifestUrl)
        .then(newManifestUrl => {
          // remove hash from url
          pwa.manifestUrl = newManifestUrl.replace(/#.*/, '');
          return libManifest.fetchManifest(newManifestUrl);
        })
        .catch(err => {
          console.log('Error while fetching the PWA manifest ' + err);
          return Promise.reject(err);
        });
    });
};

/**
 * Update PWA's Manifest.
 *
 * @param {Pwa} Pwa to update
 * @return {Pwa} the updated PWA
 */
exports.updatePwaManifest = function(pwa) {
  return libPwa.fetchManifest(pwa)
    .then(manifest => {
      return libPwa.findByManifestUrl(pwa.manifestUrl)
        .then(existingPwa => {
          if (existingPwa) {
            pwa = existingPwa;
            pwa.updated = new Date();
          }
          const validationErrors = libPwa.validateManifest(pwa, manifest);
          if (validationErrors.length > 0) {
            return Promise.reject('Error while validating the manifest: ' + validationErrors);
          }
          pwa.manifest = manifest;

          // Creates a encodedStartUrl for human readable URLs
          pwa.generateEncodedStartUrl();

          return pwa;
        });
    });
};

/**
 * Validate PWA's Manifest.
 *
 * @param {Pwa} Pwa to validate
 * @param {Manifest} Manifest to validate
 * @returns {errors[]} Return errors in an array
 */
exports.validateManifest = function(pwa, manifest) {
  return libManifest.validateManifest(
    manifest.raw, pwa.manifestUrl, pwa.absoluteStartUrl);
};

/**
 * Sends a push notification for new PWAs using Firebase Cloud Messaging.
 *
 * @param {Pwa} pwa to send the notification for
 * @return {Promise<Pwa>} with the notified PWA
 */
exports.sendNewAppNotification = function(pwa) {
  if (!pwa.isNew()) {
    return Promise.resolve(pwa);
  }
  console.log('Sending Notification for ', pwa.id);
  const clickAction = config.get('CANONICAL_ROOT') + 'pwas/' + pwa.id + '?utm_source=push';
  return notificationsLib.sendPush('new-apps', {
    title: pwa.name + ' added to PWA Directory',
    body: pwa.description || '',
    icon: pwa.iconUrl64 || '',
    click_action: clickAction // eslint-disable-line camelcase
  })
  .then(_ => {
    return pwa;
  })
  .catch(err => {
    console.log('Error while sending PWA Notification ' + err);
    return pwa;
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
 * @param {Pwa} the PWA to update
 * @return {Promise<Pwa>} with the updated PWA
 */
exports.updatePwaMetadataDescription = function(pwa) {
  return dataFetcher.fetchMetadataDescription(pwa.absoluteStartUrl)
    .then(metaDescription => {
      pwa.metaDescription = metaDescription;
      console.log('Updated PWA MetadataDescription: ', pwa.id);
      return pwa;
    })
    .catch(err => {
      console.log('Error while updating PWA MetadataDescription ' + err);
      return pwa;
    });
};

/**
 * Updates the main icon of a PWA.
 *
 * @param {Pwa} the PWA to update
 * @return {Promise<Pwa>} with the updated PWA
 */
exports.updatePwaIcon = function(pwa) {
  const bestIconUrl = pwa.manifest.getBestIconUrl();
  if (!bestIconUrl) {
    console.log('bestIconUrl is null');
    return Promise.resolve(pwa);
  }
  const extension = path.extname(url.parse(bestIconUrl).pathname);
  const bucketFileName = pwa.id + extension;
  return libImages.fetchAndSave(bestIconUrl, bucketFileName)
    .then(savedUrls => {
      pwa.iconUrl = savedUrls[0];
      pwa.iconUrl128 = savedUrls[1];
      pwa.iconUrl64 = savedUrls[2];
      console.log('Updated PWA Icon/Image: ', pwa.id);
      return pwa;
    })
    .catch(err => {
      console.log('Error while updating PWA Icon/Image ' + err);
      return pwa;
    });
};

/**
 * Submit WebPageUrl to WebPerformance service,
 * that service runs daily WebPageTest, PageSpeed and Lighthouse.
 *
 * @param {Pwa} the PWA to update
 * @return {Promise<Pwa>} with the updated PWA
 */
exports.submitWebPageUrlForWebPerformanceInformation = function(pwa) {
  return libWebPerformance.submitWebPageUrl(pwa)
    .then(result => {
      if (result.status === 200) {
        console.log('Submited PWA for WebPerformance info: ', pwa.id);
      } else {
        console.log('Error while submiting PWA for WebPerformance information: ' +
          pwa.id + ' ' + JSON.stringify(result));
      }
      return pwa;
    })
    .catch(err => {
      console.log(
        'Error while submiting PWA for WebPerformance information: ' + pwa.id + ' ' + err);
      return pwa;
    });
};

/**
 * Updates the Lighthouse information.
 *
 * @param {Pwa} the PWA to update
 * @return {Promise<Pwa>} with the updated PWA
 */
exports.updatePwaLighthouseInfo = function(pwa) {
  return libLighthouse.fetchAndSave(pwa.id)
    .then(lighthouse => {
      pwa.lighthouseScore = lighthouse.lighthouseInfo.totalScore;
      console.log('Updated PWA Lighthouse info for: ', pwa.id);
      return pwa;
    })
    .catch(err => {
      console.log('Error while updating PWA Lighthouse information ' + err);
      return pwa;
    });
};

/**
 * Update PageSpeed information.
 *
 * @param {Pwa} the PWA to update
 * @return {Promise<Pwa>} with the updated PWA
 */
exports.updatePwaPageSpeedInformation = function(pwa) {
  return libWebPerformance.getPageSpeedReport(pwa)
    .then(pageSpeedJson => {
      console.log('Updated PWA PageSpeed info: ', pwa.id);
      pwa.pageSpeed = pageSpeedJson[0];
      return pwa;
    })
    .catch(err => {
      console.log('Error while updating PageSpeed information: ' + pwa.id + ' ' + err);
      return pwa;
    });
};

/**
 * Update WebPageTest information.
 *
 * @param {Pwa} the PWA to update
 * @return {Promise<Pwa>} with the updated PWA
 */
exports.updatePwaWebPageTestInformation = function(pwa) {
  return libWebPerformance.getWebPageTestReport(pwa)
    .then(json => {
      console.log('Updated PWA WebPageTest info: ', pwa.id);
      let webPageTestJson = json[0];
      // remove rawFirstViewData to make the field smaller than 1500 bytes
      webPageTestJson.rawFirstViewData = null;
      pwa.webPageTest = webPageTestJson;
      return pwa;
    })
    .catch(err => {
      console.log('Error while updating WebPageTest information: ' + pwa.id + ' ' + err);
      return pwa;
    });
};

exports.count = function() {
  return db.count(ENTITY_NAME);
};
