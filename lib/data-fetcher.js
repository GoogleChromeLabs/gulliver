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

const LIGHTHOUSE_SERVER_URL = config.get('LIGHTHOUSE_SERVER');
const USER_AGENT = ['Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36',
  '(KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36'].join(' ');

function fetchMetadataDescription(url) {
  return new Promise((resolve, reject) => {
    fetchWithUA(url)
      .then(response => response.text())
      .then(html => cheerio.load(html))
      .then($ => {
        resolve($('meta[name="description"]').attr('content'));
      })
      .catch(err => {
        reject(err);
      });
  });
}

function fetchLighthouseInfo(absoluteStartUrl) {
  return fetchJsonWithUA(LIGHTHOUSE_SERVER_URL.replace('URL', absoluteStartUrl));
}

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

function fetchWithUA(url) {
  const options = {
    method: 'GET',
    headers: {
      'user-agent': USER_AGENT
    }
  };
  return fetch(url, options);
}

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
