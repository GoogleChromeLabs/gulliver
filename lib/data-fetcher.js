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
const fs = require('fs');
const cheerio = require('cheerio');
const config = require('../config/config');

const createDOMPurify = require('dompurify');
const jsdom = require('jsdom');
const window = jsdom.jsdom('', {
  features: {
    FetchExternalResources: false, // disables resource loading over HTTP / filesystem
    ProcessExternalResources: false // do not execute JS within script blocks
  }
}).defaultView;
const DOMPurify = createDOMPurify(window);

const LIGHTHOUSE_SERVER_URL = config.get('LIGHTHOUSE_SERVER');
const USER_AGENT = ['Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36',
  '(KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36'].join(' ');

/**
 * Fetches the description from a webpage's metadata.
 *
 * @param {string} url of the page to get the description from
 * @return {Promise<string>} with the description or error
 */
function fetchMetadataDescription(url) {
  return fetchWithUA(url)
    .then(response => DOMPurify.sanitize(response.text()))
    .then(html => cheerio.load(html))
    .then($ => {
      return $('meta[name="description"]').attr('content');
    });
}

/**
 * Fetches the Lighthouse info for a PWA.
 *
 * More info about Lighthouse: https://github.com/GoogleChrome/lighthouse
 *
 * @param {string} absoluteStartUrl the full start url of the PWA
 * @return {Promise<string>} with the Lighthouse info
 */
function fetchLighthouseInfo(absoluteStartUrl) {
  return fetchJsonWithUA(LIGHTHOUSE_SERVER_URL.replace('URL', absoluteStartUrl));
}

/**
 * Fetches a URL using the USER_AGENT set on top of this file.
 *
 * @param {string} url to te be fetched
 * @return {Promise<Response>}
 */
function fetchWithUA(url) {
  const options = {
    method: 'GET',
    headers: {
      'user-agent': USER_AGENT
    }
  };
  return fetch(url, options);
}

/**
 * Fetches a URL using the USER_AGENT set on top of this file and returns Json.
 *
 * @param {string} url to te be fetched
 * @return {Promise<Json>}
 */
function fetchJsonWithUA(url) {
  return new Promise((resolve, reject) => {
    fetchWithUA(url)
      .then(response => {
        resolve(response.json());
      })
      .catch(err => {
        reject(err);
      });
  });
}

/**
 * Reads a file and returns a promise instead of the fs' callback.
 *
 * @param {string} filename to te be read
 * @return {Promise<data>} with the content of the file
 */
function readFile(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, {encoding: 'utf-8'}, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports = {
  fetchMetadataDescription,
  fetchLighthouseInfo,
  fetchWithUA,
  fetchJsonWithUA,
  readFile
};
