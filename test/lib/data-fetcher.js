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

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const LIGHTHOUSE_JSON_EXAMPLE = './test/lib/lighthouse-example.json';

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
});
