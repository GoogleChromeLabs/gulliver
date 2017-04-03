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

const Memcached = require('memcached');
const memcachedAddr = process.env.MEMCACHE_PORT_11211_TCP_ADDR || 'localhost';
const memcachedPort = process.env.MEMCACHE_PORT_11211_TCP_PORT || '11211';
const memcached = new Memcached(memcachedAddr + ':' + memcachedPort, {timeout: 1000, retries: 1});

/**
 * Gets a value from memcached using.
 *
 * @param {object} a key.
 * @returns a Promise
 */
function get(key) {
  return new Promise((resolve, reject) => {
    memcached.get(key, (err, value) => {
      if (err) {
        return reject(err);
      }

      if (!value) {
        return reject('Not Found. Key: ' + key);
      }

      return resolve(value);
    });
  });
}

/**
 * Deletes a value from memcached.
 *
 * @param {object} a key.
 * @returns a Promise
 */
function del(key) {
  return new Promise((resolve, reject) => {
    memcached.del(key, (err, value) => {
      if (err) {
        return reject(err);
      }

      if (!value) {
        return reject('Not Found. Key: ' + key);
      }

      return resolve(value);
    });
  });
}

/**
 * Sets a value in Memcached.
 *
 * @param {object} the key.
 * @param {object} the value.
 * @param {Number} a lifetime.
 * @returns a Promise
 */
function set(key, value, lifetime) {
  return new Promise((resolve, reject) => {
    memcached.set(key, value, lifetime, err => {
      if (err) {
        console.error(err);
        return reject(err);
      }
      return resolve();
    });
  });
}

/**
 * Replaces a value in Memcached.
 *
 * @param {object} the key.
 * @param {object} the value.
 * @param {Number} a lifetime.
 * @returns a Promise
 */
function replace(key, value, lifetime) {
  return new Promise((resolve, reject) => {
    memcached.replace(key, value, lifetime, err => {
      if (err) {
        console.error(err);
        return reject(err);
      }
      return resolve();
    });
  });
}

function getMulti(keys) {
  return new Promise((resolve, reject) => {
    memcached.getMulti(keys, (err, data) => {
      if (err) {
        console.error(err);
        return reject(err);
      }
      return resolve(data);
    });
  });
}

function flush() {
  memcached.flush();
}

module.exports = {
  get: get,
  del: del,
  set: set,
  replace: replace,
  flush: flush,
  getMulti: getMulti
};
