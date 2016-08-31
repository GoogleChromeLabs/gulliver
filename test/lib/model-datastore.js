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

/* global describe it beforeEach */
'use strict';

const assert = require('assert');
const gcloud = require('gcloud');
const config = require('../../config/config');
const db = require('../../lib/model-datastore');
const ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT')
});
const ENTITY_NAME = 'test';

class TestClass {

}

const testObject = new TestClass();
testObject.array = ['A', 'B', 'C'];

const DB_OBJECT = {
  test: 'test',
  testObject: testObject,
  testObject2: {
    innerTestObject: testObject
  }
};

describe('lib.model-datastore', () => {
  const skipTests = process.env.TRAVIS;
  // Skip tests if Running in CI
  beforeEach(function() { // es-lint-ignore prefer-arrow-callback
    if (skipTests) {
      this.skip();
      return;
    }
    // Deletes all entities on the 'test' namespace before each test.
    return new Promise((resolve, reject) => {
      const q = ds.createQuery(ENTITY_NAME);
      ds.runQuery(q, (err, entities) => {
        if (err) {
          return reject(err);
        }

        const keys = entities.map(entity => {
          return entity.key;
        });

        ds.delete(keys, err => {
          return reject(err);
        });

        return resolve();
      });
    });
  });

  describe('#update', () => {
    it('returns correct values after adding a new object', () => {
      return db.update(ENTITY_NAME, null, DB_OBJECT)
        .then(saved => {
          assert.ok(saved.id, 'An ID has been created');
          assert.equal(saved.test, DB_OBJECT.test, 'The value of the "test" field is correct');
          assert.ok(Array.isArray(saved.testObject.array), 'Check if datastore is not modifying arrays');
        });
    });
  });

  describe('#find', () => {
    let objectId;

    beforeEach(function() {
      if (skipTests) {
        this.skip();
        return;
      }
      return db.update(ENTITY_NAME, null, DB_OBJECT).then(testObject => {
        objectId = testObject.id;
      });
    });

    it('find an object', () => {
      return db.read(ENTITY_NAME, objectId)
        .then(testObject => {
          assert.equal(objectId, testObject.id, 'Correct ID returned');
          assert.equal(testObject.test, DB_OBJECT.test);
        });
    });
  });

  describe('#list', () => {
    beforeEach(function() {
      if (skipTests) {
        this.skip();
        return;
      }

      return Promise.all([
        db.update(ENTITY_NAME, null, DB_OBJECT),
        db.update(ENTITY_NAME, null, DB_OBJECT),
        db.update(ENTITY_NAME, null, DB_OBJECT)
      ]);
    });

    it('list objects', () => {
      return db.list(ENTITY_NAME)
        .then(result => {
          assert.equal(result.entities.length, 3, 'Returns 3 entities');
        });
    });
  });

  describe('#delete', () => {
    let objectId;

    beforeEach(function() {
      if (skipTests) {
        this.skip();
        return;
      }
      return db.update(ENTITY_NAME, null, DB_OBJECT).then(testObject => {
        objectId = testObject.id;
      });
    });

    it('delete an object', () => {
      return db.delete(ENTITY_NAME, objectId)
        .then(() => {
          return db.read(ENTITY_NAME, objectId)
            .then(entity => {
              assert.ok(!entity);
            })
            .catch(() => { // es-lint-ignore handle-callback-err
              assert.ok(true);
            });
        });
    });
  });
});
