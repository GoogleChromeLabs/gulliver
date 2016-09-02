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

const config = require('../config/config');
const images = require('../lib/images');
const Manifest = require('../models/manifest');
const Pwa = require('../models/pwa');
const dataFetcher = require('../lib/data-fetcher');
const db = require('../lib/model-' + config.get('DATA_BACKEND'));
const gcloud = require('gcloud');
const ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT')
});

const ENTITY_NAME = 'PWA';
const E_MANIFEST_ERROR = exports.E_MANIFEST_ERROR = 2;

exports.list = function(numResults, pageToken, callback) {
  db.list(ENTITY_NAME, numResults, pageToken)
    .then(result => {
      const pwas = result.entities.map(pwa => {
        return Object.assign(new Pwa(), pwa);
      });
      callback(null, pwas, result.hasMore);
    })
    .catch(err => {
      callback(err);
    });
};

exports.find = function(key, callback) {
  db.read(ENTITY_NAME, key)
    .then(pwa => {
      const pwaInstance = Object.assign(new Pwa(), pwa);
      callback(null, pwaInstance);
    })
    .catch(err => {
      callback(err);
    });
};

exports.findByManifestUrl = function(manifestUrl, callback) {
  const query = ds.createQuery(ENTITY_NAME).filter('manifestUrl', manifestUrl);
  ds.runQuery(query, (err, pwas) => {
    if (err) {
      return callback(err, null);
    }

    if (pwas.length === 0) {
      return callback(null, null);
    }

    pwas[0].data.id = pwas[0].key.id;
    var pwa = Object.assign(new Pwa(), pwas[0].data);
    return callback(null, pwa);
  });
};

exports.save = function(pwa, callback) {
  // TODO: Check manifestUrl with regexp
  if (!pwa.manifestUrl) {
    return callback('Missing manifestUrl', null);
  }

  if (!pwa.user.id) {
    return callback('Missing user information', null);
  }

  this.findByManifestUrl(pwa.manifestUrl, (err, existingPwa) => {
    if (err) {
      return callback(err);
    }

    if (!existingPwa) {
      existingPwa = pwa;
    }

    Manifest.fetch(pwa.manifestUrl)
      .then(manifest => {
        existingPwa.manifest = manifest;

        // Reading Description from Meta if not present in the Manifest
        if (!existingPwa.description && existingPwa.absoluteStartUrl) {
          dataFetcher.fetchMetadataDescription(existingPwa.absoluteStartUrl)
            .then(description => {
              existingPwa.metaDescription = description;
            })
            .catch(err => {
              console.log(err);
            });
        }

        db.update(ENTITY_NAME, existingPwa.id, existingPwa)
          .then(savedPwa => {
            updateIcon(savedPwa, manifest);
            callback(null, savedPwa);
          })
          .catch(err => {
            callback(err);
          });
      })
      .catch(err => {
        console.log(err);
        return callback(E_MANIFEST_ERROR);
      });
  });
};

function updateIcon(pwa, manifest) {
  const url = manifest.getBestIconUrl();
  const extension = url.substring(url.lastIndexOf('.'), url.length);
  const bucketFileName = pwa.id + extension;

  images.fetchAndSave(url, bucketFileName)
    .then(savedUrl => {
      pwa.iconUrl = savedUrl;
      return db.update(ENTITY_NAME, pwa.id, pwa);
    })
    .then(pwa => {
      console.log('Updated PWA Image: ', pwa.id);
    })
    .catch(err => {
      console.log(err);
    });
}

exports.delete = function(key, callback) {
  db.delete(ENTITY_NAME, key)
    .then(() => {
      callback();
    })
    .catch(err => {
      callback(err);
    });
};
