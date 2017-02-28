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
const libPageSpeed = require('../lib/page-speed');
const libManifest = require('../lib/manifest');
const notificationsLib = require('../lib/notifications');
const promiseSequential = require('../lib/promise-sequential');
const libPwa = require('./pwa');

const Pwa = require('../models/pwa');
const cache = require('../lib/data-cache');

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
function addPwaToCache(pwa) {
  const pwaCacheKey = JSON.stringify({kind: ENTITY_NAME, key: pwa.id});
  return Promise.all([
    cache.set(pwaCacheKey, pwa, CACHE_TIMEOUT),
    cache.set(LIST_LAST_UPDATE_KEY, Date.now(), CACHE_TIMEOUT * 5)
  ]);
}

/**
 * Saves a PWA to DB and updates cache,
 *
 * @param {Pwa} the Pwa to be saved and added to the cache.
 * @return a Promise.
 */
exports.savePwa = function(pwa) {
  return db.updateWithCounts(ENTITY_NAME, pwa.id, pwa)
    .then(savedPwa => {
      addPwaToCache(savedPwa);
      return savedPwa;
    });
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
 *    a) Submit PWA for PageSpeed info
 *    b) Get Pwa Performance info
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
    pwa => {
      // In background
      this.submitWebPageUrlForPageSpeedInformation(pwa);
      if (pwa.isNew()) {
        // wait 3 minutes for new PWAs
        setTimeout(_ => this.getPwaPerformanceInfo(pwa), 3 * 60 * 1000);
      } else {
        this.getPwaPerformanceInfo(pwa);
      }
      return pwa;
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
  return promiseSequential.all([
    _ => (pwa),
    this.updatePwaLighthouseInfo,
    this.updatePwaPageSpeedInformation,
    this.updatePwaWebPageTestInformation,
    this.savePwa,
    this.sendNewAppNotification
  ]);
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
  const clickAction = config.get('CANONICAL_ROOT') + 'pwas/' + pwa.id;
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
 * Submit WebPageUrl to Page Speed service,
 * that service runs daily WebPageTest, PageSpeed and Lighthouse.
 *
 * @param {Pwa} the PWA to update
 * @return {Promise<Pwa>} with the updated PWA
 */
exports.submitWebPageUrlForPageSpeedInformation = function(pwa) {
  return libPageSpeed.submitWebPageUrl(pwa)
    .then(result => {
      if (result.status === 200) {
        console.log('Submited PWA for PageSpeed info: ', pwa.id);
      } else {
        console.log('Error while submiting PWA for PageSpeed information: ' +
          pwa.id + ' ' + JSON.stringify(result));
      }
      return pwa;
    })
    .catch(err => {
      console.log('Error while submiting PWA for PageSpeed information: ' + pwa.id + ' ' + err);
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
  return libPageSpeed.getPageSpeedReport(pwa)
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
  return libPageSpeed.getWebPageTestReport(pwa)
    .then(webPageTestJson => {
      console.log('Updated PWA WebPageTest info: ', pwa.id);
      pwa.webPageTest = webPageTestJson[0];
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
