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

const URL = require('url');
const elasticlunr = require('elasticlunr');
const libCache = require('../lib/data-cache');
const libPwaIndex = require('../lib/pwa-index');

const CACHE_LIFETIME = 60 * 60 * 24 * 7; // 7 days
const SEARCH_INDEX_CHANGE = 'SearchIndexChange';

/**
 * Search class for the elasticlunr functions
 *
 * Exports a singleton object instance
 */
class Search {

  constructor() {
    this._initIndex();
  }

  _initIndex() {
    this._index = elasticlunr(function() {
      this.setRef('id');
      this.addField('displayName');
      this.addField('urlText');
    });
    this._modified = new Date();
  }

  /**
   * Create a doc element from a PWA.
   *
   * @param {PWA} PWA to index
   * @return {doc} a doc for the text search engine
   */
  _docFromPwa(pwa) {
    const url = URL.parse(pwa.absoluteStartUrl);
    const urlText = url.hostname.replace(/\.|-/g, ' ');
    return {
      id: pwa.id,
      displayName: pwa.displayName,
      urlText: urlText
    };
  }

  /**
   * Add a PWA to the search index.
   *
   * @param {PWA} PWA to index
   * @return {Promise<doc>} the doc added to the text search engine
   */
  addPwa(pwa) {
    const doc = this._addPwa(pwa);
    this.sarchIndexChange();
    return Promise.resolve(doc);
  }

  /**
   * Add a list of PWA to the search index.
   *
   * @param {PWA[]} PWAs to index
   * @return {Promise<>}
   */
  addPwas(pwas) {
    pwas.forEach(pwa => this._addPwa(pwa));
    this.sarchIndexChange();
    return Promise.resolve();
  }

  _addPwa(pwa) {
    const doc = this._docFromPwa(pwa);
    this._index.addDoc(doc);
    return doc;
  }

  /**
   * Update a PWA on the search index.
   *
   * @param {PWA} PWA to update
   * @return {Promise<doc>} the doc updated on the text search engine
   */
  updatePwa(pwa) {
    const doc = this._docFromPwa(pwa);
    this._index.updateDoc(doc);
    this.sarchIndexChange();
    return Promise.resolve(doc);
  }

  /**
   * Remove a PWA from the search index.
   *
   * @param {PWA} PWA to remove
   * @return {Promise<doc>} the doc removed from the text search engine
   */
  removePwa(pwa) {
    const doc = this._docFromPwa(pwa);
    this._index.removeDoc(doc);
    this.sarchIndexChange();
    return Promise.resolve(doc);
  }

  /**
   * Search the text index.
   *
   * @param {string} query
   * @return {Promise<json>} with the matching PWA Ids and scores
   *
   * [{
   *    "ref": 123456789,
   *    "score": 0.5376053707962494
   *  },
   *  {
   *    "ref": 456789012,
   *    "score": 0.5237481076838757
   * }]
   */
  search(string) {
    const options = {expand: true};
    const result = this._index.search(string, options);
    // Update the search index for the next query
    this.checkForSearchIndexChange();
    return Promise.resolve(result);
  }

  /**
   * Record a change in the search index in memcached.
   *
   * @param {date} optional date
   */
  sarchIndexChange(date) {
    date = date || new Date();
    libCache.set(SEARCH_INDEX_CHANGE, date, CACHE_LIFETIME);
  }

  /**
   * Check of the latest change in the search index and updete if needed.
   *
   * @param {date} optional date
   */
  checkForSearchIndexChange() {
    libCache.get(SEARCH_INDEX_CHANGE).then(lastChange => {
      lastChange = new Date(lastChange);
      if (lastChange && lastChange > this._modified) {
        console.log('Re-index PWAs');
        // Invalidate index and re-index all PWAs
        this._initIndex();
        libPwaIndex.indexAllPwas().then(_ => {
          const newDate = new Date();
          this._modified = newDate;
          this.sarchIndexChange(newDate);
        });
      }
    });
  }
}

// Export Search as a singleton object
module.exports = new Search();
