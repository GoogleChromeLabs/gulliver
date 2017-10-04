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
const router = express.Router(); // eslint-disable-line new-cap

// Includes APIs for Lighthouse (/api/lighthouse)
router.use('/lighthouse', require('./lighthouse'));

// Includes APIs for Notifications (/api/notifications)
router.use('/notifications', require('./notifications'));

// Includes APIs for FavoritePwas (/api/favoritepwa)
router.use('/favorite-pwa', require('./favorite-pwa'));

// Includes APIs for PWAs (/api/pwa)
router.use('/pwa', require('./pwa'));

module.exports = router;
