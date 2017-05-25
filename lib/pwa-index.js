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

const libSearch = require('../lib/search');
const libPwa = require('../lib/pwa');
const Pwa = require('../models/pwa');
const db = require('../lib/model-datastore');
const ENTITY_NAME = 'PWA';

/**
 * Add all PWAs from the DB into the text search index.
 */
exports.indexAllPwas = _ => {
  let indexPage = (skip, limit) =>
    db.list(ENTITY_NAME, skip, limit)
      .then(result => {
        const pwas = result.entities.map(pwa => {
          return Object.assign(new Pwa(), pwa);
        });
        libSearch.addPwas(pwas);
        if (result.hasMore) {
          return indexPage(skip + limit, limit);
        }
        console.log('All PWAs indexed');
        return Promise.resolve();
      });
  return indexPage(0, 100);
};

/**
 * Search for PWAS using the text search index.
 *
 * @param {string} query
 * @return {resultPage} resultPage with an arrays of PWAs and hasMore boolean
 */
exports.searchPwas = string => {
  return libSearch.search(string).then(result => {
    let pwas = new Array(result.length);
    let find = (currentValue, index) => {
      return libPwa.find(currentValue.ref).then(pwa => {
        // Inserting at index to keep result order
        // because Promises run in parallel
        pwas[index] = pwa;
      });
    };
    return Promise.all(result.map(find)).then(_ => {
      // Returning all results without pagination for now
      const resultPage = {
        pwas: pwas,
        hasMore: false
      };
      return Promise.resolve(resultPage);
    });
  });
};

/**
 * Update PWA in the search index.
 *
 * @param {Pwa} pwa to update
 * @return {Promise<Pwa>}
 */
exports.updateSearchIndex = function(pwa) {
  if (pwa.isNew()) {
    libSearch.addPwa(pwa);
  } else {
    libSearch.updatePwa(pwa);
  }
  return Promise.resolve(pwa);
};
