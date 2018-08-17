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
 * Checks for the presence of the 'X-Appengine-Cron' header on the request.
 * Only requests from the App Engine cron are allowed.
 */
function checkAppEngineCron(req, res, next) {
  // if (!req.get(APP_ENGINE_CRON)) {
  //   return res.sendStatus(403);
  // }
  return next();
}

/**
 * Creates a pwaLib.createOrUpdatePwa task for the given pwaId
 */
function createOrUpdatePwaTasks(pwaList) {
  const modulePath = require.resolve('../lib/pwa');
  pwaList.forEach(pwa => {
    tasksLib.push(new Task(pwa.id, modulePath, 'createOrUpdatePwa', 0));
  });
}

/**
 * GET /tasks/cron
 *
 * We use a GET from the cron job to launch a PWA update process
 * for all PWAs.
 *
 * Uses checkAppEngineCron to allow only request from cron job.
 */
router.get('/cron', checkAppEngineCron, (req, res, next) => {
  pwaLib.list(undefined, undefined, 'newest')
    .then(result => {
      // Create one update task for each PWA
      createOrUpdatePwaTasks(result.pwas);
      res.sendStatus(200);
    })
    .catch(err => {
      next(err);
    });
});

/**
 * GET /tasks/updateunscored
 *
 * We use a GET from the cron job to launch a PWA update process
 * for all PWAs.
 *
 * Uses checkAppEngineCron to allow only request from cron job.
 */
router.get('/updateunscored', checkAppEngineCron, (req, res, next) => {
  return pwaLib.list(undefined, undefined, 'newest')
    .then(result => {
      // Create one update task for each unscored PWA
      createOrUpdatePwaTasks(result.pwas.filter(pwa => !pwa.lighthouseScore));
      res.sendStatus(200);
    })
    .catch(err => {
      next(err);
    });
});

/**
 * GET /tasks/execute?tasks=1
 *
 * We use a GET from the cron job to execute each PWA update task
 * The tasks parameter is the number of tasks to execute per run
 *
 * Uses checkAppEngineCron to allow only request from cron job.
 */
router.get('/execute', checkAppEngineCron, (req, res) => {
  const tasksToExecute = req.query.tasks ? req.query.tasks : 1;
  // const tasksList = [];

  (async () => {
    const tasks = await tasksLib.getTasks(tasksToExecute);
    console.log(`Executing ${tasks.length} tasks`);

    for (let task of tasks) {
      try {
        console.log(`Will Execute Task: ${task.id}`);
        // Delete before executing, so we ensure that if the task breaks
        // something it is removed from the queue anyway.
        try {
          await tasksLib.deleteTask(task.id);
        } catch (err) {
          console.error(`Error deleting task: ${task.id}`);
        }
        await tasksLib.executePwaTask(task);
        console.log(`Executed Task: ${task.id}`);
      } catch (err) {
        console.error(`Failed to execute task: ${task.id}`);
      }
    }
    res.sendStatus(200);
  })();

  // try {
  //   for (let i = 0; i < tasksToExecute; i++) {
  //     tasksList.push(tasksLib.popExecute);
  //   }
  //   // Execute sequentially the 1 OR req.query.tasks of tasks
  //   promiseSequential.all(tasksList)
  //     .then(_ => {
  //       res.sendStatus(200);
  //     })
  //     .catch(err => {
  //       next(err);
  //     });
  // } catch (err) {
  //   next(err);
  // }
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
