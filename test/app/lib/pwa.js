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

/* global describe it afterEach*/
'use strict';

const fs = require('fs');
const dataFetcher = require('../../../lib/data-fetcher');
const libPwa = require('../../../lib/pwa');
const libImages = require('../../../lib/images');
const libManifest = require('../../../lib/manifest');
const libWebPerformance = require('../../../lib/web-performance');
const promiseSequential = require('../../../lib/promise-sequential');

const Pwa = require('../../../models/pwa');

const testPwa = require('../models/pwa');
const simpleMock = require('simple-mock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
const assert = require('chai').assert;

const MANIFEST_URL = 'https://www.domain.com/manifest-br.json';
const START_URL = 'https://www.domain.com/?utm_source=homescreen';
const LIGHTHOUSE_JSON_EXAMPLE = './test/app/lib/lighthouse-example.json';

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
  const pwa = testPwa.newPwa(MANIFEST_URL, MANIFEST_DATA);
  pwa.id = '123456789';
  const manifest = pwa.manifest;
  const pwaNoIcon = testPwa.newPwa(MANIFEST_URL, MANIFEST_NO_ICON);
  const pwaInvalidThemeColor = testPwa.newPwa(MANIFEST_URL, MANIFEST_INVALID_THEME_COLOR);

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
      simpleMock.mock(libWebPerformance, 'getLighthouseReport').resolveWith(
        JSON.parse(fs.readFileSync(LIGHTHOUSE_JSON_EXAMPLE)));
      return libPwa.updatePwaLighthouseInfo(pwa).should.be.fulfilled.then(updatedPwa => {
        assert.equal(libWebPerformance.getLighthouseReport.callCount, 1);
        assert.equal(libWebPerformance.getLighthouseReport.lastCall.args[0], pwa);
        assert.equal(updatedPwa.lighthouseScore, 91);
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

  describe('#updatePwaManifest', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('performs all the save steps', () => {
      simpleMock.mock(libPwa, 'fetchManifest').resolveWith(manifest);
      simpleMock.mock(libPwa, 'findByManifestUrl').resolveWith(pwa);
      return libPwa.updatePwaManifest(pwa).should.be.fulfilled.then(_ => {
        assert.equal(libPwa.fetchManifest.callCount, 1);
        assert.equal(libPwa.findByManifestUrl.callCount, 1);
      });
    });
    it('handles E_MANIFEST_ERROR error', () => {
      simpleMock.mock(libPwa, 'fetchManifest').resolveWith(manifest);
      simpleMock.mock(libPwa, 'findByManifestUrl').rejectWith(new Error('Testing error'));
      return libPwa.updatePwaManifest(pwa).should.be.rejectedWith(libPwa.E_MANIFEST_ERROR);
    });
    it('rejects invalid Manifest', () => {
      simpleMock.mock(libPwa, 'fetchManifest').resolveWith(pwaInvalidThemeColor.manifest);
      simpleMock.mock(libPwa, 'findByManifestUrl').resolveWith(pwaInvalidThemeColor);
      return libPwa.updatePwaManifest(pwaInvalidThemeColor).should.be.rejected.then(error => {
        assert.equal(error, 'Error while validating the manifest: ERROR: color parsing failed.');
      });
    });
  });

  describe('#createOrUpdatePwa', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    /* eslint max-nested-callbacks: ["error", 5] */
    it('performs all the createOrUpdatePwa steps', () => {
      simpleMock.mock(libPwa, 'validatePwa').resolveWith(pwa);
      simpleMock.mock(libPwa, 'updatePwaManifest').resolveWith(pwa);
      simpleMock.mock(libPwa, 'updatePwaMetadataDescription').resolveWith(pwa);
      simpleMock.mock(libPwa, 'updatePwaIcon').resolveWith(pwa);
      simpleMock.mock(libPwa, 'updatePwaLighthouseInfo').resolveWith(pwa);
      simpleMock.mock(libPwa, 'updatePwaPageSpeedInformation').resolveWith(pwa);
      simpleMock.mock(libPwa, 'updatePwaWebPageTestInformation').resolveWith(pwa);
      simpleMock.mock(libPwa, 'sendNewAppNotification').resolveWith(pwa);
      simpleMock.mock(libPwa, 'savePwa').resolveWith(pwa);
      simpleMock.mock(libPwa, 'submitWebPageUrlForWebPerformanceInformation').resolveWith(pwa);
      simpleMock.mock(libPwa, 'removePwaFromCache').resolveWith(pwa);
      simpleMock.mock(promiseSequential, 'all');
      return libPwa.createOrUpdatePwa(pwa).should.be.fulfilled.then(result => {
        assert.equal(libPwa.updatePwaManifest.callCount, 1);
        assert.equal(libPwa.updatePwaIcon.callCount, 1);
        assert.equal(libPwa.savePwa.callCount, 2);
        assert.equal(libPwa.removePwaFromCache.callCount, 1);
        assert.equal(promiseSequential.all.callCount, 1);
        assert.equal(result, pwa);
        assert.equal(libPwa.submitWebPageUrlForWebPerformanceInformation.callCount, 1);
      });
    });
  });

  describe('#validatePwa', () => {
    it('rejects on null pwa', () => {
      return libPwa.validatePwa(null).should.be.rejected.then(error => {
        assert.equal(error, libPwa.E_NOT_A_PWA);
      });
    });
    it('rejects if not passed a Pwa object', () => {
      // The right "shape", but not actually a Pwa object
      const obj = {
        manifestUrl: 'foo',
        user: {
          id: 'bar'
        }
      };
      return libPwa.validatePwa(obj).should.be.rejected.then(error => {
        assert.equal(error, libPwa.E_NOT_A_PWA);
      });
    });
    it('rejects if passed a Pwa object without a manifestUrl', () => {
      const pwa = new Pwa();
      return libPwa.validatePwa(pwa).should.be.rejected.then(error => {
        assert.equal(error, libPwa.E_MANIFEST_URL_MISSING);
      });
    });
    it('rejects if passed a Pwa object with an invalid manifestUrl', () => {
      const pwa = new Pwa('not a manifest URL');
      return libPwa.validatePwa(pwa).should.be.rejected.then(error => {
        assert.equal(error, libPwa.E_MANIFEST_INVALID_URL);
      });
    });
    it('rejects if passed a Pwa object with an invalid user.id', () => {
      const pwa = new Pwa('https://example.com/', {user: null});
      return libPwa.validatePwa(pwa).should.be.rejected.then(error => {
        assert.equal(error, libPwa.E_MISSING_USER_INFORMATION);
      });
    });
    it('fulfills if passed a valid Pwa objectid', () => {
      const pwa = new Pwa('https://example.com/');
      pwa.user = {id: '7777'};
      return libPwa.validatePwa(pwa).should.be.fulfilled.then(result => {
        assert.equal(result, pwa);
      });
    });
  });
});
