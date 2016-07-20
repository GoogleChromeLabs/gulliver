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

exports.fetch = function(manifestUrl, callback) {
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
      return callback(null, json);
    })
    .catch(err => {
      return callback(err);
    });
};
