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

const fs = require('fs');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const assert = require('chai').assert;

chai.use(chaiAsPromised);
chai.should();

const libManifest = require('../../../lib/manifest');

describe('lib.manifest', () => {
  describe('#validateManifest', () => {
    // We assume lighthouse has tests for the manifest parser, just run some
    // minimal smoke tests here.
    it('returns empty array if manifest ok', () => {
      const manifest = fs.readFileSync('./test/app/manifests/icon-url-with-parameter.json');
      const manifestUrl = 'https://example.com/';
      const documentUrl = 'https://www.example.com/';
      const actual = libManifest.validateManifest(manifest, manifestUrl, documentUrl);
      assert.deepEqual(actual, []);
    });
    it('returns same-origin error if documentUrl does not match', () => {
      const manifest = fs.readFileSync('./test/app/manifests/icon-url-with-parameter.json');
      const manifestUrl = 'https://example.com/';
      const documentUrl = 'https://bar.com/';
      const actual = libManifest.validateManifest(manifest, manifestUrl, documentUrl);
      assert.deepEqual(actual, ['ERROR: start_url must be same-origin as document']);
    });
    it('returns icon error if icon value invalid', () => {
      const manifest = fs.readFileSync('./test/app/manifests/no-icon-array.json');
      const manifestUrl = 'https://example.com/';
      const documentUrl = 'https://bar.com/';
      const actual = libManifest.validateManifest(manifest, manifestUrl, documentUrl);
      assert.deepEqual(actual, ['ERROR: \'icons\' expected to be an array but is not.']);
    });
    it('returns multiple errors if start_url and theme_color invalid', () => {
      const manifest = fs.readFileSync('./test/app/manifests/invalid-theme-color.json');
      const manifestUrl = 'https://example.com/';
      const documentUrl = 'https://bar.com/';
      const actual = libManifest.validateManifest(manifest, manifestUrl, documentUrl);
      assert.deepEqual(actual, [
        'ERROR: start_url must be same-origin as document',
        'ERROR: color parsing failed.'
      ]);
    });
  });
});
