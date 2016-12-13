/**
 * Copyright 2015-2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const libLighthouse = require('../lib/lighthouse');

/**
 * Class representing a Lighthouse report for a PWA
 *
 * absoluteStartUrl is the absoluteStartUrl of the PWA
 * lighthouseJson is the Lighthouse's report as JSON object
 */
class Lighthouse {
  constructor(pwaId, absoluteStartUrl, lighthouseJson) {
    this.pwaId = pwaId;
    this.absoluteStartUrl = absoluteStartUrl;
    this._lighthouseJson = parseToJson(lighthouseJson);
    this.lighthouseInfo = libLighthouse.processLighthouseJson(this._lighthouseJson);
    this.totalScore = this.lighthouseInfo.totalScore;
    this.lighthouseVersion = this.lighthouseInfo.lighthouseVersion;
    this.date = (new Date()).toISOString().slice(0, 10);
    this.id = this.pwaId + '-' + this.date;
  }

  get lighthouseJson() {
    return this._lighthouseJson;
  }

  set lighthouseJson(value) {
    // lighthouseJson is stored as a string in the datastore
    this._lighthouseJson = parseToJson(value);
  }
}

function parseToJson(value) {
  if (value && Object.prototype.toString.call(value) === '[object String]') {
    return JSON.parse(value);
  }
  return value;
}

module.exports = Lighthouse;
