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

const gcloud = require('google-cloud');
const config = require('../config/config');

const ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT')
});

/**
 * Translates from Datastore's entity format to
 * the format expected by the application.
 *
 * Datastore format:
 *   {
 *     key: [kind, id],
 *     data: {
 *       property: value
 *     }
 *   }
 *
 * Application format:
 *   {
 *     id: id,
 *     property: value
 *   }
 *
 * @param {Object} obj
 * @return {Object}
 */
function fromDatastore(obj) {
  obj.data.id = obj.key.id;
  return obj.data;
}

/**
 * Translates from the application's format to the datastore's
 * extended entity property format. It also handles marking any
 * specified properties as non-indexed. Does not translate the key.
 *
 * Application format:
 *   {
 *     id: id,
 *     property: value,
 *     unindexedProperty: value
 *   }
 *
 * Datastore extended format:
 *   [
 *     {
 *       name: property,
 *       value: value
 *     },
 *     {
 *       name: unindexedProperty,
 *       value: value,
 *       excludeFromIndexes: true
 *     }
 *   ]
 *
 * @param {Object} obj
 * @param {Array} nonIndexed
 * @return {Array<DBObject>}
 */
function toDatastore(obj, nonIndexed) {
  nonIndexed = nonIndexed || [];
  const results = [];
  Object.keys(obj).forEach(k => {
    if (obj[k] === undefined) {
      return;
    }

    let value;
    if (obj[k] instanceof Object) {
      value = deepCopy(obj[k]);
    } else {
      value = obj[k];
    }

    results.push({
      name: k,
      value: value,
      excludeFromIndexes: nonIndexed.indexOf(k) !== -1
    });
  });
  return results;
}

function deepCopy(object) {
  if (!(object instanceof Object)) {
    return object;
  }

  if (object instanceof Date) {
    return object;
  }

  const clone = Object.assign({}, object);
  Object.keys(clone).forEach(k => {
    clone[k] = deepCopy(clone[k]);
  });

  return clone;
}

/**
 * Lists all Entities in the Datastore sorted alphabetically by title.
 * The ``limit`` argument determines the maximum amount of results to
 * return per page. The ``token`` argument allows requesting additional
 * pages. The callback is invoked with ``(err, Entities, nextPageToken)``.
 *
 * @param {string} kind
 * @param {number} limit
 * @param {number} token
 * @return {Promise<Array<Object>>}
 */
function list(kind, limit, token, sort) {
  return new Promise((resolve, reject) => {
    const q = ds.createQuery([kind])
      .limit(limit)
      .start(token);

    if (sort) {
      q.order(sort.field, sort.config);
    }

    ds.runQuery(q, (err, entities, nextQuery) => {
      if (err) {
        return reject(err);
      }
      const hasMore = entities.length === limit ? nextQuery.startVal : false;
      resolve({
        entities: entities.map(fromDatastore),
        hasMore: hasMore
      });
    });
  });
}

/**
 * Parse the Key to a number if possible
 * @param {object} key
 * @return {object : number}
 */
function parseKey(key) {
  return isNaN(key) ? key : parseInt(key, 10);
}

/**
 * Creates a new Entity or updates an existing Entity with new data. The provided
 * data is automatically translated into Datastore format. The Entity will be
 * queued for background processing.
 *
 * @param {string} kind
 * @param {string} id
 * @param {Object} data
 * @return {Promise<Object>}
 */
function update(kind, id, data) {
  return new Promise((resolve, reject) => {
    let key;
    if (id) {
      key = ds.key([kind, parseKey(id)]);
    } else {
      key = ds.key(kind);
    }

    const entity = {
      key: key,
      data: toDatastore(data, ['description'])
    };

    ds.save(
      entity,
      err => {
        data.id = entity.key.id;
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      }
    );
  });
}

/**
 * Reads an Object of the specified kind and Id from the Datastore.
 *
 * @param {string} kind
 * @param {string} id
 * @return {Promise<Object>}
 */
function read(kind, id) {
  return new Promise((resolve, reject) => {
    const key = ds.key([kind, parseKey(id)]);
    ds.get(key, (err, entity) => {
      if (err) {
        return reject(err);
      }
      if (!entity) {
        return reject({
          code: 404,
          message: 'Not found'
        });
      }
      resolve(fromDatastore(entity));
    });
  });
}

/**
 * Deletes an Object with the specified kind and Id from the Datastore
 *
 * @param {string} kind
 * @param {string} id
 * @return {Promise<>}
 */
function _delete(kind, id) {
  return new Promise((resolve, reject) => {
    const key = ds.key([kind, parseKey(id)]);
    ds.delete(key, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

module.exports = {
  create: (kind, data) => {
    update(kind, null, data);
  },
  read: read,
  update: update,
  delete: _delete,
  list: list
};
