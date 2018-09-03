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
const url = require('url');

/**
 * Class representing a Web App Manifest
 */
class Manifest {
  constructor(manifestUrl, jsonManifest) {
    this.url = manifestUrl;
    this.raw = JSON.stringify(jsonManifest);
    this.name = jsonManifest.name;
    this.shortName = jsonManifest.short_name;
    this.description = jsonManifest.description;
    this.startUrl = jsonManifest.start_url;
    this.backgroundColor = jsonManifest.background_color;
    this.icons = jsonManifest.icons;
    this.scope = jsonManifest.scope;
  }

  getBestIcon() {
    function getIconSize(icon) {
      if (!icon.sizes) {
        return 0;
      }
      return parseInt(icon.sizes.substring(0, icon.sizes.indexOf('x')), 10);
    }

    if (!this.icons) {
      return null;
    }

    let bestIcon;
    let bestIconSize;

    for (let icon of this.icons) {
      if (!bestIcon) {
        bestIcon = icon;
        bestIconSize = getIconSize(icon);
      }

      const iconSize = getIconSize(icon);
      if (iconSize > bestIconSize) {
        bestIcon = icon;
        bestIconSize = iconSize;
      }

      // We can return 128 and 144 even if there are bigger ones.
      if (iconSize === 128 || iconSize === 144) {
        return icon;
      }
    }
    return bestIcon;
  }

  /** Gets the Url for the largest icon in the Manifest */
  getBestIconUrl() {
    let bestIcon = this.getBestIcon();
    if (!bestIcon || !bestIcon.src) {
      return '';
    }
    return url.resolve(this.url, bestIcon.src);
  }
}

module.exports = Manifest;
