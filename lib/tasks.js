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

const config = require('../config/config');
const db = require('../lib/model-' + config.get('DATA_BACKEND'));
const Task = require('../models/task');

const ENTITY_NAME = 'Task';
const E_SAVING_TASK = exports.E_SAVING_TASK = 1;
const E_GET_TASK_POP = exports.E_GET_TASK_POP = 2;
const E_DELETE_TASK_POP = exports.E_DELETE_TASK_POP = 3;

/**
 * Push a Task object into the DB.
 *
 * @param {Task} lighthouse
 * @return {Promise<Task>}
 */
exports.push = function(task) {
  return new Promise((resolve, reject) => {
    db.update(ENTITY_NAME, task.id, task)
      .then(result => {
        return resolve(result);
      })
      .catch(err => {
        console.log(err);
        return reject(E_SAVING_TASK);
      });
  });
};

/**
 * Pop the oldest Task
 *
 * @return {Promise<Task>}
 */
exports.pop = function() {
  return new Promise((resolve, reject) => {
    db.list(ENTITY_NAME, 0, 1, {field: 'created', config: {ascending: true}})
      .then(result => {
        if (result.entities.length === 0) {
          return resolve(null);
        }
        let task = Object.assign(new Task(), result.entities[0]);
        db.delete(ENTITY_NAME, task.id)
          .then(_ => {
            return resolve(task);
          }).catch(err => {
            console.log(err);
            return reject(E_DELETE_TASK_POP);
          });
      })
      .catch(_ => {
        return reject(E_GET_TASK_POP);
      });
  });
};
