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

const controllerApi = require('../../../../controllers/api');
const lighthouseLib = require('../../../../lib/lighthouse');

const express = require('express');
const app = express();
const request = require('supertest');
const simpleMock = require('simple-mock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
let assert = require('chai').assert;

describe('controllers.api.lighthouse', () => {
  before(done => {
    app.use(controllerApi);
    done();
  });

  describe('GET /api/lighthouse-graph/', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    it('respond with 200 if PWA exist', done => {
      simpleMock.mock(lighthouseLib, 'getLighthouseGraphByPwaId').resolveWith('mocked graph data');
      // /api/ is part of the router, we need to start from /lighthouse-graph/
      request(app)
        .get('/lighthouse/graph/1234567')
        .expect('Content-Type', /json/)
        .expect(200).should.be.fulfilled.then(res => {
          assert.equal(res.body, 'mocked graph data');
          assert.equal(lighthouseLib.getLighthouseGraphByPwaId.callCount, 1);
          assert.equal(lighthouseLib.getLighthouseGraphByPwaId.lastCall.arg, 1234567);
          done();
        });
    });

    it('respond with 404 if PWA does not exist', done => {
      simpleMock.mock(lighthouseLib, 'getLighthouseGraphByPwaId').resolveWith(null);
      // /api/ is part of the router, we need to start from /lighthouse-graph/
      request(app)
        .get('/lighthouse/graph/123')
        .expect('Content-Type', /json/)
        .expect(400).should.be.rejected.then(res => {
          assert.equal(res.body, undefined);
          assert.equal(lighthouseLib.getLighthouseGraphByPwaId.callCount, 1);
          assert.equal(lighthouseLib.getLighthouseGraphByPwaId.lastCall.arg, '123');
          done();
        });
    });
  });
});
