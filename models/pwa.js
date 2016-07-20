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
const manifest = require('./manifest');
const db = require('../lib/model-' + config.get('DATA_BACKEND'));
const gcloud = require('gcloud');
const ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT')
});
const ENTITY_NAME = 'PWA';

exports.list = function(numResults, pageToken, callback) {
  db.list(ENTITY_NAME, numResults, pageToken, callback);
};

exports.find = function(key, callback) {
  db.read(ENTITY_NAME, key, (err, data) => {
    if (err) {
      return callback(err, null);
    }

    // Transform manifest into useful data.
    data.manifestData = JSON.parse(data.manifest);

    callback(null, data);
  });
};

exports.findByManifestUrl = function(manifestUrl, callback) {
  const query = ds.createQuery(ENTITY_NAME).filter('manifestUrl', manifestUrl);
  ds.runQuery(query, (err, dbPWAs) => {
    if (err) {
      return callback(err, null);
    }

    if (dbPWAs.length === 0) {
      return callback(null, null);
    }

    const pwa = dbPWAs[0];
    pwa.data.id = pwa.key.id;

    return callback(null, pwa);
  });
};

exports.save = function(pwa, callback) {
   // TODO Check manifestUrl with regexp
  if (!pwa.manifestUrl) {
    return callback('Missing manifestUrl', null);
  }

  this.findByManifestUrl(pwa.manifestUrl, (err, manifestPwa) => {
    if (err) {
      return callback(err);
    }

    if (manifestPwa && (!pwa.id || manifestPwa.data.id.toString() !== pwa.id)) {
      return callback(
          'Manifest already Registered for a different PWA', null);
    }

    manifest.fetch(pwa.manifestUrl, (err, json) => {
      if (err) {
        return callback(err);
      }
      pwa.manifest = JSON.stringify(json);
      db.update(ENTITY_NAME, pwa.id, pwa, callback);
    });
  });
};

exports.delete = function(key, callback) {
  db.delete(ENTITY_NAME, key, callback);
};
