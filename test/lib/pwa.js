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

// var fetchMock = require('fetch-mock');
// var fetch = require('node-fetch');
var pwaLib = require('../../lib/pwa');

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

describe('fetchMetadataDescription', () => {
  it('fetchMetadataDescription(null) should fail', () => {
    return pwaLib.fetchMetadataDescription(null).should.be.rejectedWith(Error);
  });

  it('fetchMetadataDescription(https://www.google.com) should work', () => {
    return pwaLib.fetchMetadataDescription('https://www.google.com').should.be.fulfilled;
  });

  /*
  it('fetchMetadataDescription(html) should work', () => {
    var html = `<!doctype html><html><head><meta charset="utf-8"><title>Test Page</title>
      <meta name="description" content="This is a description" /></head><body></body></html>`;

	  global.fetch = fetch;
    fetchMock.get('*', {hello: html});

    return pwaLib.fetchMetadataDescription('https://www.google.com').should.eventually.equal('foo');
  });
  */
});
