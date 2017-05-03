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

/* global describe it before afterEach */
'use strict';

const controllersCache = require('../../../controllers/cache');
const libCache = require('../../../lib/data-cache');

const express = require('express');
const app = express();
const request = require('supertest');
const simpleMock = require('simple-mock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
const assert = require('chai').assert;

describe('controllers.cache', () => {
  before(done => {
    app.use('/',
      controllersCache,
      (req, res) => {
        res.send('<html>PageRendered</html>');
      }
    );
    done();
  });

  describe('GET /', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    it('Page from cache', done => {
      simpleMock.mock(libCache, 'get').resolveWith('<html>PageFromCache</html>');
      simpleMock.mock(libCache, 'set').resolveWith();
      request(app)
        .get('/')
        .expect(200).should.be.fulfilled.then(res => {
          assert.equal(libCache.get.callCount, 1);
          assert.equal(res.text, '<html>PageFromCache</html>');
          done();
        });
    });

    it('Not in cache, rendered directly', done => {
      simpleMock.mock(libCache, 'get').rejectWith('Not in cache').resolveWith('/');
      simpleMock.mock(libCache, 'set').resolveWith();
      simpleMock.mock(libCache, 'storeCachedUrls').resolveWith();
      request(app)
        .get('/')
        .expect(200).should.be.fulfilled.then(res => {
          assert.equal(res.text, '<html>PageRendered</html>');
          assert.equal(libCache.get.callCount, 1);
          assert.equal(libCache.get.calls[0].args[0], '/');
          assert.equal(libCache.set.callCount, 1);
          assert.equal(libCache.set.calls[0].args[0], '/');
          assert.equal(libCache.set.calls[0].args[1], '<html>PageRendered</html>');
          assert.equal(libCache.storeCachedUrls.callCount, 1);
          assert.equal(libCache.storeCachedUrls.calls[0].args[0], '/');
          done();
        })
        .catch(err => {
          console.log(err);
        });
    });
  });
});
