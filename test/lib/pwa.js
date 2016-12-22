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

const fs = require('fs');
const dataFetcher = require('../../lib/data-fetcher');
const libPwa = require('../../lib/pwa');
const libImages = require('../../lib/images');
const libManifest = require('../../lib/manifest');
const libLighthouse = require('../../lib/lighthouse');
const db = require('../../lib/model-datastore');
const cache = require('../../lib/data-cache');

const Lighthouse = require('../../models/lighthouse');
const Pwa = require('../../models/pwa');

const testPwa = require('../models/pwa');
const simpleMock = require('simple-mock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
const assert = require('chai').assert;

const MANIFEST_URL = 'https://www.domain.com/manifest-br.json';
const START_URL = 'https://www.domain.com/?utm_source=homescreen';
const LIGHTHOUSE_JSON_EXAMPLE = './test/lib/lighthouse-example.json';

/* eslint-disable camelcase */
const MANIFEST_DATA = {
  name: 'Test',
  icons: [
    {
      src: 'img/launcher-icon.png?v2',
      sizes: '192x192',
      type: 'image/png'
    }
  ],
  start_url: 'https://www.example.com/?utm_source=homescreen'
};
const MANIFEST_NO_ICON = {name: 'Test', description: 'Manifest without icons', start_url: '/'};
const MANIFEST_INVALID_THEME_COLOR = {
  description: 'Manifest with an invalid theme_color', theme_color: ''};
/* eslint-enable camelcase */

describe('lib.pwa', () => {
  const pwa = testPwa.createPwa(MANIFEST_URL, MANIFEST_DATA);
  pwa.id = '123456789';
  const manifest = pwa.manifest;
  const pwaNoIcon = testPwa.createPwa(MANIFEST_URL, MANIFEST_NO_ICON);
  const pwaInvalidThemeColor = testPwa.createPwa(MANIFEST_URL, MANIFEST_INVALID_THEME_COLOR);
  const lighthouse = new Lighthouse(
    '123456789', 'www.domain.com', JSON.parse(fs.readFileSync(LIGHTHOUSE_JSON_EXAMPLE)));

  describe('#updatePwaMetadataDescription', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('sets Metadata Description', () => {
      simpleMock.mock(dataFetcher, 'fetchMetadataDescription').resolveWith('a description');
      return libPwa.updatePwaMetadataDescription(pwa).should.be.fulfilled.then(updatedPwa => {
        assert.equal(dataFetcher.fetchMetadataDescription.callCount, 1);
        assert.equal(updatedPwa.metaDescription, 'a description');
      });
    });
    it('sets Metadata Description, works without metaDescription returned by dataFetcher', () => {
      simpleMock.mock(dataFetcher, 'fetchMetadataDescription').resolveWith(null);
      return libPwa.updatePwaMetadataDescription(pwa).should.be.fulfilled.then(updatedPwa => {
        assert.equal(dataFetcher.fetchMetadataDescription.callCount, 1);
        assert.equal(updatedPwa.metaDescription, undefined);
      });
    });
    it('sets Metadata Description, works even if there is an error during at dataFetcher', () => {
      simpleMock.mock(dataFetcher, 'fetchMetadataDescription').rejectWith(new Error());
      return libPwa.updatePwaMetadataDescription(pwa).should.be.fulfilled.then(updatedPwa => {
        assert.equal(dataFetcher.fetchMetadataDescription.callCount, 1);
        assert.equal(updatedPwa.metaDescription, undefined);
      });
    });
  });

  describe('#updatePwaIcon', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('sets iconUrl', () => {
      simpleMock.mock(libImages, 'fetchAndSave').resolveWith(['original', '128', '64']);
      simpleMock.mock(db, 'updateWithCounts').returnWith(pwa);
      return libPwa.updatePwaIcon(pwa).should.be.fulfilled.then(updatedPwa => {
        assert.equal(libImages.fetchAndSave.callCount, 1);
        assert.equal(libImages.fetchAndSave.lastCall.args[0],
          'https://www.domain.com/img/launcher-icon.png?v2');
        assert.equal(libImages.fetchAndSave.lastCall.args[1], '123456789.png');
        assert.equal(updatedPwa.iconUrl, 'original');
        assert.equal(updatedPwa.iconUrl128, '128');
        assert.equal(updatedPwa.iconUrl64, '64');
      });
    });
    it('allows PWAs without icon', () => {
      return libPwa.updatePwaIcon(pwaNoIcon).should.be.fulfilled.then(updatedPwa => {
        assert.equal(updatedPwa.iconUrl, null);
      });
    });
  });

  describe('#updatePwaLighthouseInfo', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('sets lighthouseScore', () => {
      simpleMock.mock(libLighthouse, 'fetchAndSave').resolveWith(lighthouse);
      simpleMock.mock(db, 'update').returnWith(pwa);
      return libPwa.updatePwaLighthouseInfo(pwa).should.be.fulfilled.then(updatedPwa => {
        assert.equal(libLighthouse.fetchAndSave.callCount, 1);
        assert.equal(libLighthouse.fetchAndSave.lastCall.args[0], '123456789');
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

  describe('#fetchManifest', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('Fetches manifest directly from MANIFEST_URL', () => {
      simpleMock.mock(libManifest, 'fetchManifest').resolveWith(manifest);
      return libPwa.fetchManifest(pwa).should.be.fulfilled.then(fetchedManifest => {
        assert.equal(fetchedManifest, manifest);
        assert.equal(libManifest.fetchManifest.callCount, 1);
      });
    });
    it('Fails directly and looks for manifest link on START_URL', () => {
      simpleMock.mock(libManifest, 'fetchManifest').rejectWith(new Error()).resolveWith(manifest);
      simpleMock.mock(dataFetcher, 'fetchLinkRelManifestUrl').resolveWith(MANIFEST_URL);
      let PwaWithStartUrl = new Pwa(START_URL, manifest);
      return libPwa.fetchManifest(PwaWithStartUrl)
      .should.be.fulfilled.then(fetchedManifest => {
        assert.equal(fetchedManifest, manifest);
        assert.equal(PwaWithStartUrl.manifestUrl, MANIFEST_URL);
        assert.equal(libManifest.fetchManifest.callCount, 2);
        assert.equal(dataFetcher.fetchLinkRelManifestUrl.callCount, 1);
      });
    });
    it('Fails directly and fails for manifest link on START_URL', () => {
      simpleMock.mock(libManifest, 'fetchManifest').rejectWith(new Error()).resolveWith(manifest);
      simpleMock.mock(dataFetcher, 'fetchLinkRelManifestUrl').rejectWith(new Error());
      return libPwa.fetchManifest(new Pwa(START_URL, manifest))
      .should.be.rejected.then(_ => {
        assert.equal(libManifest.fetchManifest.callCount, 1);
        assert.equal(dataFetcher.fetchLinkRelManifestUrl.callCount, 1);
      });
    });
  });

  describe('#save (core logic)', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('performs all the save steps', () => {
      simpleMock.mock(libPwa, 'fetchManifest').resolveWith(manifest);
      simpleMock.mock(libPwa, 'findByManifestUrl').resolveWith(pwa);
      simpleMock.mock(libPwa, 'savePwa').resolveWith(pwa);
      simpleMock.mock(libPwa, 'updatePwaMetadataDescription').resolveWith(pwa);
      simpleMock.mock(libPwa, 'updatePwaIcon').resolveWith(pwa);
      simpleMock.mock(libPwa, 'updatePwaLighthouseInfo').resolveWith(pwa);
      return libPwa._save(pwa).should.be.fulfilled.then(_ => {
        assert.equal(libPwa.fetchManifest.callCount, 1);
        assert.equal(libPwa.findByManifestUrl.callCount, 1);
        assert.equal(libPwa.updatePwaMetadataDescription.callCount, 1);
        assert.equal(libPwa.updatePwaIcon.callCount, 1);
        assert.equal(libPwa.updatePwaLighthouseInfo.callCount, 1);
        assert.equal(libPwa.savePwa.callCount, 2);
      });
    });
    it('handles E_MANIFEST_ERROR error', () => {
      simpleMock.mock(libPwa, 'fetchManifest').resolveWith(manifest);
      simpleMock.mock(libPwa, 'findByManifestUrl').rejectWith(new Error('Testing error'));
      return libPwa._save(pwa).should.be.rejectedWith(libPwa.E_MANIFEST_ERROR);
    });
    it('rejects invalid Manifest', () => {
      simpleMock.mock(libPwa, 'fetchManifest').resolveWith(pwaInvalidThemeColor.manifest);
      simpleMock.mock(libPwa, 'findByManifestUrl').resolveWith(pwaInvalidThemeColor);
      return libPwa._save(pwaInvalidThemeColor).should.be.rejected.then(error => {
        assert.equal(error, 'Error while validating the manifest: ERROR: color parsing failed.');
      });
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
