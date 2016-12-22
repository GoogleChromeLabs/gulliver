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
'use strict';

const assert = require('assert');
const Manifest = require('../../models/manifest');
const Pwa = require('../../models/pwa');

/* eslint-disable camelcase */
describe('models/pwa.js', () => {
  it('Create a PWA with no Manifest', () => {
    const pwa = new Pwa();
    assert.equal(pwa.manifestUrl, undefined);
    assert.equal(pwa.name, '', 'returns empty name');
    assert.equal(pwa.description, '', 'returns empty description');
    assert.equal(pwa.startUrl, '', 'returns empty startUrl');
    assert.equal(pwa.absoluteStartUrl, '', 'returns empty absoluteStartUrl');
    assert.equal(pwa.backgroundColor, '#ffffff', 'backgroundColor is #ffffff');
    assert.equal(pwa.manifest, null);
    assert.ok(pwa.created, 'created field exists');
    assert.ok(pwa.updated, 'updated field exists');
    assert.ok(pwa.created instanceof Date, 'created is a Date');
    assert.ok(pwa.updated instanceof Date, 'updated is a Date');
    assert.equal(pwa.visible, true);
  });

  it('Create a PWA with Empty Manifest', () => {
    const manifestUrl = 'http://www.example.com';
    const manifest = new Manifest(manifestUrl, {});
    const pwa = new Pwa(manifestUrl, manifest);
    assert.equal(pwa.manifestUrl, manifestUrl);
    assert.equal(pwa.manifest.raw, '{}');
    assert.equal(pwa.name, '', 'returns empty name');
    assert.equal(pwa.description, '', 'returns empty description');
    assert.equal(pwa.startUrl, '', 'returns empty startUrl');
    assert.equal(pwa.absoluteStartUrl, 'http://www.example.com/', 'returns empty absoluteStartUrl');
    assert.equal(pwa.backgroundColor, '#ffffff', 'backgroundColor is #ffffff');
    assert.equal(pwa.manifestAsString, '{}', 'manifestAsString is {}');
  });

  it('Create a PWA with a Full Manifest', () => {
    const manifestUrl = 'http://www.example.com';
    const manifestJson = {
      name: 'Example PWA',
      description: 'Example PWA',
      icons: [{
        src: '/icon/web_hi_res_512.png',
        sizes: '512x512',
        type: 'image/png'
      }],
      start_url: '/index.jsp',
      display: 'standalone',
      background_color: '#673AB7',
      theme_color: '#512DA8'
    };
    const manifest = new Manifest(manifestUrl, manifestJson);
    const pwa = new Pwa(manifestUrl, manifest);
    assert.equal(pwa.manifestUrl, manifestUrl);
    assert.equal(pwa.manifest.raw, manifest.raw);
    assert.equal(pwa.name, 'Example PWA', 'returns correct name');
    assert.equal(pwa.description, 'Example PWA', 'correct description');
    assert.equal(pwa.startUrl, '/index.jsp', 'returns correct startUrl');
    assert.equal(pwa.absoluteStartUrl, 'http://www.example.com/index.jsp', 'returns empty absoluteStartUrl');
    assert.equal(pwa.backgroundColor, '#673AB7', 'backgroundColor is #ffffff');
    assert.ok(pwa.manifestAsString, 'manifestAsString is a non-empty string');
  });

  it('Return metaDescription if !description && !manifestDescription', () => {
    const pwa = new Pwa();
    assert.equal(pwa.description, '');
    pwa.metaDescription = 'metaDescription';
    assert.equal(pwa.description, 'metaDescription');
  });

  it('Return manifestDescription if !description', () => {
    const pwa = new Pwa();
    assert.equal(pwa.description, '');
    pwa.metaDescription = 'metaDescription';
    assert.equal(pwa.description, 'metaDescription');
    pwa.manifest = new Manifest('http://www.example.com', {description: 'manifestDescription'});
    assert.equal(pwa.description, 'manifestDescription');
  });

  describe('displayName', () => {
    it('is name', () => {
      const pwa = this.createPwa('www.manifesturl.com', {
        name: 'Example PWA',
        short_name: 'PWA'
      });
      assert.equal(pwa.displayName, 'Example PWA');
    });
    it('is short name', () => {
      const pwa = this.createPwa('www.manifesturl.com', {
        short_name: 'PWA'
      });
      assert.equal(pwa.displayName, 'PWA');
    });
    it('is url', () => {
      const pwa = this.createPwa('www.manifesturl.com', {
      });
      assert.equal(pwa.displayName, 'www.manifesturl.com');
    });
    it('is url without file name', () => {
      const pwa = this.createPwa('www.manifesturl.com/manifest.json', {
      });
      assert.equal(pwa.displayName, 'www.manifesturl.com');
    });
    it('is url without scheme', () => {
      const pwa = this.createPwa('https://www.manifesturl.com/manifest.json', {
      });
      assert.equal(pwa.displayName, 'www.manifesturl.com');
    });
  });
});

/**
 * Creates a PWA object from a Manifest URL and Json Data for testing.
 *
 * @param {string} manifestUrl the URL for the Manifest
 * @param {Json} manifestData the Json object with the Manifest data
 * @return {Pwa}
 */
exports.createPwa = function(manifestUrl, manifestData) {
  const manifest = new Manifest(manifestUrl, manifestData);
  return new Pwa(manifestUrl, manifest);
};
