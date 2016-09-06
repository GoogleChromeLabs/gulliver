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
const fs = require('fs');
const lighthouseLib = require('../../lib/lighthouse');

function readfile() {
  return new Promise(function(resolve, reject) {
    fs.open('./lighthouse-example.json', 'r', function(err, fileToRead) {
      if (err) {
        reject(err);
      } else {
        fs.readFile(fileToRead, {encoding: 'utf-8'}, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      }
    });
  });
}

describe('processLighthouseJson', () => {
  it('processLighthouseJson(lighthouse-example.json) should work', () => {
    return readfile()
      .then(data => {
        var lightHouseInfo = lighthouseLib.processLighthouseJson(JSON.parse(data));
        assert.equal(lightHouseInfo.name, 'Progressive Web App');
        assert.equal(lightHouseInfo.description,
          'These audits validate the aspects of a Progressive Web App.');
        assert.equal(lightHouseInfo.scores.length, 8);
        assert.equal(lightHouseInfo.totalScore, 82);
      });
  });
});
