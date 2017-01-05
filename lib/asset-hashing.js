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

const fs = require('fs');
const path = require('path');
const revHash = require('rev-hash');

const CHECKSUM_LENGTH = 10;

class ChecksumProvider {

  constructor(root) {
    this.root_ = root;
  }

  get(assetPath) {
    const buffer = fs.readFileSync(path.join(this.root_, assetPath));
    return revHash(buffer);
  }

}

class AssetChecksum {

  constructor(checksumProvider) {
    this.checksumProvider_ = checksumProvider;
    this.checksumCache_ = {};
  }

  encode(assetPath) {
    let result = this.checksumCache_[assetPath];
    if (result) {
      return result;
    }
    const checksum = this.checksumProvider_.get(assetPath);
    const index = assetPath.lastIndexOf('.');
    if (index === -1) {
      return assetPath;
    }
    result = assetPath.substring(0, index) +
      '.' +
      checksum +
      assetPath.substring(index, assetPath.length);
    this.checksumCache_[assetPath] = result;
    return result;
  }

  decode(assetPath) {
    const segments = assetPath.split('.');
    if (segments.length === 1) {
      return assetPath;
    }
    const checksumIndex = segments.length - 2;
    if (segments[checksumIndex].length !== CHECKSUM_LENGTH) {
      return assetPath;
    }
    segments.splice(segments.length - 2, 1);
    return segments.join('.');
  }

}

module.exports.asset = new AssetChecksum(new ChecksumProvider('public'));

// Exported for testing
module.exports.ChecksumProvider = ChecksumProvider;
module.exports.AssetChecksum = AssetChecksum;
module.exports.CHECKSUM_LENGTH = CHECKSUM_LENGTH;
