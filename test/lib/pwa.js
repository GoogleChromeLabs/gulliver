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

/* global describe it before beforeEach afterEach*/
'use strict';

let dataFetcher = require('../../lib/data-fetcher');
let libPwa = require('../../lib/pwa');
let libImages = require('../../lib/images');
let libManifest = require('../../lib/manifest');
let libLighthouse = require('../../lib/lighthouse');
let db = require('../../lib/model-datastore');
let cache = require('../../lib/data-cache');

let Lighthouse = require('../../models/lighthouse');
let Manifest = require('../../models/manifest');
let Pwa = require('../../models/pwa');

let simpleMock = require('simple-mock');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
let assert = require('chai').assert;

const MANIFEST_URL = 'https://www.terra.com.br/manifest-br.json';
const MANIFEST_DATA = './test/manifests/icon-url-with-parameter.json';
const LIGHTHOUSE_JSON_EXAMPLE = './test/lib/lighthouse-example.json';

describe('lib.pwa', () => {
  let manifest;
  let pwa;
  let lighthouse;
  before(done => {
    dataFetcher.readFile(MANIFEST_DATA)
      .then(jsonString => {
        manifest = new Manifest(MANIFEST_URL, JSON.parse(jsonString));
        pwa = new Pwa(MANIFEST_URL, manifest);
        pwa.id = '123456789';
        dataFetcher.readFile(LIGHTHOUSE_JSON_EXAMPLE)
          .then(data => {
            lighthouse = new Lighthouse('123456789', 'www.domain.com',
              libLighthouse.processLighthouseJson(JSON.parse(data)));
            done();
          });
      });
  });

  describe('#updateIcon', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('sets iconUrl', () => {
      // Mock libImages and bd to avoid making real calls
      simpleMock.mock(libImages, 'fetchAndSave').resolveWith(['original', '128', '64']);
      simpleMock.mock(db, 'update').returnWith(pwa);
      simpleMock.mock(libPwa, 'libImages').returnWith(libImages);
      simpleMock.mock(libPwa, 'db').returnWith(db);

      return libPwa.updateIcon(pwa, manifest).should.be.fulfilled.then(updatedPwa => {
        assert.equal(libImages.fetchAndSave.callCount, 1);
        assert.equal(libImages.fetchAndSave.lastCall.args[0],
          'https://s1.trrsf.com/fe/zaz-morph/_img/launcher-icon.png?v2');
        assert.equal(libImages.fetchAndSave.lastCall.args[1], '123456789.png');
        assert.equal(db.update.callCount, 1);
        assert.equal(updatedPwa.iconUrl, 'original');
        assert.equal(updatedPwa.iconUrl128, '128');
        assert.equal(updatedPwa.iconUrl64, '64');
      });
    });
  });

  describe('#updateLighthouseInfo', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('sets lighthouseScore', () => {
      // Mock libLighthouse and bd to avoid making real calls
      simpleMock.mock(libLighthouse, 'fetchAndSave').resolveWith(lighthouse);
      simpleMock.mock(db, 'update').returnWith(pwa);
      simpleMock.mock(libPwa, 'libLighthouse').returnWith(libLighthouse);
      simpleMock.mock(libPwa, 'db').returnWith(db);
      return libPwa.updateLighthouseInfo(pwa).should.be.fulfilled.then(updatedPwa => {
        assert.equal(libLighthouse.fetchAndSave.callCount, 1);
        assert.equal(libLighthouse.fetchAndSave.lastCall.args[0], '123456789');
        assert.equal(db.update.callCount, 1);
        assert.equal(updatedPwa.lighthouseScore, 83);
      });
    });
  });

  describe('#getListFromCache', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    it('rejects if no value in cache', () => {
      simpleMock.mock(cache, 'getMulti').resolveWith({});
      return libPwa.getListFromCache('KEY').should.be.rejected;
    });

    it('fulfills if there is a value in cache, but no last update timestamp', () => {
      simpleMock.mock(cache, 'getMulti').resolveWith({KEY: {value: 'value'}});
      return libPwa.getListFromCache('KEY').should.be.fulfilled.then(obj => {
        assert.equal(obj.value, 'value');
      });
    });

    it('rejects if last updated timestamp is after value timestamp', () => {
      simpleMock.mock(cache, 'getMulti').resolveWith(
        {
          KEY: {
            value: 'value',
            cacheTimestamp: 1
          },
          PWA_LIST_LAST_UPDATE: 2
        });
      return libPwa.getListFromCache('KEY').should.be.rejected;
    });

    it('rejects if last updated timestamp is equal to value timestamp', () => {
      simpleMock.mock(cache, 'getMulti').resolveWith(
        {
          KEY: {
            value: 'value',
            cacheTimestamp: 1
          },
          PWA_LIST_LAST_UPDATE: 1
        });
      return libPwa.getListFromCache('KEY').should.be.rejected;
    });

    it('fulfills if last updated timestamp is before value timestamp', () => {
      simpleMock.mock(cache, 'getMulti').resolveWith(
        {
          KEY: {
            value: 'value',
            cacheTimestamp: 2
          },
          PWA_LIST_LAST_UPDATE: 1
        });
      return libPwa.getListFromCache('KEY').should.be.fulfilled.then(obj => {
        assert.equal(obj.value, 'value');
      });
    });
  });

  describe('#save (core logic)', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('performs all the save steps', () => {
      // Mock findByManifestUrl and bd to avoid making real calls
      simpleMock.mock(libPwa, 'findByManifestUrl').resolveWith(pwa);
      simpleMock.mock(libManifest, 'fetchManifest').resolveWith(manifest);
      simpleMock.mock(libPwa, 'fetchMetadataDescription').resolveWith('test-description');
      simpleMock.mock(db, 'update').returnWith(pwa);
      simpleMock.mock(libPwa, 'updateIcon').resolveWith(pwa);
      simpleMock.mock(libPwa, 'updateLighthouseInfo').resolveWith(pwa);
      simpleMock.mock(libPwa, 'libManifest').returnWith(libManifest);
      simpleMock.mock(libPwa, 'db').returnWith(db);
      simpleMock.mock(libPwa, 'addPwaToCache');

      return libPwa._save(pwa).should.be.fulfilled.then(updatedPwa => {
        assert.equal(libPwa.findByManifestUrl.callCount, 1);
        assert.equal(libPwa.findByManifestUrl.lastCall.args[0], MANIFEST_URL);
        assert.equal(libManifest.fetchManifest.callCount, 1);
        assert.equal(libManifest.fetchManifest.lastCall.args[0], MANIFEST_URL);
        assert.equal(updatedPwa.manifest, manifest);
        assert.equal(libPwa.fetchMetadataDescription.callCount, 1);
        assert.equal(libPwa.fetchMetadataDescription.lastCall.args[0], pwa);
        assert.equal(updatedPwa.metaDescription, 'test-description');
        assert.equal(db.update.callCount, 1);
        assert.equal(libPwa.updateIcon.callCount, 1);
        assert.equal(libPwa.updateLighthouseInfo.callCount, 1);
        assert.equal(libPwa.addPwaToCache.callCount, 2);
      });
    });
    it('handles E_MANIFEST_ERROR error', () => {
      // Mock findByManifestUrl to avoid making real calls
      simpleMock.mock(libPwa, 'findByManifestUrl').rejectWith(new Error('Testing error'));
      return libPwa._save(pwa).should.be.rejectedWith(libPwa.E_MANIFEST_ERROR);
    });
  });

  describe('#save (validation logic)', () => {
    beforeEach(() => {
      // Patch _save to do nothing (to test the validation logic of save in isolation)
      libPwa._save = () => {
        return Promise.resolve(true);
      };
    });
    it('rejects on null pwa', () => {
      return libPwa.save(null).should.be.rejected;
    });
    it('rejects if not passed a Pwa object', () => {
      // The right "shape", but not actually a Pwa object
      const obj = {
        manifestUrl: 'foo',
        user: {
          id: 'bar'
        }
      };
      return libPwa.save(obj).should.be.rejected;
    });
    it('rejects if passed a Pwa object without a manifestUrl', () => {
      const pwa = new Pwa();
      return libPwa.save(pwa).should.be.rejected;
    });
    it('rejects if passed a Pwa object with an invalid manifestUrl', () => {
      const pwa = new Pwa('not a manifest URL');
      return libPwa.save(pwa).should.be.rejected;
    });
    it('rejects if passed a Pwa object with an invalid user.id', () => {
      const pwa = new Pwa('https://example.com/', {user: null});
      return libPwa.save(pwa).should.be.rejected;
    });
    it('fulfills if passed a valid Pwa objectid', () => {
      const pwa = new Pwa('https://example.com/');
      pwa.user = {id: '7777'};
      return libPwa.save(pwa).should.eventually.equal(true);
    });
  });
});
