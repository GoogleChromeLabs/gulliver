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

/* global describe it */
'use strict';

const assert = require('assert');
const lighthouseLib = require('../../lib/lighthouse');
const dataFetcher = require('../../lib/data-fetcher');

const LIGHTHOUSE_JSON_EXAMPLE = './test/lib/lighthouse-example.json';

describe('processLighthouseJson', () => {
  it('processLighthouseJson(lighthouse-example.json) should work', () => {
    return dataFetcher.readFile(LIGHTHOUSE_JSON_EXAMPLE)
      .then(data => {
        var lightHouseInfo = lighthouseLib.processLighthouseJson(JSON.parse(data));
        assert.equal(lightHouseInfo.totalScore, 82);
        // Agregation
        assert.equal(lightHouseInfo.agregation.name, 'Progressive Web App');
        assert.equal(lightHouseInfo.agregation.description,
          'These audits validate the aspects of a Progressive Web App.');
        assert.equal(lightHouseInfo.agregation.scores.length, 8);
        // Audits
        assert.equal(lightHouseInfo.audits.length, 33);
        assert.equal(lightHouseInfo.audits[0].name, 'is-on-https');
        assert.equal(lightHouseInfo.audits[0].description, 'Site is on HTTPS');
        assert.equal(lightHouseInfo.audits[0].score, false);
      });
  });
});
