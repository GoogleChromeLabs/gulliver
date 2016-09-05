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

var assert = require('assert');
var Pwa = require('../../models/pwa');

describe('models/pwa.js', () => {
  it('Create a PWA with no Manifest', () => {
    var pwa = new Pwa();
    assert.equal(pwa.manifestUrl, undefined);
    assert.equal(pwa.name, '', 'returns empty name');
    assert.equal(pwa.description, '', 'returns empty description');
    assert.equal(pwa.startUrl, '', 'returns empty startUrl');
    assert.equal(pwa.absoluteStartUrl, '', 'returns empty absoluteStartUrl');
    assert.equal(pwa.backgroundColor, '#ffffff', 'backgroundColor is #ffffff');
    assert.equal(pwa.manifestAsString, '', 'manifestAsString is an empty string');
    assert.ok(pwa.created, 'created field exists');
    assert.ok(pwa.updated, 'updated field exists');
    assert.ok(pwa.created instanceof Date, 'created is a Date');
    assert.ok(pwa.updated instanceof Date, 'updated is a Date');
    assert.equal(pwa.visible, true);
  });

  it('Create a PWA with Empty Manifest', () => {
    var manifestUrl = 'http://www.example.com';
    var manifest = {};
    var pwa = new Pwa(manifestUrl, manifest);
    assert.equal(pwa.manifestUrl, manifestUrl);
    assert.equal(pwa.manifest, manifest);
    assert.equal(pwa.name, '', 'returns empty name');
    assert.equal(pwa.description, '', 'returns empty description');
    assert.equal(pwa.startUrl, '', 'returns empty startUrl');
    assert.equal(pwa.absoluteStartUrl, 'http://www.example.com/', 'returns empty absoluteStartUrl');
    assert.equal(pwa.backgroundColor, '#ffffff', 'backgroundColor is #ffffff');
    assert.equal(pwa.manifestAsString, '{}', 'manifestAsString is {}');
  });

  it('Create a PWA with a Full Manifest', () => {
    var manifestUrl = 'http://www.example.com';
    /* eslint-disable camelcase */
    var manifest = {
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
    /* eslint-enable camelcase */
    var pwa = new Pwa(manifestUrl, manifest);
    assert.equal(pwa.manifestUrl, manifestUrl);
    assert.equal(pwa.manifest, manifest);
    assert.equal(pwa.name, 'Example PWA', 'returns correct name');
    assert.equal(pwa.description, 'Example PWA', 'correct description');
    assert.equal(pwa.startUrl, '/index.jsp', 'returns correct startUrl');
    assert.equal(pwa.absoluteStartUrl, 'http://www.example.com/index.jsp', 'returns empty absoluteStartUrl');
    assert.equal(pwa.backgroundColor, '#673AB7', 'backgroundColor is #ffffff');
    assert.ok(pwa.manifestAsString, 'manifestAsString is a non-empty string');
  });

  it('Return the right description', () => {
    var pwa = new Pwa();
    assert.equal(pwa.description, '');
    pwa.metaDescription = 'metaDescription';
    assert.equal(pwa.description, 'metaDescription');
    pwa.manifest = {
      description: 'manifestDescription'
    };
    assert.equal(pwa.description, 'manifestDescription');
  });
});
