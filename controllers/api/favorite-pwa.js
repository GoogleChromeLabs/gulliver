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

const verifyIdToken = require('../../lib/verify-id-token');
const libFavoritePwa = require('../../lib/favorite-pwa');
const FavoritePwa = require('../../models/favorite-pwa');
const User = require('../../models/user');

/**
 * GET /favorite-pwa/
 *
 * Returns all Favorite PWAs for a user
 */
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const idToken = req.get('Authorization');
  if (!idToken) {
    res.status(401);
    res.json('401 Unauthorized');
    return;
  }

  return verifyIdToken.verifyIdToken(idToken)
    .then(googleLogin => {
      const user = new User(googleLogin);
      return libFavoritePwa.findByUserId(user.id);
    })
    .then(favoritePwas => {
      if (favoritePwas) {
        res.json(favoritePwas);
      } else {
        res.status(404);
        res.json('not found');
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500);
      res.json('Server error while loading Favorite PWAs');
    });
});

/**
 * GET /favorite-pwa/:pwaId
 *
 * Returns a Favorite PWA for a pwaId and user
 */
router.get('/:pwaId', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const pwaId = req.params.pwaId;
  const idToken = req.get('Authorization');
  if (!idToken) {
    res.status(401);
    res.json('401 Unauthorized');
    return;
  }

  return verifyIdToken.verifyIdToken(idToken)
    .then(googleLogin => {
      const user = new User(googleLogin);
      return libFavoritePwa.findFavoritePwa(pwaId, user.id);
    })
    .then(favoritePwas => {
      if (favoritePwas) {
        res.json(favoritePwas);
      } else {
        res.status(404);
        res.json('not found');
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500);
      res.json('Server error while loading Favorite PWAs');
    });
});

/**
 * POST /favorite-pwa/
 *
 * Create a Favorite PWA.
 */
router.post('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const idToken = req.body.idToken;
  const pwaId = req.body.pwaId;

  return verifyIdToken.verifyIdToken(idToken)
    .then(googleLogin => {
      const user = new User(googleLogin);
      return libFavoritePwa.save(new FavoritePwa(pwaId, user.id));
    })
    .then(favoritePwa => {
      if (favoritePwa) {
        res.json(favoritePwa);
      } else {
        res.status(404);
        res.json('not found');
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500);
      res.json('Error creating Favorite PWA');
    });
});

/**
 * DELETE /favorite-pwa/
 *
 * Delete a Favorite PWA.
 */
router.delete('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const idToken = req.body.idToken;
  const pwaId = req.body.pwaId;

  return verifyIdToken.verifyIdToken(idToken)
    .then(googleLogin => {
      const user = new User(googleLogin);
      return libFavoritePwa.findFavoritePwa(pwaId, user.id);
    })
    .then(favoritePwa => {
      if (favoritePwa) {
        libFavoritePwa.delete(favoritePwa.id)
          .then(_ => {
            res.status(200);
            res.json(favoritePwa);
          })
          .catch(err => {
            console.error(err);
            res.status(500);
            res.json('Error deleting favorite PWA');
          });
      } else {
        res.status(404);
        res.json('not found');
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500);
      res.json('Error deleting favorite PWA');
    });
});

module.exports = router;
