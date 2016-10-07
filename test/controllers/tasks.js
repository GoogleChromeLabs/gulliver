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

/* global describe it before afterEach*/
'use strict';

const express = require('express');
const app = express();
var request = require('supertest');

let controllerTasks = require('../../controllers/tasks');

let simpleMock = require('simple-mock');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
let assert = require('chai').assert;

const APP_ENGINE_CRON = 'X-Appengine-Cron';

describe('controllers.tasks', () => {
  describe('GET /tasks/cron', function() {
    app.use(controllerTasks);
    it('respond with 403 forbidden', function(done) {
      request(app)
        .get('/cron')
        .expect(403, done);
    });

    it('respond with 200', function(done) {
      request(app)
        .get('/cron')
        .set(APP_ENGINE_CRON, true)
        .expect(200, done);
    });
  });

  describe('GET /tasks/execute', function() {
    app.use(controllerTasks);
    it('respond with 403 forbidden', function(done) {
      request(app)
        .get('/execute')
        .expect(403, done);
    });

    it('respond with 200', function(done) {
      request(app)
        .get('/execute')
        .set(APP_ENGINE_CRON, true)
        .expect(200, done);
    });
  });
});
