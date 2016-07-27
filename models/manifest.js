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

const fetch = require('node-fetch');
const DOMAIN_REGEXP = /(http[s]*:\/\/[a-z0-9A-Z-\.]+)(\/(.*?\/)*)*/;

class Manifest {
  constructor(url, json) {
    this.url = url;

    //Copy JSON properties to Manifest
    const keys = Object.keys(json);
    for (let i = 0; i < keys.length; i++) {
      this[keys[i]] = json[keys[i]];            
    }
  }

  /** Gets the Url for the largest icon in the Manifest */
  getBestIconUrl() {
    if (!this.icons) {
      return '';
    }
    const iconUrl = this.icons[0].src;
    if (iconUrl.match(DOMAIN_REGEXP)) {
      return iconUrl;
    }

    const match = DOMAIN_REGEXP.exec(this.url);
    const domain = match[1];
    const path = match[2] || '';

    if (iconUrl[0] === '/') {
      return domain + iconUrl;
    }

    return domain + path + iconUrl;
  }

  static fetch(manifestUrl, callback) {
    const options = {
      method: 'GET',
      headers: {
        'user-agent': [
          'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36',
          '(KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36'
        ].join(' ')
      }
    };

    fetch(manifestUrl, options)
      .then(response => {
        return response.json();
      })
      .then(json => {
        return callback(null, new Manifest(manifestUrl, json));
      })
      .catch(err => {
        return callback(err);
      });
  }
}

module.exports.Manifest = Manifest;
