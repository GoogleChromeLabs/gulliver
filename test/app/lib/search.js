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

const simpleMock = require('simple-mock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const assert = require('chai').assert;

chai.use(chaiAsPromised);
chai.should();

let search = require('../../../lib/search');
const testPwa = require('../models/pwa');
const Manifest = require('../../../models/manifest');

const MANIFEST_URL = 'https://pwa-directory.appspot.com/manifest.json';
/* eslint-disable camelcase */
const MANIFEST_DATA = {
  name: 'PWA Directory',
  short_name: 'PwaDirectory',
  start_url: '/?utm_source=homescreen'
};
/* eslint-enable camelcase */

describe('lib.Search', () => {
  describe('#addPwa', () => {
    const pwa = testPwa.newPwa(MANIFEST_URL, MANIFEST_DATA);
    pwa.id = '789';

    it('Add a check doc properties', () => {
      simpleMock.mock(search, 'addPwa');
      return search.addPwa(pwa).should.be.fulfilled.then(doc => {
        assert.equal(search.addPwa.callCount, 1);
        assert.equal(doc.id, 789);
        assert.equal(doc.displayName, 'PWA Directory');
        assert.equal(doc.urlText, 'pwa directory appspot com');
        search.removePwa(pwa);
      });
    });
  });

  describe('#search', () => {
    const pwa = testPwa.newPwa(MANIFEST_URL, MANIFEST_DATA);
    pwa.id = '123456789';

    it('Find a PWA', () => {
      search.addPwa(pwa);
      simpleMock.mock(search, 'search');
      return search.search('pwa-directory').should.be.fulfilled.then(searchResult => {
        assert.equal(search.search.callCount, 1);
        assert.equal(searchResult.length, 1);
        assert.equal(searchResult[0].ref, 123456789);
        assert.ok(searchResult[0].score > 0);
        search.removePwa(pwa);
      });
    });

    it('Not find a PWA', () => {
      search.addPwa(pwa);
      simpleMock.mock(search, 'search');
      return search.search('zzz').should.be.fulfilled.then(searchResult => {
        assert.equal(search.search.callCount, 1);
        assert.equal(searchResult.length, 0);
        search.removePwa(pwa);
      });
    });
  });

  describe('#updatePwa', () => {
    const pwa = testPwa.newPwa(MANIFEST_URL, MANIFEST_DATA);
    pwa.id = '98765';

    it('Update and search for change', () => {
      search.addPwa(pwa);
      /* eslint-disable camelcase */
      const UPDATED_MANIFEST_DATA = {
        name: 'PWA Directory xxx',
        short_name: 'PwaDirectory',
        start_url: '/?utm_source=homescreen'
      };
      /* eslint-enable camelcase */
      pwa.manifest = new Manifest(MANIFEST_URL, UPDATED_MANIFEST_DATA);
      search.updatePwa(pwa);
      simpleMock.mock(search, 'search');
      return search.search('xxx').should.be.fulfilled.then(searchResult => {
        assert.equal(search.search.callCount, 1);
        assert.equal(searchResult.length, 1);
        assert.equal(searchResult[0].ref, 98765);
        assert.ok(searchResult[0].score > 0);
        search.removePwa(pwa);
      });
    });
  });

  describe('#removePwa', () => {
    const pwa = testPwa.newPwa(MANIFEST_URL, MANIFEST_DATA);
    pwa.id = '98765';

    it('Remove and search for removal', () => {
      search.addPwa(pwa);
      search.removePwa(pwa);
      simpleMock.mock(search, 'search');
      return search.search('pwa-directory').should.be.fulfilled.then(searchResult => {
        assert.equal(search.search.callCount, 1);
        assert.equal(searchResult.length, 0);
      });
    });
  });
});
