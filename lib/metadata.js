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

/**
 * Generates the default metadata from a http request
 */
module.exports.fromRequest = function(req, newUrl) {
  const host = req.get('host');
  const url = newUrl || req.protocol + '://' + host + req.originalUrl;
  const timestamp = new Date().toISOString();
  const logo = req.protocol + '://' + host + '/favicons/android-chrome-512x512.png';
  const leader = req.protocol + '://' + host + '/img/pwa-directory-preview.png';
  const metadata = {
    url: url,
    host: host,
    datePublished: timestamp,
    dateModified: timestamp,
    logo: logo,
    logoWidth: '512',
    logoHeight: '512',
    leader: leader,
    leaderWidth: '2008',
    leaderHeight: '1386'
  };
  return metadata;
};
