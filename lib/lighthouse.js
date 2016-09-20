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
const pwaLib = require('../lib/pwa');
const Lighthouse = require('../models/lighthouse');

const db = require('../lib/model-' + config.get('DATA_BACKEND'));
const gcloud = require('google-cloud');
const ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT')
});

const ENTITY_NAME = 'Lighthouse';
const E_PWA_NOT_FOUND = exports.E_PWA_NOT_FOUND = 1;
const E_FETCHING_STORING_LIGHTHOUSE = exports.E_FETCHING_STORING_LIGHTHOUSE = 2;

/**
 * Saves a Lighthouse object into the DB.
 *
 * @param {Lighthouse} lighthouse
 * @return {Promise<Lighthouse>}
 */
exports.save = function(lighthouse) {
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
};

/**
 * Retrieves the latest Lighthouse for a PWA.
 *
 * @param {number} pwaId
 * @return {Promise<Lighthouse>}
 */
exports.findByPwaId = function(pwaId) {
  return new Promise((resolve, reject) => {
    const query = ds.createQuery(ENTITY_NAME)
      .filter('pwaId', pwaId).order('date', {descending: true});
    ds.runQuery(query, (err, lighthouses) => {
      if (err) {
        return reject(err);
      }

      if (lighthouses.length === 0) {
        return resolve(null);
      }

      return resolve(lighthouses[0].data);
    });
  });
};

/**
 * Generates a Lighthouse report for a PWA by its id.
 *
 * @param {number} pwaId
 * @return {Promise<Lighthouse>}
 */
exports.fetchAndSave = function(pwaId) {
  return new Promise((resolve, reject) => {
    pwaLib.find(pwaId)
      .then(pwa => {
        dataFetcher.fetchLighthouseInfo(pwa.absoluteStartUrl)
          .then(lighthouseJson => this.processLighthouseJson(lighthouseJson))
          .then(lighthouseInfo =>
            this.save(new Lighthouse(pwaId, pwa.absoluteStartUrl, lighthouseInfo)))
          .then(lighthouse => {
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
};

/**
 * Creates a new JSON with the main elemnts from a Lighthouse report.
 *
 * @param {string} lighthouseJson
 * @return {JSON}
 */
exports.processLighthouseJson = function(lighthouseJson) {
  var lighthouseInfo = {};
  lighthouseJson.aggregations.forEach(agregation => {
    var i = 0;
    var totalScore = 0;
    if (agregation.name === 'Progressive Web App') {
      var scoreJson = [];
      agregation.score.forEach(score => {
        scoreJson[i++] = {
          name: score.name,
          overall: Math.round(score.overall * 100),
          subItems: JSON.stringify(score.subItems)
        };
        totalScore += score.overall;
      });
      lighthouseInfo.agregation = {
        name: agregation.name,
        description: agregation.description,
        scores: scoreJson
      };
      if (i > 0) {
        lighthouseInfo.totalScore = Math.round((totalScore / i) * 100);
      }
    }
  });
  var j = 0;
  lighthouseInfo.audits = [];
  for (var key in lighthouseJson.audits) {
    if (lighthouseJson.audits.hasOwnProperty(key)) {
      var audit = lighthouseJson.audits[key];
      lighthouseInfo.audits[j++] = {
        name: audit.name,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue,
        optimalValue: audit.optimalValue
      };
    }
  }
  return lighthouseInfo;
};
