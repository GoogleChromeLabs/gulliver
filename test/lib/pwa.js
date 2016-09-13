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

var dataFetcher = require('../../lib/data-fetcher');
var pwaLib = require('../../lib/pwa');
var libImages = require('../../lib/images');
var Manifest = require('../../models/manifest');
var Pwa = require('../../models/pwa');
var db = require('../../lib/model-datastore');

var simpleMock = require('simple-mock');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
var assert = require('chai').assert;

const MANIFEST_URL = 'https://www.terra.com.br/manifest-br.json';
const MANIFEST_DATA = './test/manifests/icon-url-with-parameter.json';

describe('lib.pwa', () => {
  it('updateIcon(pwa, manifest) should set iconUrl', () => {
    return dataFetcher.readFile(MANIFEST_DATA)
      .then(jsonString => {
        var manifest = Manifest.fromJson(MANIFEST_URL, JSON.parse(jsonString));
        var pwa = new Pwa(MANIFEST_URL, manifest);
        pwa.id = '123456789';

        // Mock libImages and bd to avoid making real calls
        simpleMock.mock(libImages, 'fetchAndSave').resolveWith(manifest.getBestIconUrl());
        pwaLib.libImages = libImages;
        simpleMock.mock(db, 'update').returnWith(pwa);
        pwaLib.db = db;

        var promiseUpdateIcon = pwaLib.updateIcon(pwa, manifest);
        assert.equal(libImages.fetchAndSave.callCount, 1);
        assert.equal(libImages.fetchAndSave.lastCall.args[0], 'https://s1.trrsf.com/fe/zaz-morph/_img/launcher-icon.png?v2');
        assert.equal(libImages.fetchAndSave.lastCall.args[1], '123456789.png');
        return promiseUpdateIcon.should.eventually.have.property('iconUrl');
      });
  });
});
