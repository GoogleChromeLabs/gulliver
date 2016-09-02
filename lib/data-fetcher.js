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

var fetch = require('node-fetch');
const cheerio = require('cheerio');

const LIGHTHOUSE_SERVER = 'https://api-dot-pwa-directory.appspot.com/audit?url=URL&fmt=json';

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

exports.fetchLighthouseInfo = function(absoluteStartUrl) {
  return new Promise((resolve, reject) => {
    fetch(LIGHTHOUSE_SERVER.replace('URL', absoluteStartUrl))
      .then(response => {
        resolve(response.json());
      })
      .catch(err => {
        reject(err);
      });
  });
};
