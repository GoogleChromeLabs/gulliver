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

'use strict';

const db = require('../lib/model-datastore');
const FavoritePwa = require('../models/favorite-pwa');

const ENTITY_NAME = 'FAVORITE-PWA';

/**
 * Saves a FavoritePwa object into the DB.
 *
 * @param {FavoritePwa} lighthouse
 * @return {Promise<FavoritePwa>}
 */
exports.save = function(favoritePwa) {
  return new Promise((resolve, reject) => {
    db.update(ENTITY_NAME, favoritePwa.id, favoritePwa)
      .then(result => {
        return resolve(result);
      })
      .catch(err => {
        console.log(err);
        return reject('Error saving the FavoritePwa');
      });
  });
};

/**
 * Retrieves FavoritePwas for a given User.
 *
 * @param {number} userId
 * @return {Promise<FavoritePwa>}
 */
exports.findByUserId = function(userId) {
  const query = db.createQuery(ENTITY_NAME).filter('userId', '=', parseInt(userId, 10));
  return db.runQuery(query).then(result => {
    if (!result || result.entities.length === 0) {
      return null;
    }
    let favoritePwas = result.entities.map(favoritePwa => {
      return Object.assign(new FavoritePwa(), favoritePwa);
    });
    return favoritePwas;
  });
};

/**
 * Retrieves FavoritePwas for given User & PWA.
 *
 * @param {number} pwaId
 * @param {number} userId
 * @return {Promise<FavoritePwa>}
 */
exports.isFavorite = function(pwaId, userId) {
  const query = db.createQuery(ENTITY_NAME).filter('pwaId', '=', parseInt(pwaId, 10))
      .filter('userId', '=', parseInt(userId, 10)).limit(1);
  return db.runQuery(query).then(result => {
    if (!result || result.entities.length === 0) {
      return null;
    }
    let favoritePwas = result.entities.map(favoritePwa => {
      return Object.assign(new FavoritePwa(), favoritePwa);
    });
    return favoritePwas;
  });
};

/**
 * Deletes a FavoritePwa from DB.
 *
 * @param {number} key of the FavoritePwa
 * @return {Promise<>}
 */
exports.delete = function(key) {
  return db.delete(ENTITY_NAME, key);
};
