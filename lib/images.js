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
const dataFetcher = require('../lib/data-fetcher');
const sharp = require('sharp');
const stream = require('stream');
const strongDataUri = require('strong-data-uri');
const url = require('url');
const zlib = require('zlib');

const cloudStorage = require('@google-cloud/storage');
const CLOUD_BUCKET = config.get('CLOUD_BUCKET');
const storage = cloudStorage({
  projectId: config.get('GCLOUD_PROJECT')
});
const bucket = storage.bucket(CLOUD_BUCKET);

const CACHE_CONTROL_EXPIRES = 60 * 60 * 24; // 1 day.

/**
 * Fetches and Saves an Image to Google Cloud Storage.
 *
 * @param {string} url image URL to retrieve
 * @param {string} destFile name of the destination file
 * @return {Promise<url[]>>} URLs for the new images in Google Cloud Storage
 */
function fetchAndSave(imageUrl, destFile) {
  const parsedUrl = url.parse(imageUrl);
  switch (parsedUrl.protocol) {
    case 'data:': {
      return this.dataUriAndSave(imageUrl);
    }
    case 'http:':
    case 'https:': {
      return dataFetcher.fetchWithUA(imageUrl)
        .then(response => {
          if (response.status !== 200) {
            return Promise.reject(new Error(
              'Bad Response (' + response.status + ') loading image: ' + response.url));
          }
          const contentType = response.headers.get('Content-Type');
          return this.saveImages(response.body, destFile, contentType);
        })
        .then(savedUrls => {
          return savedUrls;
        });
    }
    default: {
      return Promise.reject('Unsupported Protocol: ' + parsedUrl.protocol);
    }
  }
}

/**
 * Process a Data URI Image and Saves to Google Cloud Storage.
 *
 * @param {string} url Data URI image URL to process
 * @param {string} destFile name of the destination file
 * @return {Promise<url[]>} URLs for the new images in Google Cloud Storage
 */
function dataUriAndSave(url, destFile) {
  const buffer = strongDataUri.decode(url);
  const contentType = buffer.mimetype;
  const bufferStream = new stream.PassThrough();
  bufferStream.end(buffer);
  return this.saveImages(bufferStream, destFile, contentType);
}

/**
 * Saves the content from the stream to Google Cloud Storage
 * with 3 difference sizes, original, 128*128px and 64*64px
 *
 * @param {stream.Readable} stream
 * @param {string} destFile name of the destination file
 * @param {contentType} destFile image's mimetype
 * @return {Promise<url[]>} URLs for the new images in Google Cloud Storage
 */
function saveImages(readStream, destFile, contentType) {
  return Promise.all([
    this.saveImage(readStream, destFile, contentType),
    this.saveImage(readStream, destFile, contentType, 128),
    this.saveImage(readStream, destFile, contentType, 64)
  ]);
}

/**
 * Saves the content from the stream to Google Cloud Storage.
 *
 * @param {stream.Readable} stream
 * @param {string} destFile name of the destination file
 * @param {contentType} destFile image's mimetype
 * @param {int} size image's new size
 * @return {Promise<string>} full public URL of saved image in Google Cloud Storage
 */
function saveImage(readStream, destFile, contentType, size) {
  const destFilename = (size || 'original') + '_' + destFile;
  return new Promise((resolve, reject) => {
    const file = bucket.file(destFilename);
    const writeStream = file.createWriteStream({
      metadata: {
        contentType: contentType,
        contentEncoding: 'gzip',
        cacheControl: 'public, max-age=' + CACHE_CONTROL_EXPIRES
      }
    });

    writeStream.on('error', err => {
      reject(err);
    });

    writeStream.on('finish', () => {
      resolve(getPublicUrl(destFilename));
    });

    const gzip = zlib.createGzip();
    if (size && contentType !== 'image/svg+xml') {
      const transformer = sharp().resize(size);
      transformer.on('error', err => {
        reject(err);
      });
      readStream.pipe(transformer).pipe(gzip).pipe(writeStream);
    } else {
      readStream.pipe(gzip).pipe(writeStream);
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
  fetchAndSave,
  saveImage,
  saveImages,
  dataUriAndSave
};
