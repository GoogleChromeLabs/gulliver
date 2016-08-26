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

const uri = require('urijs');

class Pwa {
  constructor(manifestUrl) {
    this.manifestUrl = manifestUrl;
    this.id = undefined;
    this.created = Date.now();
    this.updated = this.created;
    this.visible = true;
  }

  mergeManifest(manifest) {
    this.name = manifest.name;
    this.description = manifest.description;
    this.startUrl = manifest.start_url || '';
    this.absoluteStartUrl = uri(manifest.start_url).absoluteTo(manifest.url).toString() || '';
    this.backgroundColor = manifest.background_color || '#ffffff';
    this.manifest = JSON.stringify(manifest);
  }
}

module.exports = Pwa;
