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
const pwaLib = require('../lib/pwa');
const libWebPerformance = require('../lib/web-performance');
const Lighthouse = require('../models/lighthouse');

const db = require('../lib/model-datastore');
const gcloud = require('google-cloud');
const ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT')
});

const ENTITY_NAME = 'Lighthouse';
const E_PWA_NOT_FOUND = exports.E_PWA_NOT_FOUND = 1;
const E_FETCHING_STORING_LIGHTHOUSE = exports.E_FETCHING_STORING_LIGHTHOUSE = 2;
const LIGTHOUSE_DATE_CHANGES = ['2016-12-01', '2017-03-01'];

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
      .filter('pwaId', '=', parseInt(pwaId, 10)).order('date', {descending: true}).limit(1);
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
 * Retrieves the Lighthouse data for a PWA
 *
 * @param {number} pwaId
 * @return {Promise<Lighthouse[]>}
 */
exports.getLighthouseByPwaId = function(pwaId) {
  return new Promise((resolve, reject) => {
    // Gets the last 2 years of Ligthouses for a PWA
    const query = ds.createQuery(ENTITY_NAME)
      .filter('pwaId', '=', parseInt(pwaId, 10)).order('date', {descending: true}).limit(730);
    ds.runQuery(query, (err, lighthouses) => {
      if (err) {
        return reject(err);
      }
      return resolve(lighthouses);
    });
  });
};

/**
 * Retrieves the Lighthouse Grpah data for a PWA
 * in Google Charts JSON format
 *
 * @param {number} pwaId
 * @return {Promise<Json>}
 */
exports.getLighthouseGraphByPwaId = function(pwaId) {
  // Gets the last 2 years of Ligthouses for a PWA
  return this.getLighthouseByPwaId(pwaId)
    .then(lighthouses => {
      if (lighthouses.length === 0) {
        return null;
      }
      // Graph data uses the Google Charts JSON format:
      // https://developers.google.com/chart/interactive/docs/reference#dataparam
      let data = {};
      data.cols = [{label: 'Date', type: 'date'}, {label: 'Score', type: 'number'},
        {label: 'LH change', type: 'number'}];
      data.rows = [];
      lighthouses.forEach(lighthouse => {
        let lighthouseChange = null;
        const date = new Date(Date.parse(lighthouse.data.date));
        // Add dots over the line to anotate lighthouse changes
        if (LIGTHOUSE_DATE_CHANGES.indexOf(lighthouse.data.date) > -1) {
          lighthouseChange = lighthouse.data.totalScore;
        }
        data.rows.push(
          {c: [{v:
            'Date(' + date.getFullYear() + ',' + date.getMonth() + ',' + date.getDate() + ')'},
          {v: lighthouse.data.totalScore},
          {v: lighthouseChange}]});
      });
      return data;
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
        libWebPerformance.getLighthouseReport(pwa)
          .then(lighthouseJson => {
            const reportData = lighthouseJson[0].rawData.value;
            const lighthouse = new Lighthouse(pwaId, pwa.absoluteStartUrl, reportData);
            this.save(lighthouse);
            return lighthouse;
          })
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
  let lighthouseInfo = {};
  lighthouseInfo.lighthouseVersion = lighthouseJson.lighthouseVersion;
  lighthouseJson.aggregations.forEach(aggregation => {
    let i = 0;
    let totalScore = 0;
    if (aggregation.name === 'Progressive Web App') {
      let scoreJson = [];
      aggregation.score.forEach(score => {
        scoreJson[i++] = {
          name: score.name,
          overall: Math.round(score.overall * 100),
          subItems: JSON.stringify(score.subItems)
        };
        totalScore += score.overall;
      });
      lighthouseInfo.aggregation = {
        name: aggregation.name,
        description: aggregation.description,
        scores: scoreJson
      };
      if (i > 0) {
        lighthouseInfo.totalScore = Math.round((totalScore / i) * 100);
      }
    }
  });
  let j = 0;
  lighthouseInfo.audits = [];
  for (let key in lighthouseJson.audits) {
    if (lighthouseJson.audits.hasOwnProperty(key)) {
      let audit = lighthouseJson.audits[key];
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
