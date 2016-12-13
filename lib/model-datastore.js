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

const ENTITY_COUNT_KIND = 'counts';
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
      if (nonIndexed.indexOf(k) === -1) {
        value = deepCopy(obj[k]);
      } else {
        // nonIndexed properties need to be stored as Strings
        value = JSON.stringify(obj[k]);
      }
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
 * @param {number} offset
 * @param {number} limit
 * @param {number} sort
 * @return {Promise<Array<Object>>}
 */
function list(kind, offset, limit, sort) {
  return new Promise((resolve, reject) => {
    const q = ds.createQuery([kind])
      .offset(offset || 0)
      .limit(limit);

    if (sort) {
      q.order(sort.field, sort.config);
    }

    ds.runQuery(q, (err, entities, nextQuery) => {
      if (err) {
        return reject(err);
      }
      const hasMore = nextQuery.moreResults !== 'NO_MORE_RESULTS';
      resolve({
        entities: entities.map(fromDatastore),
        hasMore: hasMore,
        endCursor: nextQuery.endCursor
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

function startTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.run(err => {
      if (err) {
        return reject(err);
      }
      return resolve(transaction);
    });
  });
}

function commitTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.commit(err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

function rollbackTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.rollback(err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

function transactionGet(transaction, key) {
  return new Promise((resolve, reject) => {
    transaction.get(key, (err, entity) => {
      if (err) {
        return reject(err);
      }
      return resolve(entity);
    });
  });
}

function updateCount(transaction, kind, inc) {
  return new Promise((resolve, reject) => {
    const countKey = ds.key([ENTITY_COUNT_KIND, kind]);
    transaction.get(countKey, (err, countEntity) => {
      if (err) {
        return reject(err);
      }

      let count = 0;
      if (countEntity) {
        count = countEntity.data.count;
      }

      if (inc) {
        count++;
      } else {
        count--;
      }

      transaction.save({key: countKey, data: {count: count}});
      return resolve();
    });
  });
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
      data: toDatastore(data, ['description', '_manifest', '_lighthouseJson'])
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
 * Creates a new Entity or updates an existing Entity with new data. The provided
 * data is automatically translated into Datastore format. The Entity will be
 * queued for background processing.
 *
 * @param {string} kind
 * @param {string} id
 * @param {Object} data
 * @return {Promise<Object>}
 */
function updateWithCounts(kind, id, data) {
  let key;
  if (id) {
    key = ds.key([kind, parseKey(id)]);
  } else {
    key = ds.key(kind);
  }

  const entity = {
    key: key,
    data: toDatastore(data, ['description', '_manifest', '_lighthouseJson'])
  };

  const transaction = ds.transaction();
  return startTransaction(transaction)
    .then(_ => {
      transaction.save(entity);
      if (!id) {
        return updateCount(transaction, kind, true);
      }
      return Promise.resolve();
    })
    .then(_ => {
      return commitTransaction(transaction);
    })
    .then(_ => {
      data.id = key.id;
      return data;
    })
    .catch(err => {
      console.error(err);
      return rollbackTransaction(transaction)
        .then(_ => {
          return Promise.reject(err);
        });
    });
}

function count(kind) {
  return read(ENTITY_COUNT_KIND, kind)
    .then(entity => {
      if (!entity) {
        return 0;
      }
      return entity.count || 0;
    })
    .catch(_ => {
      return 0;
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
function _deleteWithCounts(kind, id) {
  const key = ds.key([kind, parseKey(id)]);
  const transaction = ds.transaction();
  return startTransaction(transaction)
    .then(_ => {
      return transactionGet(transaction, key);
    })
    .then(entity => {
      if (!entity) {
        return Promise.reject('Trying to delete entity that does not exist: ' + key.id);
      }
      transaction.delete(key);
      return updateCount(transaction, kind, false);
    })
    .then(_ => {
      return commitTransaction(transaction);
    })
    .catch(err => {
      return rollbackTransaction(transaction)
        .then(_ => {
          return Promise.reject(err);
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
  count: count,
  read: read,
  update: update,
  delete: _delete,
  updateWithCounts: updateWithCounts,
  deleteWithCounts: _deleteWithCounts,
  list: list
};
