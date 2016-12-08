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
const bodyParser = require('body-parser');
const router = express.Router(); // eslint-disable-line new-cap
const notificationsLib = require('../../lib/notifications');
const jsonParser = bodyParser.json();

router.get('/topics/', (req, res) => {
  const token = req.query.token;
  notificationsLib.list(token)
    .then(subscriptions => {
      res.json({
        subscriptions: subscriptions
      });
    })
    .catch(err => {
      res.status(500);
      res.json(err);
    });
});

router.post('/subscribe/:topic/', jsonParser, (req, res) => {
  const token = req.body.token;
  const topic = req.params.topic;
  notificationsLib.subscribe(token, topic)
    .then(_ => {
      res.json({success: true});
    })
    .catch(err => {
      res.status(500);
      res.json(err);
    });
});

router.post('/unsubscribe/:topic/', jsonParser, (req, res) => {
  const token = req.body.token.trim();
  const topic = req.params.topic;
  notificationsLib.unsubscribe(token, topic)
    .then(_ => {
      res.json({success: true});
    })
    .catch(err => {
      res.status(500);
      res.json(err);
    });
});

module.exports = router;

