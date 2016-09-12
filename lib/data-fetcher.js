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

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const config = require('../config/config');

const lighthouseServerUrl = config.get('LIGHTHOUSE_SERVER');

/**
 * Fetches the description from a webpage's metadata.
 *
 * @param {string} url of the page to get the description from
 * @return {Promise<string>} with the description or error
 */
exports.fetchMetadataDescription = function(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.text())
      .then(html => cheerio.load(html))
      .then($ => {
        resolve($('meta[name="description"]').attr('content'));
      })
      .catch(err => {
        reject(err);
      });
  });
};

/**
 * Fetches the Lighthouse info for a PWA.
 *
 * More info about Lighthouse: https://github.com/GoogleChrome/lighthouse
 *
 * @param {string} absoluteStartUrl the full start url of the PWA
 * @return {Promise<string>} with the Lighthouse info or error
 */
exports.fetchLighthouseInfo = function(absoluteStartUrl) {
  return new Promise((resolve, reject) => {
    fetch(lighthouseServerUrl.replace('URL', absoluteStartUrl))
      .then(response => {
        resolve(response.json());
      })
      .catch(err => {
        reject(err);
      });
  });
};
