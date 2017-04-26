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

/* global describe it afterEach before */
'use strict';

const libImages = require('../../../lib/images');
const dataFetcher = require('../../../lib/data-fetcher');
const Manifest = require('../../../models/manifest');

const httpMocks = require('node-mocks-http');
const simpleMock = require('simple-mock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
const assert = require('chai').assert;

const MANIFEST_URL = 'https://mobile.twitter.com/manifest.json';
const MANIFEST_DATA = './test/app/manifests/inline-image-large-content.json';

describe('lib.images', () => {
  let manifest;
  before(done => {
    dataFetcher.readFile(MANIFEST_DATA)
      .then(jsonString => {
        manifest = new Manifest(MANIFEST_URL, JSON.parse(jsonString));
        done();
      });
  });
  afterEach(() => {
    simpleMock.restore();
  });

  it('fetchAndSave fail fetch for HTTP error', () => {
    const response = {};
    response.status = 400;
    simpleMock.mock(dataFetcher, 'fetchWithUA').resolveWith(response);
    simpleMock.mock(libImages, 'saveImage').resolveWith(null);
    return libImages.fetchAndSave('http://www.test.com', null).should.be.rejectedWith(
      'Bad Response (400) loading image: undefined');
  });

  it('fetchAndSave fail for unsoported protocol (ftp:)', () => {
    const response = {};
    response.status = 400;
    simpleMock.mock(dataFetcher, 'fetchWithUA').resolveWith(response);
    simpleMock.mock(libImages, 'saveImage').resolveWith(null);
    return libImages.fetchAndSave('ftp://www.test.com', null).should.be.rejectedWith(
      'Unsupported Protocol: ftp:');
  });

  it('fetchAndSave works with http url', () => {
    const headers = {};
    simpleMock.mock(headers, 'get').returnWith('image/jpeg');
    const response = httpMocks.createResponse();
    response.headers = headers;
    response.status = 200;
    response.body = '';
    simpleMock.mock(dataFetcher, 'fetchWithUA').resolveWith(response);
    simpleMock.mock(libImages, 'saveImage').resolveWith('http://url.for.newimage.in.bucket.com');
    return libImages.fetchAndSave('http://www.test.com', 'destFile').should.be.fulfilled.then(_ => {
      assert.equal(libImages.saveImage.callCount, 3);
    });
  });

  it('fetchAndSave works with https url', () => {
    const response = httpMocks.createResponse();
    const headers = {};
    simpleMock.mock(headers, 'get').returnWith('image/jpeg');
    response.headers = headers;
    response.status = 200;
    response.body = '';
    simpleMock.mock(dataFetcher, 'fetchWithUA').resolveWith(response);
    simpleMock.mock(libImages, 'saveImage').resolveWith('http://url.for.newimage.in.bucket.com');
    return libImages.fetchAndSave('https://www.test.com', 'destFile').should.be.fulfilled.then(_ => {
      assert.equal(libImages.saveImage.callCount, 3);
    });
  });

  it('dataUriAndSave data uri', () => {
    const bestIconUrl = manifest.getBestIconUrl();
    simpleMock.mock(libImages, 'saveImage').resolveWith('http://url.for.newimage.in.bucket.com');
    return libImages.dataUriAndSave(bestIconUrl).should.be.fulfilled.then(_ => {
      assert.equal(libImages.saveImage.callCount, 3);
    });
  });
});
