/**
 * Copyright 2015-2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const dataFetcher = require('../lib/data-fetcher');
const Manifest = require('../models/manifest');

/**
 * Fetches the Manifest from the manifestUrl.
 *
 * @param {string} manifestUrl
 * @return {Promise<Manifest>}
 */
function fetchManifest(manifestUrl) {
  return dataFetcher.fetchJsonWithUA(manifestUrl)
    .then(json => new Manifest(manifestUrl, json));
}

/**
 * Wrapper for the manifest validator from lighthouse.
 *
 * @param {Manifest} manifest
 * @param {string} manifestUrl URL of manifest itself
 * @param {string} documentUrl URL of document that links to the manifest
 * @return string[] errors found in manifest
 */
function validateManifest(manifest, manifestUrl, documentUrl) {
  const parse = require('../third_party/manifest-parser.js');
  const res = parse(manifest, manifestUrl, documentUrl);
  // Lighthouse annotates the actual elements with validation errors; "flatten"
  // these here.
  function flatten(obj) {
    const debugString = obj.debugString ? [obj.debugString] : [];
    if (typeof obj.value !== 'object') {
      return debugString;
    }
    return Object.keys(obj.value).reduce((acc, k) => {
      return acc.concat(flatten(obj.value[k]));
    }, debugString);
  }
  return flatten(res);
}

module.exports = {
  fetchManifest,
  validateManifest
};
