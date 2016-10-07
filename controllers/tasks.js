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

const APP_ENGINE_CRON = 'X-Appengine-Cron';

/**
 * GET /task/cron
 *
 * We use a GET from the cron job to launch a PWA update process
 * for all PWAs.
 */
router.get('/cron', (req, res, next) => {
  // Only requests from App Engine Cron are allowed
  if (req.get(APP_ENGINE_CRON)) {
    pwaLib.list()
      .then(result => {
        // Create one taks for each PWA
        for (let i = 0; i < result.pwas.length; i++) {
          tasksLib.push(new Task(result.pwas[i].id));
        }
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
 * GET /task/execute
 *
 * We use a GET from the cron job to execute each PWA update task
 */
router.get('/execute', (req, res, next) => {
  // Only requests from App Engine Cron are allowed
  if (req.get(APP_ENGINE_CRON)) {
    tasksLib.pop()
      .then(taks => {
        if (taks) {
          pwaLib.find(taks.pwaId)
            .then(pwa => {
              // Saving the PWA trigers the update process
              pwaLib.save(pwa);
            })
            .catch(err => {
              next(err);
            });
        }
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
