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

const URL = require('url');
const fetch = require('node-fetch');
const fs = require('fs');
const cheerio = require('cheerio');
const config = require('../config/config');
const spdy = require('spdy');

const FIREBASE_AUTH = config.get('FIREBASE_AUTH');
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
    .then(response => response.text())
    .then(html => cheerio.load(html))
    .then($ => {
      return $('meta[name="description"]').attr('content');
    });
}

/**
 * Fetches the manifest URL from a webpage's link rel header.
 *
 * @param {string} url of the page to get the manifest link from
 * @return {Promise<string>} with the URL or error
 */
function fetchLinkRelManifestUrl(pageUrl) {
  return fetchWithUA(pageUrl)
    .then(response => response.text())
    .then(html => cheerio.load(html))
    .then($ => $('link[rel="manifest"]').attr('href'))
    .then(newUrl => {
      return URL.resolve(pageUrl, newUrl);
    });
}

/**
 * Fetches a URL using the USER_AGENT set on top of this file.
 * Uses spdy for http2 support
 *
 * @param {string} url to te be fetched
 * @return {Promise<Response>}
 */
function fetchWithUA(url) {
  const options = {
    method: 'GET',
    headers: {
      'user-agent': USER_AGENT
    },
    timeout: 5000
  };
  return fetch(url, options).then(res => {
    if (res.headers._headers.upgrade) {
      res.text(); // consume res.body to avoid issues.
      // spdy agent for h2 support
      const urlObject = URL.parse(url);
      const agent = spdy.createAgent({
        host: urlObject.host,
        port: 443,
        spdy: {
          plain: false,
          ssl: true
        }
      });
      options.agent = agent;
      return fetch(url, options);
    }
    return Promise.resolve(res);
  });
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

function _firebaseOptions(payload) {
  if (payload) {
    return {
      method: 'POST',
      headers: {
        'Authorization': FIREBASE_AUTH,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    };
  }

  return {
    method: 'GET',
    headers: {
      Authorization: FIREBASE_AUTH
    }
  };
}

function _handleFirebaseResponse(response) {
  // Request was successful. Resolve Promise with the JSON.
  if (response.status === 200) {
    return response.json();
  }

  // Request returned an error response. Reject with an error message.
  return response.text()
    .then(text => {
      return Promise.reject(
        'Request failed with response: ' + response.status + ' Message: ' + text);
    });
}

function firebaseFetch(url, payload) {
  const options = _firebaseOptions(payload);
  const res = fetch(url, options);
  res.then(r => {
    if (r.status !== 200) {
      r.text().then(msg => {
        // Add codebase-wide logging system
        console.warn(`firebaseFetch error: GET ${url} => ${r.status}: ${msg}`);
      });
    }
  });
  return res.then(_handleFirebaseResponse);
}

/**
 * POST to url
 *
 * @param {string} url to POST to
 * * @param {string} body of the POST
 * @return {Promise<Response>}
 */
function postJson(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)});
}

module.exports = {
  fetchMetadataDescription,
  fetchLinkRelManifestUrl,
  fetchWithUA,
  fetchJsonWithUA,
  firebaseFetch,
  _firebaseOptions,
  _handleFirebaseResponse,
  readFile,
  postJson
};
