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

const WEBPERFORMANCE_SERVER_URL = config.get('WEBPERFORMANCE_SERVER');
const WEBPERFORMANCE_SERVER_API_KEY = config.get('WEBPERFORMANCE_SERVER_API_KEY');
const WEBPERFORMANCE_SERVER_WEBPAGEURL = WEBPERFORMANCE_SERVER_URL + 'webpageurl';
const WEBPERFORMANCE_SERVER_PAGESPEED_REPORT = WEBPERFORMANCE_SERVER_URL + 'pagespeedreport/';
const WEBPERFORMANCE_SERVER_WEBPAGETEST_REPORT = WEBPERFORMANCE_SERVER_URL + 'webpagetestreport/';
const WEBPERFORMANCE_SERVER_LIGHTHOUSE_REPORT = WEBPERFORMANCE_SERVER_URL + 'lighthousereport/';

function submitToWebPerformanceService(pwa) {
  const body = {
    id: pwa.id,
    url: pwa.absoluteStartUrl,
    source: 'pwa-directory',
    description: pwa.description,
    created: pwa.created
  };
  return dataFetcher.postJson(
    WEBPERFORMANCE_SERVER_WEBPAGEURL + '?key=' + WEBPERFORMANCE_SERVER_API_KEY, body);
}

/**
 * Submit PWA to the WebPerformance service.
 *
 * @param {number} a PWA
 * @return {Promise<Lighthouse>}
 */
exports.submitWebPageUrl = function(pwa) {
  return new Promise((resolve, reject) => {
    submitToWebPerformanceService(pwa)
      .then(result => {
        return resolve(result);
      })
      .catch(err => {
        return reject(err);
      });
  });
};

/**
 * Get Report for PWA.
 *
 * @param {PWA} a PWA
 * @return {Promise<Json>}
 */
function getReport(url) {
  return dataFetcher.fetchWithUA(url)
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
}

/**
 * Get PageSpeed Report for PWA.
 *
 * @param {PWA} a PWA
 * @return {Promise<Json>}
 */
exports.getPageSpeedReport = function(pwa) {
  return getReport(WEBPERFORMANCE_SERVER_PAGESPEED_REPORT + pwa.id + '?limit=1');
};

/**
 * Get WebPageTest Report for PWA.
 *
 * @param {PWA} a PWA
 * @return {Promise<Json>}
 */
exports.getWebPageTestReport = function(pwa) {
  return getReport(WEBPERFORMANCE_SERVER_WEBPAGETEST_REPORT + pwa.id + '?limit=1');
};

/**
 * Get Lighthouse Report for PWA.
 *
 * @param {PWA} a PWA
 * @return {Promise<Json>}
 */
exports.getLighthouseReport = function(pwa) {
  return getReport(WEBPERFORMANCE_SERVER_LIGHTHOUSE_REPORT + pwa.id + '?limit=1');
};
