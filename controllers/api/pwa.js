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
require('express-csv');
const pwaLib = require('../../lib/pwa');
const router = express.Router(); // eslint-disable-line new-cap
const CACHE_CONTROL_EXPIRES = 60 * 60 * 1; // 1 hour
const RSS = require('rss');

const config = require('../../config/config');
const apiKeyArray = config.get('API_TOKENS');

/**
 * Checks for the presence of an API key from API_TOKENS in config.json
 *
 * Skip API key check of RSS feed
 */
function checkApiKey(req, res, next) {
  if (req.query.key &&
      (apiKeyArray === req.query.key ||
       apiKeyArray.indexOf(req.query.key) !== -1) ||
       req.query.format === 'rss') {
    return next();
  }
  return res.sendStatus(403);
}

function getDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

class CsvWriter {
  write(result, pwas) {
    const csv = [];
    pwas.forEach(pwa => {
      const created = getDate(pwa.created);
      const updated = getDate(pwa.updated);
      const csvLine = [];
      csvLine.push(pwa.id);
      csvLine.push(pwa.absoluteStartUrl);
      csvLine.push(pwa.manifestUrl);
      csvLine.push(pwa.lighthouseScore);
      csvLine.push(created);
      csvLine.push(updated);
      csv.push(csvLine);
    });
    result.setHeader('Content-Type', 'text/csv');
    csv.unshift(
      ['id', 'absoluteStartUrl', 'manifestUrl', 'lighthouseScore', 'created', 'updated']);
    result.csv(csv);
  }
}

class JsonWriter {
  write(result, pwas) {
    const pwaList = [];
    pwas.forEach(dbPwa => {
      const created = getDate(dbPwa.created);
      const updated = getDate(dbPwa.updated);
      const pwa = {};
      pwa.id = dbPwa.id;
      pwa.absoluteStartUrl = dbPwa.absoluteStartUrl;
      pwa.manifestUrl = dbPwa.manifestUrl;
      pwa.lighthouseScore = dbPwa.lighthouseScore;
      pwa.webPageTest = dbPwa.webPageTest;
      pwa.pageSpeed = dbPwa.pageSpeed;
      pwa.created = created;
      pwa.updated = updated;
      pwaList.push(pwa);
    });
    result.setHeader('Content-Type', 'application/json');
    result.json(pwaList);
  }
}

class RssWriter {
  write(result, pwas) {
    const feed = new RSS({
      /* eslint-disable camelcase */
      title: 'PWA Directory',
      description: 'A Directory of Progressive Web Apps',
      feed_url: 'https://pwa-directory.appspot.com/api/pwa?format=rss',
      site_url: 'https://pwa-directory.appspot.com/',
      image_url: 'https://pwa-directory.appspot.com/favicons/android-chrome-144x144.png',
      pubDate: new Date(),
      custom_namespaces: {
        content: 'http://purl.org/rss/1.0/modules/content/'
      }
    });

    pwas.forEach(pwa => {
      feed.item({
        title: pwa.displayName,
        description: pwa.description,
        url: 'https://pwa-directory.appspot.com/pwas/' + pwa.id,
        guid: pwa.id,
        date: pwa.created,
        custom_elements: [{'content:encoded': JSON.stringify(pwa)}]
      });
    });
    /* eslint-enable camelcase */
    result.setHeader('Content-Type', 'application/rss+xml');
    result.status(200).send(feed.xml());
  }
}

const csvWriter = new CsvWriter();
const jsonWriter = new JsonWriter();
const rssWriter = new RssWriter();

/**
 * GET /api/pwa
 *
 * Returns all PWAs as JSON or ?format=csv for CSV.
 */
router.get('/', checkApiKey, (req, res) => {
  let format = req.query.format || 'json';
  let sort = req.query.sort || 'newest';
  let skip = parseInt(req.query.skip, 10);
  let limit = parseInt(req.query.limit, 10);

  res.setHeader('Cache-Control', 'public, max-age=' + CACHE_CONTROL_EXPIRES);
  pwaLib.list(skip, limit, sort)
    .then(result => {
      switch (format) {
        case 'csv': {
          csvWriter.write(res, result.pwas);
          break;
        }
        case 'rss': {
          rssWriter.write(res, result.pwas);
          break;
        }
        default: {
          jsonWriter.write(res, result.pwas);
        }
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500);
      res.json(err);
    });
});

module.exports = router;
