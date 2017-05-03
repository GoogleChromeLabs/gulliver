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

/* global describe it beforeEach afterEach*/
'use strict';

const assert = require('chai').assert;
const simple = require('simple-mock');

const assetHashing = require('../../../lib/asset-hashing');

describe('ChecksumProvider', () => {
  it('calculates checksum', () => {
    const checksumProvider = new assetHashing.ChecksumProvider(__dirname);
    assert.equal(checksumProvider.get('asset-hashing.js').length, assetHashing.CHECKSUM_LENGTH);
  });
});

describe('AssetChecksum', () => {
  let checksumProvider = new assetHashing.ChecksumProvider();
  let asset;

  beforeEach(() => {
    simple.mock(checksumProvider, 'get', () => '1234567890');
    asset = new assetHashing.AssetChecksum(checksumProvider);
  });

  describe('encode', () => {
    it('adds checksum to file name', () => {
      assert.equal(asset.encode('public/style.css'), 'public/style.1234567890.css');
    });
    it('ignores dirs', () => {
      assert.equal(asset.encode('public/style'), 'public/style');
    });
    it('ignores empty string', () => {
      assert.equal(asset.encode(''), '');
    });
    it('ignores null', () => {
      assert.equal(asset.encode(null), null);
    });
    it('caches results', () => {
      asset.encode('public/style.css');
      asset.encode('public/style.css');
      assert.equal(checksumProvider.get.callCount, 1);
    });
  });

  describe('decode', () => {
    it('ignores dirs', () => {
      assert.equal(asset.decode('public/style'), 'public/style');
    });
    it('ignores empty string', () => {
      assert.equal(asset.decode(''), '');
    });
    it('ignores null', () => {
      assert.equal(asset.decode(null), null);
    });
    it('ignores non checksums', () => {
      assert.equal(asset.decode('style.12345/7890.css'), 'style.12345/7890.css');
    });
    it('removes checksum from file name', () => {
      assert.equal(asset.decode('public/style.1234567890.css'), 'public/style.css');
    });
    it('only checksums with length of 10', () => {
      assert.equal(asset.decode('public/style.123456789.css'), 'public/style.123456789.css');
      assert.equal(asset.decode('public/style.12345678900.css'), 'public/style.12345678900.css');
    });
  });

  afterEach(() => {
    simple.restore();
  });
});

