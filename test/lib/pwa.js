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

/* global describe it beforeEach */

var pwaLib = require('../../lib/pwa.js');
var Pwa = require('../../models/pwa.js');

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

describe('lib.pwa', () => {
  describe('#save (validation logic)', () => {
    beforeEach(() => {
      // Patch _save to do nothing (to test the validation logic of save in isolation)
      pwaLib._save = () => {
        return Promise.resolve(true);
      };
    });
    it('rejects on null pwa', () => {
      return pwaLib.save(null).should.be.rejected;
    });
    it('rejects if not passed a Pwa object', () => {
      // The right "shape", but not actually a Pwa object
      const obj = {
        manifestUrl: 'foo',
        user: {
          id: 'bar'
        }
      };
      return pwaLib.save(obj).should.be.rejected;
    });
    it('rejects if passed a Pwa object without a manifestUrl', () => {
      const pwa = new Pwa();
      return pwaLib.save(pwa).should.be.rejected;
    });
    it('rejects if passed a Pwa object with an invalid manifestUrl', () => {
      const pwa = new Pwa('not a manifest URL');
      return pwaLib.save(pwa).should.be.rejected;
    });
    it('rejects if passed a Pwa object with an invalid user.id', () => {
      const pwa = new Pwa('https://example.com/', {user: null});
      return pwaLib.save(pwa).should.be.rejected;
    });
    it('fulfills if passed a valid Pwa objectid', () => {
      const pwa = new Pwa('https://example.com/');
      pwa.user = {id: '7777'};
      return pwaLib.save(pwa).should.eventually.equal(true);
    });
  });
});
