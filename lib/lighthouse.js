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
const db = require('../lib/model-' + config.get('DATA_BACKEND'));
const pwaLib = require('../lib/pwa');
const Lighthouse = require('../models/lighthouse');

const ENTITY_NAME = 'Lighthouse';
const E_PWA_NOT_FOUND = 1;
const E_FETCHING_STORING_LIGHTHOUSE = 2;

/**
 * Saves a Lighthouse object into the DB.
 *
 * @param {Lighthouse} lighthouse
 * @return {Promise<Lighthouse>}
 */
function save(lighthouse) {
  return new Promise((resolve, reject) => {
    db.update(ENTITY_NAME, lighthouse.id, lighthouse)
      .then(result => {
        return resolve(result);
      })
      .catch(err => {
        console.log(err);
        return reject('Error saving the Lighthouse report');
      });
  });
}

/**
 * Generates a Lighthouse report for a PWA by its id.
 *
 * @param {number} pwaId
 * @return {Promise<Lighthouse>}
 */
function fetchAndSave(pwaId) {
  return new Promise((resolve, reject) => {
    pwaLib.find(pwaId)
      .then(pwa => {
        dataFetcher.fetchLighthouseInfo(pwa.absoluteStartUrl)
          .then(lighthouseJson => processLighthouseJson(lighthouseJson))
          .then(lighthouseInfo =>
            save(new Lighthouse(pwaId, pwa.absoluteStartUrl, lighthouseInfo)))
          .then(lighthouse => {
            console.log('Updated PWA Lighthouse info for: ', pwaId);
            return resolve(lighthouse);
          })
          .catch(err => {
            console.error(err);
            return reject(E_FETCHING_STORING_LIGHTHOUSE);
          });
      })
      .catch(err => {
        console.error(err);
        return reject(E_PWA_NOT_FOUND);
      });
  });
}

/**
 * Creates a new JSON with the main elemnts from a Lighthouse report.
 *
 * @param {string} lighthouseJson
 * @return {JSON}
 */
function processLighthouseJson(lighthouseJson) {
  var lighthouseInfo = {};
  lighthouseJson.aggregations.forEach(section => {
    var i = 0;
    var totalScore = 0;
    if (section.name === 'Progressive Web App') {
      lighthouseInfo.name = section.name;
      lighthouseInfo.description = section.description;

      var scoreJson = [];
      section.score.forEach(score => {
        scoreJson[i++] = {
          name: score.name,
          overall: Math.round(score.overall * 100),
          subItems: JSON.stringify(score.subItems)
        };
        totalScore += score.overall;
      });
      lighthouseInfo.scores = scoreJson;
      if (i > 0) {
        lighthouseInfo.totalScore = Math.round((totalScore / i) * 100);
      }
    }
  });
  return lighthouseInfo;
}

module.exports = {
  fetchAndSave,
  processLighthouseJson,
  E_PWA_NOT_FOUND,
  E_FETCHING_STORING_LIGHTHOUSE
};
