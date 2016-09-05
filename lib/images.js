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

const gcloud = require('google-cloud');
const config = require('../config/config');

const CLOUD_BUCKET = config.get('CLOUD_BUCKET');

const storage = gcloud.storage({
  projectId: config.get('GCLOUD_PROJECT')
});
const bucket = storage.bucket(CLOUD_BUCKET);
const fetch = require('node-fetch');

/**
 * Fetches and Saves an Image to GCloud.
 *
 * @param {string} url image URL to retrieve
 * @param {string} destFile name of the destination file on GCP
 * @return {Promise<string>}
 */
function fetchAndSave(url, destFile) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => {
        return saveImage(response, destFile);
      })
      .then(url => {
        resolve(url);
      })
      .catch(err => {
        reject(err);
      });
  });
}

/**
 * @private
 * Saves the content from the response stream to GCloud.
 *
 * @param {stream.Readable} response
 * @param {string} destFile name of the destination file
 * @return {Promise<string>} full public URL of saved image
 */
function saveImage(response, destFile) {
  return new Promise((resolve, reject) => {
    if (response.status !== 200) {
      reject(new Error('Bad Response loading image: ' + response.status));
    }

    const contentType = response.headers.get('Content-Type');
    try {
      const file = bucket.file(destFile);

      const writeStream = file.createWriteStream({
        metadata: {
          contentType: contentType
        }
      });

      writeStream.on('error', err => {
        reject(err);
      });

      writeStream.on('finish', () => {
        resolve(getPublicUrl(destFile));
      });

      response.body.pipe(writeStream);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * @private
 * Given a filename, returns the GCloud address for it.
 *
 * @param {string} filename the original filename.
 * @return {Promise<string>} the public URL of the file.
 */
function getPublicUrl(filename) {
  return 'https://storage.googleapis.com/' + CLOUD_BUCKET + '/' + filename;
}

module.exports = {
  fetchAndSave: fetchAndSave
};
