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

let dataFetcher = require('../../../lib/data-fetcher');
const simpleMock = require('simple-mock');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
const assert = require('chai').assert;
chai.use(chaiAsPromised);
chai.should();

const LIGHTHOUSE_JSON_EXAMPLE = './test/app/lib/lighthouse-example.json';

describe('lib.data-fetcher', () => {
  it('fetchMetadataDescription(null) should fail', () => {
    return dataFetcher.fetchMetadataDescription(null).should.be.rejectedWith(Error);
  });

  it('fetchMetadataDescription(https://www.google.com) should work', () => {
    return dataFetcher.fetchMetadataDescription('https://www.google.com').should.be.fulfilled;
  });

  it('readfile(LIGHTHOUSE_JSON_EXAMPLE) should work', () => {
    return dataFetcher.readFile(LIGHTHOUSE_JSON_EXAMPLE).should.be.fulfilled;
  });

  describe('#_firebaseOptions', () => {
    it('should call with GET method', () => {
      const options = dataFetcher._firebaseOptions();
      assert.equal(options.method, 'GET');
      assert(options.headers.Authorization, 'Should contain Authorization header');
    });

    it('should call with POST method when payload exists', () => {
      const options = dataFetcher._firebaseOptions({});
      assert.equal(options.method, 'POST');
      assert(options.headers.Authorization, 'Should contain Authorization header');
      assert.equal(options.headers['content-type'], 'application/json', 'Correct content-type');
    });
  });

  describe('#_handleFirebaseResponse', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    it('should succeed when code is 200', () => {
      const response = {};
      simpleMock.mock(response, 'status', 200);
      simpleMock.mock(response, 'json').resolveWith({});

      return dataFetcher._handleFirebaseResponse(response).should.be.fulfilled
        .then(() => {
          assert(response.json.called);
        });
    });

    it('should reject when code is not 200', () => {
      const response = {};
      simpleMock.mock(response, 'status', 402);
      simpleMock.mock(response, 'text').resolveWith({});

      return dataFetcher._handleFirebaseResponse(response).should.be.rejected
        .then(() => {
          assert(response.text.called);
        });
    });
  });
});
