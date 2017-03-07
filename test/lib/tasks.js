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

let dataFetcher = require('../../lib/data-fetcher');
let libTasks = require('../../lib/tasks');
let libPwa = require('../../lib/pwa');
let db = require('../../lib/model-datastore');
let Pwa = require('../../models/pwa');
let Task = require('../../models/task');
let Manifest = require('../../models/manifest');

let simpleMock = require('simple-mock');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
let assert = require('chai').assert;

const MANIFEST_URL = 'https://www.terra.com.br/manifest-br.json';
const MANIFEST_DATA = './test/manifests/icon-url-with-parameter.json';

describe('lib.tasks', () => {
  let manifest;
  let pwa;
  let task;
  let dbListResult = {};
  before(done => {
    dataFetcher.readFile(MANIFEST_DATA)
      .then(jsonString => {
        manifest = new Manifest(MANIFEST_URL, JSON.parse(jsonString));
        pwa = new Pwa(MANIFEST_URL, manifest);
        pwa.id = 123456789;
        task = new Task(123456789);
        dbListResult.entities = new Array(task);
        done();
      });
  });

  describe('#push', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('push a task', () => {
      // Mock bd to avoid making real calls
      simpleMock.mock(db, 'update').resolveWith(task);
      simpleMock.mock(libTasks, 'db').returnWith(db);
      return libTasks.push(task).should.be.fulfilled.then(savedTask => {
        assert.equal(savedTask.pwaId, 123456789);
        assert.equal(db.update.callCount, 1);
      });
    });
  });

  describe('#pop', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('pop a task', () => {
      // Mock bd to avoid making real calls
      simpleMock.mock(db, 'list').resolveWith(dbListResult);
      simpleMock.mock(db, 'delete').resolveWith(task);
      simpleMock.mock(libTasks, 'db').returnWith(db);
      return libTasks.pop(task).should.be.fulfilled.then(savedTask => {
        assert.equal(savedTask.pwaId, 123456789);
        assert.equal(db.list.callCount, 1);
        assert.equal(db.delete.callCount, 1);
      });
    });
  });

  describe('#execute', () => {
    afterEach(() => {
      simpleMock.restore();
    });
    it('execute a task', () => {
      const modulePath = require.resolve('../../lib/pwa');
      const task = new Task(987654321, modulePath, 'createOrUpdatePwa', 1);
      simpleMock.mock(libPwa, 'find').resolveWith(pwa);
      simpleMock.mock(libPwa, 'createOrUpdatePwa').resolveWith(pwa);
      simpleMock.mock(libTasks, 'push').resolveWith(task);
      return libTasks.executePwaTask(task).should.be.fulfilled.then(executedTask => {
        assert.equal(libPwa.find.callCount, 1);
        assert.equal(libPwa.createOrUpdatePwa.callCount, 1);
        assert.equal(executedTask.pwaId, 987654321);
        assert.equal(libTasks.push.callCount, 0);
        assert.equal(executedTask.retries, 1);
      });
    });
    it('retry a task', () => {
      const modulePath = require.resolve('../../lib/pwa');
      const task = new Task(987654321, modulePath, 'createOrUpdatePwa', 1);
      simpleMock.mock(libPwa, 'find').resolveWith(pwa);
      simpleMock.mock(libPwa, 'createOrUpdatePwa').rejectWith(new Error('Retry task'));
      simpleMock.mock(libTasks, 'push').resolveWith(task);
      return libTasks.executePwaTask(task).should.be.fulfilled.then(executedTask => {
        assert.equal(libPwa.find.callCount, 1);
        assert.equal(libPwa.createOrUpdatePwa.callCount, 1);
        assert.equal(executedTask.pwaId, 987654321);
        assert.equal(libTasks.push.callCount, 1);
        assert.equal(executedTask.retries, 0);
      });
    });
  });
});
