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

const lighthouseLib = require('../../../lib/lighthouse');
const dataFetcher = require('../../../lib/data-fetcher');

let simpleMock = require('simple-mock');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
let assert = require('chai').assert;

const LIGHTHOUSE_JSON_EXAMPLE = './test/app/lib/lighthouse-example.json';

describe('lib.lighthouse', () => {
  it('processLighthouseJson(lighthouse-example.json) should work', () => {
    return dataFetcher.readFile(LIGHTHOUSE_JSON_EXAMPLE)
      .then(data => {
        let lighthouseInfo = lighthouseLib.processLighthouseJson(JSON.parse(data));
        assert.equal(lighthouseInfo.totalScore, 83);
        assert.equal(lighthouseInfo.lighthouseVersion, '1.1.6');
        // Agregation
        assert.equal(lighthouseInfo.aggregation.name, 'Progressive Web App');
        assert.equal(lighthouseInfo.aggregation.description,
          'These audits validate the aspects of a Progressive Web App.');
        assert.equal(lighthouseInfo.aggregation.scores.length, 8);
        // Audits
        assert.equal(lighthouseInfo.audits.length, 32);
        assert.equal(lighthouseInfo.audits[0].name, 'is-on-https');
        assert.equal(lighthouseInfo.audits[0].description, 'Site is on HTTPS');
        assert.equal(lighthouseInfo.audits[0].score, false);
      });
  });

  it('getLighthouseGraphByPwaId should return null if theres not data for PWA', () => {
    simpleMock.mock(lighthouseLib, 'getLighthouseByPwaId').resolveWith([]);
    return lighthouseLib.getLighthouseGraphByPwaId(123).should.be.fulfilled.then(json => {
      assert.equal(json, null);
      assert.equal(lighthouseLib.getLighthouseByPwaId.callCount, 1);
    });
  });

  let lighthouseData = {};
  lighthouseData.data = {
    date: '2016-10-27',
    id: '5768151446847488-2016-10-27',
    totalScore: 69,
    lighthouseInfo: [],
    lighthouseVersion: '1.1.6',
    pwaId: 5768151446847488,
    absoluteStartUrl: 'https://www.ampproject.org/'
  };

  it('getLighthouseGraphByPwaId should crete graph formatted data', () => {
    simpleMock.mock(lighthouseLib, 'getLighthouseByPwaId').resolveWith([lighthouseData]);
    return lighthouseLib.getLighthouseGraphByPwaId(123).should.be.fulfilled.then(json => {
      const date = new Date(Date.parse('2016-10-27'));
      assert.equal(json.cols[0].label, 'Date');
      assert.equal(json.cols[0].type, 'date');
      assert.equal(json.cols[1].label, 'Score');
      assert.equal(json.cols[1].type, 'number');
      assert.equal(json.rows[0].c[0].v,
        'Date(' + date.getFullYear() + ',' + date.getMonth() + ',' + date.getDate() + ')');
      assert.equal(json.rows[0].c[1].v, 69);
      assert.equal(lighthouseLib.getLighthouseByPwaId.callCount, 1);
    });
  });
});
