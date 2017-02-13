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

const PAGESPEED_SERVER_URL = config.get('PAGESPEED_SERVER');
const PAGESPEED_SERVER_API_KEY = config.get('PAGESPEED_SERVER_API_KEY');
const PAGESPEED_SERVER_WEBPAGEURL = PAGESPEED_SERVER_URL + 'webpageurl';
const PAGESPEED_SERVER_PAGESPEED_REPORT = PAGESPEED_SERVER_URL + 'pagespeedreport/';
const PAGESPEED_SERVER_WEBPAGETEST_REPORT = PAGESPEED_SERVER_URL + 'webpagetestreport/';

function submitPageSpeedUrl(pwa) {
  const body = {
    id: pwa.id,
    url: pwa.absoluteStartUrl,
    source: 'pwa-directory',
    description: pwa.description
  };
  return dataFetcher.postJson(
    PAGESPEED_SERVER_WEBPAGEURL + '?key=' + PAGESPEED_SERVER_API_KEY, body);
}

/**
 * Submit PWA to the PageSpeed service.
 *
 * @param {number} a PWA
 * @return {Promise<Lighthouse>}
 */
exports.submitWebPageUrl = function(pwa) {
  return new Promise((resolve, reject) => {
    submitPageSpeedUrl(pwa)
      .then(result => {
        return resolve(result);
      })
      .catch(err => {
        return reject(err);
      });
  });
};

/**
 * Get PageSpeed Report for PWA.
 *
 * @param {PWA} a PWA
 * @return {Promise<Json>}
 */
exports.getPageSpeedReport = function(pwa) {
  return dataFetcher.fetchWithUA(PAGESPEED_SERVER_PAGESPEED_REPORT + pwa.id + '?limit=1')
    .then(response => {
      if (response.status === 200) {
        return response.json();
      } else if (response.status === 404) {
        return Promise.reject('not available yet');
      }
      return Promise.reject(response);
    })
    .catch(err => {
      return Promise.reject(err);
    });
};

/**
 * Get WebPageTest Report for PWA.
 *
 * @param {PWA} a PWA
 * @return {Promise<Json>}
 */
exports.getWebPageTestReport = function(pwa) {
  return dataFetcher.fetchWithUA(PAGESPEED_SERVER_WEBPAGETEST_REPORT + pwa.id + '?limit=1')
    .then(response => {
      if (response.status === 200) {
        return response.json();
      } else if (response.status === 404) {
        return Promise.reject('not available yet');
      }
      return Promise.reject(response);
    })
    .catch(err => {
      return Promise.reject(err);
    });
};
