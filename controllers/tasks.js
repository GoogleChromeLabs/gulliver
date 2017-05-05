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

const express = require('express');
const pwaLib = require('../lib/pwa');
const tasksLib = require('../lib/tasks');
const Task = require('../models/task');
const router = express.Router(); // eslint-disable-line new-cap
const promiseSequential = require('../lib/promise-sequential');

const APP_ENGINE_CRON = 'X-Appengine-Cron';

/**
 * GET /tasks/cron
 *
 * We use a GET from the cron job to launch a PWA update process
 * for all PWAs.
 */
router.get('/cron', (req, res, next) => {
  // Checks for the presence of the 'X-Appengine-Cron' header on the request.
  // Only requests from the App Engine cron are allowed.
  if (req.get(APP_ENGINE_CRON)) {
    pwaLib.list()
      .then(result => {
        // Create one update task for each PWA
        result.pwas.forEach(pwa => {
          const modulePath = require.resolve('../lib/pwa');
          tasksLib.push(new Task(pwa.id, modulePath, 'createOrUpdatePwa', 0));
        });
        res.sendStatus(200);
      })
      .catch(err => {
        next(err);
      });
  } else {
    res.sendStatus(403);
  }
});

/**
 * GET /tasks/execute?tasks=1
 *
 * We use a GET from the cron job to execute each PWA update task
 * The tasks parameter is the number of tasks to execute per run
 */
router.get('/execute', (req, res, next) => {
  // Checks for the presence of the 'X-Appengine-Cron' header on the request.
  // Only requests from the App Engine cron are allowed.
  const tasksToExecute = req.query.tasks ? req.query.tasks : 1;
  const tasksList = [];
  if (req.get(APP_ENGINE_CRON)) {
    try {
      for (let i = 0; i < tasksToExecute; i++) {
        tasksList.push(tasksLib.popExecute);
      }
      // Execute sequentially the 1 OR req.query.tasks of tasks
      promiseSequential.all(tasksList)
        .then(_ => {
          res.sendStatus(200);
        });
    } catch (err) {
      next(err);
    }
  } else {
    res.sendStatus(403);
  }
});

/**
 * Errors on "/task/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code
  };
  next(err);
});

module.exports = router;
