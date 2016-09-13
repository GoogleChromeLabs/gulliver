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
var libImages = require('../lib/images');
const Pwa = require('../models/pwa');
const dataFetcher = require('../lib/data-fetcher');
const lighthouseLib = require('../lib/lighthouse');
const manifestLib = require('../lib/manifest');

var db = require('../lib/model-' + config.get('DATA_BACKEND'));
const gcloud = require('google-cloud');
const ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT')
});

const ENTITY_NAME = 'PWA';
const E_MANIFEST_ERROR = exports.E_MANIFEST_ERROR = 2;
const SORT_TYPE_MAP = new Map([
  ['name', {field: 'manifest.name'}],
  ['newest', {field: 'created', config: {descending: true}}],
  ['score', {field: 'lighthouseScore', config: {descending: true}}]
]);

exports.list = function(numResults, pageToken, sort) {
  return new Promise((resolve, reject) => {
    let sortType = SORT_TYPE_MAP.get('name');
    if (sort) {
      sortType = SORT_TYPE_MAP.get(sort) || sortType;
    }
    db.list(ENTITY_NAME, numResults, pageToken, sortType)
      .then(result => {
        const pwas = result.entities.map(pwa => {
          return Object.assign(new Pwa(), pwa);
        });
        resolve({
          pwas: pwas,
          hasMore: result.hasMore
        });
      })
      .catch(err => {
        reject(err);
      });
  });
};

exports.find = function(key) {
  return new Promise((resolve, reject) => {
    db.read(ENTITY_NAME, key)
      .then(pwa => {
        const pwaInstance = Object.assign(new Pwa(), pwa);
        resolve(pwaInstance);
      })
      .catch(err => {
        reject(err);
      });
  });
};

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
      var pwa = Object.assign(new Pwa(), pwas[0].data);
      return resolve(pwa);
    });
  });
};

exports.save = function(pwa) {
  return new Promise((resolve, reject) => {
    // TODO: Check manifestUrl with regexp
    if (!pwa.manifestUrl) {
      return reject('Missing manifestUrl');
    }

    if (!pwa.user.id) {
      return reject('Missing user information');
    }

    this.findByManifestUrl(pwa.manifestUrl)
      .then(existingPwa => {
        pwa = existingPwa || pwa;
        pwa.updated = new Date();
        return manifestLib.fetchManifest(pwa.manifestUrl);
      })
      .then(manifest => {
        pwa.manifest = manifest;
        return updateMetadataDescription(pwa);
      })
      .then(description => {
        pwa.metaDescription = description;
        return db.update(ENTITY_NAME, pwa.id, pwa);
      })
      .then(savedPwa => {
        this.updateIcon(savedPwa, pwa.manifest);
        lighthouseLib.fetchAndSave(savedPwa.id)
          .then(lighthouse => {
            savedPwa.lighthouseScore = lighthouse.lighthouseInfo.totalScore;
            db.update(ENTITY_NAME, savedPwa.id, savedPwa);
          });
        return resolve(savedPwa);
      })
      .catch(err => {
        console.log(err);
        return reject(E_MANIFEST_ERROR);
      });
  });
};

/**
 * Reading Description from Meta if not present in the Manifest
 */
function updateMetadataDescription(pwa) {
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
}

exports.updateIcon = function(pwa, manifest) {
  const bestIconUrl = manifest.getBestIconUrl();
  const extension = path.extname(url.parse(bestIconUrl).pathname);
  const bucketFileName = pwa.id + extension;

  return new Promise((resolve, reject) => {
    libImages.fetchAndSave(bestIconUrl, bucketFileName)
      .then(savedUrl => {
        pwa.iconUrl = savedUrl;
        return db.update(ENTITY_NAME, pwa.id, pwa);
      })
      .then(pwa => {
        console.log('Updated PWA Image: ', pwa.id);
        resolve(pwa);
      })
      .catch(err => {
        console.log(err);
        resolve(null);
      });
  });
};

exports.delete = function(key) {
  return db.delete(ENTITY_NAME, key);
};
