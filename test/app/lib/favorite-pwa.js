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

/* global describe it before beforeEach */
'use strict';

const assert = require('assert');
const gcloud = require('google-cloud');
const config = require('../../../config/config');
const ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT')
});

const FavoritePwa = require('../../../models/favorite-pwa');
const libFavoritePwa = require('../../../lib/favorite-pwa');

const ENTITY_NAME = 'FAVORITE-PWA';
const TEST_FAV_PWA = new FavoritePwa(123456789, 987654321);

describe('lib.favorite-pwa', () => {
  const skipTests = process.env.TRAVIS;
  // Skip tests if Running in CI
  before(function() {
    this.timeout(3000);
    if (skipTests) {
      this.skip();
      return;
    }

    // Deletes all entities on the 'test' namespace before each test.
    return new Promise((resolve, reject) => {
      const q = ds.createQuery(ENTITY_NAME).filter('pwaId', '=', parseInt(TEST_FAV_PWA.pwaId, 10));
      ds.runQuery(q, (err, entities) => {
        if (err) {
          return reject(err);
        }

        const keys = entities.map(entity => {
          return entity.key;
        });

        // Delete counts for 'test'.
        keys[keys.length] = ds.key(['counts', ENTITY_NAME]);
        ds.delete(keys, err => {
          return reject(err);
        });

        return resolve();
      });
    });
  });

  describe('#save and find', () => {
    beforeEach(function() {
      if (skipTests) {
        this.skip();
        return;
      }
    });

    let savedFavoritePwa;
    before(() => {
      if (skipTests) {
        return;
      }
      return libFavoritePwa.save(TEST_FAV_PWA)
        .then(saved => {
          savedFavoritePwa = saved;
        });
    });

    it('save', () => {
      assert.equal(savedFavoritePwa.pwaId, TEST_FAV_PWA.pwaId);
      assert.equal(savedFavoritePwa.userId, TEST_FAV_PWA.userId);
    });

    it('findByUserId', () => {
      return libFavoritePwa.findByUserId(TEST_FAV_PWA.userId)
        .then(foundFavoritePwas => {
          assert.equal(foundFavoritePwas[0].pwaId, TEST_FAV_PWA.pwaId);
          assert.equal(foundFavoritePwas[0].userId, TEST_FAV_PWA.userId);
        });
    });

    it('findFavoritePwa', () => {
      return libFavoritePwa.findFavoritePwa(TEST_FAV_PWA.pwaId, TEST_FAV_PWA.userId)
        .then(foundFavoritePwa => {
          assert.equal(foundFavoritePwa.pwaId, TEST_FAV_PWA.pwaId);
          assert.equal(foundFavoritePwa.userId, TEST_FAV_PWA.userId);
        });
    });
  });

  describe('#delete', () => {
    beforeEach(function() {
      if (skipTests) {
        this.skip();
        return;
      }
    });

    it('delete', () => {
      return libFavoritePwa.save(TEST_FAV_PWA)
        .then(saved => {
          return libFavoritePwa.delete(saved.id).should.be.fulfilled;
        });
    });
  });
});
