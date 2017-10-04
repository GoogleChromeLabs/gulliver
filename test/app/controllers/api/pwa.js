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
const libPwa = require('../../../../lib/pwa');
const testPwa = require('../../models/pwa');

const express = require('express');
const app = express();
const request = require('supertest');
const simpleMock = require('simple-mock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
let assert = require('chai').assert;

const MANIFEST_URL = 'https://pwa-directory.appspot.com/manifest.json';
/* eslint-disable camelcase */
const MANIFEST_DATA = {
  name: 'PWA Directory',
  short_name: 'PwaDirectory',
  start_url: '/?utm_source=homescreen'
};

describe('controllers.api.pwa', () => {
  before(done => {
    app.use(controllerApi);
    done();
  });

  describe('GET /api/pwa', () => {
    const pwa = testPwa.newPwa(MANIFEST_URL, MANIFEST_DATA);
    pwa.id = '789';
    const result = {};
    result.pwas = [pwa];

    afterEach(() => {
      simpleMock.restore();
    });

    it('respond with 200 and json', done => {
      simpleMock.mock(libPwa, 'list').resolveWith(Promise.resolve(result));
      // /api/ is part of the router, we need to start from /pwa/
      request(app)
        .get('/pwa/')
        .expect('Content-Type', /json/)
        .expect(200).should.be.fulfilled.then(_ => {
          assert.equal(libPwa.list.callCount, 1);
          done();
        });
    });

    it('respond with 200 and csv', done => {
      simpleMock.mock(libPwa, 'list').resolveWith(Promise.resolve(result));
      // /api/ is part of the router, we need to start from /pwa/
      request(app)
        .get('/pwa?format=csv')
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect(200).should.be.fulfilled.then(_ => {
          assert.equal(libPwa.list.callCount, 1);
          done();
        });
    });
  });
});
