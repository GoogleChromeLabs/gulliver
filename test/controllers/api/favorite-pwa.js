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

const controllerApi = require('../../../controllers/api');
const libFavoritePwa = require('../../../lib/favorite-pwa');
const verifyIdToken = require('../../../lib/verify-id-token');

const express = require('express');
const app = express();
const request = require('supertest');
const simpleMock = require('simple-mock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
let assert = require('chai').assert;

describe('controllers.api.favorite-pwa', () => {
  before(done => {
    app.use(controllerApi);
    done();
  });

  describe('GET /api/favorite-pwa/', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    const testGoogleLogin = {};
    testGoogleLogin.getPayload = () => {
      return {sub: '1234567890'};
    };

    it('respond with 401 if missing user idToken', done => {
      // /api/ is part of the router, we need to start from /favorite-pwa/
      request(app)
        .get('/favorite-pwa')
        .expect('Content-Type', /json/)
        .expect(401).should.be.fulfilled.then(res => {
          assert.equal(res.body, '401 Unauthorized');
          done();
        });
    });

    it('respond with 200 if Favorite PWA exist', done => {
      simpleMock.mock(libFavoritePwa, 'findByUserId').resolveWith('list of favorite pwas');
      simpleMock.mock(verifyIdToken, 'verifyIdToken').resolveWith(testGoogleLogin);
      // /api/ is part of the router, we need to start from /favorite-pwa/
      request(app)
        .get('/favorite-pwa?idToken=1234567890').set('Authorization', 'ID_TOKEN')
        .expect('Content-Type', /json/)
        .expect(200).should.be.fulfilled.then(res => {
          assert.equal(res.body, 'list of favorite pwas');
          assert.equal(libFavoritePwa.findByUserId.callCount, 1);
          assert.equal(libFavoritePwa.findByUserId.lastCall.arg,
            '01b307acba4f54f55aafc33bb06bbbf6ca803e9a');
          done();
        });
    });

    it('respond with 404 if Favorite PWA does not exist', done => {
      simpleMock.mock(libFavoritePwa, 'findByUserId').resolveWith(null);
      simpleMock.mock(verifyIdToken, 'verifyIdToken').resolveWith(testGoogleLogin);
      // /api/ is part of the router, we need to start from /favorite-pwa/
      request(app)
        .get('/favorite-pwa?idToken=1234567890').set('Authorization', 'ID_TOKEN')
        .expect('Content-Type', /json/)
        .expect(404).should.be.fulfilled.then(res => {
          assert.equal(res.body, 'not found');
          assert.equal(libFavoritePwa.findByUserId.callCount, 1);
          assert.equal(libFavoritePwa.findByUserId.lastCall.arg,
            '01b307acba4f54f55aafc33bb06bbbf6ca803e9a');
          done();
        });
    });
  });

  describe('GET /api/favorite-pwa/:pwaId', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    const testGoogleLogin = {};
    testGoogleLogin.getPayload = () => {
      return {sub: '1234567890'};
    };

    it('respond with 401 if missing user idToken', done => {
      // /api/ is part of the router, we need to start from /favorite-pwa/
      request(app)
        .get('/favorite-pwa/1234567')
        .expect('Content-Type', /json/)
        .expect(401).should.be.fulfilled.then(res => {
          assert.equal(res.body, '401 Unauthorized');
          done();
        });
    });

    it('respond with 200 if findFavoritePwa exist', done => {
      simpleMock.mock(libFavoritePwa, 'findFavoritePwa').resolveWith('list of favorite pwas');
      simpleMock.mock(verifyIdToken, 'verifyIdToken').resolveWith(testGoogleLogin);
      // /api/ is part of the router, we need to start from /favorite-pwa/
      request(app)
        .get('/favorite-pwa/1234567').set('Authorization', 'ID_TOKEN')
        .expect('Content-Type', /json/)
        .expect(200).should.be.fulfilled.then(res => {
          assert.equal(res.body, 'list of favorite pwas');
          assert.equal(libFavoritePwa.findFavoritePwa.callCount, 1);
          assert.equal(libFavoritePwa.findFavoritePwa.lastCall.args[0],
            '1234567');
          assert.equal(libFavoritePwa.findFavoritePwa.lastCall.args[1],
            '01b307acba4f54f55aafc33bb06bbbf6ca803e9a');
          done();
        });
    });

    it('respond with 404 if findFavoritePwa does not exist', done => {
      simpleMock.mock(libFavoritePwa, 'findFavoritePwa').resolveWith(null);
      simpleMock.mock(verifyIdToken, 'verifyIdToken').resolveWith(testGoogleLogin);
      // /api/ is part of the router, we need to start from /favorite-pwa/
      request(app)
        .get('/favorite-pwa/1234567').set('Authorization', 'ID_TOKEN')
        .expect('Content-Type', /json/)
        .expect(404).should.be.fulfilled.then(res => {
          assert.equal(res.body, 'not found');
          assert.equal(libFavoritePwa.findFavoritePwa.callCount, 1);
          assert.equal(libFavoritePwa.findFavoritePwa.lastCall.args[0],
            '1234567');
          assert.equal(libFavoritePwa.findFavoritePwa.lastCall.args[1],
            '01b307acba4f54f55aafc33bb06bbbf6ca803e9a');
          done();
        });
    });
  });
});
