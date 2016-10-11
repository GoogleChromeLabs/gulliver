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

const controllerTasks = require('../../controllers/tasks');
const tasksLib = require('../../lib/tasks');
const pwaLib = require('../../lib/pwa');
const Pwa = require('../../models/pwa');
const Task = require('../../models/task');

const express = require('express');
const app = express();
const request = require('supertest');
const simpleMock = require('simple-mock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
const assert = require('chai').assert;

const APP_ENGINE_CRON = 'X-Appengine-Cron';
const MANIFEST_URL = 'https://www.terra.com.br/manifest-br.json';

describe('controllers.tasks', () => {
  let pwa;
  let listPwas = {};
  let task;
  before(done => {
    app.use(controllerTasks);
    pwa = new Pwa(MANIFEST_URL, null);
    pwa.id = 123456789;
    listPwas.pwas = new Array(pwa);
    task = new Task(123456789);
    done();
  });

  describe('GET /tasks/cron', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    it('respond with 403 forbidden when X-Appengine-Cron not present', done => {
      request(app)
        .get('/cron')
        .expect(403, done);
    });

    it('respond with 200 when X-Appengine-Cron is present', done => {
      // Mock lib to avoid making real calls
      simpleMock.mock(tasksLib, 'push').resolveWith(null);
      simpleMock.mock(pwaLib, 'list').resolveWith(listPwas);
      request(app)
        .get('/cron')
        .set(APP_ENGINE_CRON, true)
        .expect(200).should.be.fulfilled.then(_ => {
          assert.equal(pwaLib.list.callCount, 1);
          assert.equal(tasksLib.push.callCount, 1);
          done();
        });
    });
  });

  describe('GET /tasks/execute', () => {
    afterEach(() => {
      simpleMock.restore();
    });

    it('respond with 403 forbidden when X-Appengine-Cron not present', done => {
      request(app)
        .get('/execute')
        .expect(403, done);
    });

    it('respond with 200 when X-Appengine-Cron is present', done => {
      // Mock lib to avoid making real calls
      simpleMock.mock(tasksLib, 'pop').resolveWith(task);
      simpleMock.mock(pwaLib, 'find').resolveWith(pwa);
      simpleMock.mock(pwaLib, 'save').resolveWith(pwa);
      request(app)
        .get('/execute')
        .set(APP_ENGINE_CRON, true)
        .expect(200).should.be.fulfilled.then(_ => {
          assert.equal(tasksLib.pop.callCount, 1);
          assert.equal(pwaLib.find.callCount, 1);
          assert.equal(pwaLib.save.callCount, 1);
          done();
        });
    });
  });
});
