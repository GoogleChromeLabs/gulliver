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

const DOMAIN_PATH_REGEXP = /(http[s]*:\/\/[a-z0-9A-Z-\.]+)(\/(.*?\/)*)*/;

class Manifest {
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

    this.icons.forEach(icon => {
      if (!bestIcon) {
        bestIcon = icon;
        bestIconSize = getIconSize(icon);
        return;
      }

      const iconSize = getIconSize(icon);
      if (iconSize > bestIconSize) {
        bestIcon = icon;
        bestIconSize = iconSize;
      }
    });

    return bestIcon;
  }

  /** Gets the Url for the largest icon in the Manifest */
  getBestIconUrl() {
    const bestIcon = this.getBestIcon();

    if (!bestIcon) {
      return '';
    }

    const iconUrl = bestIcon.src;
    if (iconUrl.match(DOMAIN_PATH_REGEXP)) {
      return iconUrl;
    }

    const match = DOMAIN_PATH_REGEXP.exec(this.url);
    const domain = match[1];
    const path = match[2] || '';

    if (iconUrl[0] === '/') {
      return domain + iconUrl;
    }
    return domain + path + iconUrl;
  }

  static fromJson(manifestUrl, json) {
    const manifest = new Manifest();
    manifest.url = manifestUrl;

    // Copy JSON properties to Manifest.
    Object.keys(json).forEach(key => {
      manifest[key] = json[key];
    });

    return manifest;
  }
}

module.exports = Manifest;
