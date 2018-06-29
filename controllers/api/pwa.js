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
const libMetadata = require('../../lib/metadata');
const router = express.Router(); // eslint-disable-line new-cap
const verifyIdToken = require('../../lib/verify-id-token');
const bodyParser = require('body-parser');
const Pwa = require('../../models/pwa');
const CACHE_CONTROL_EXPIRES = 60 * 60 * 1; // 1 hour
const RSS = require('rss');

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

function render(res, view, options) {
  return new Promise((resolve, reject) => {
    res.render(view, options, (err, html) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve(html);
    });
  });
}

function renderOnePwaRss(pwa, req, res) {
  const url = req.originalUrl;
  const contentOnly = false || req.query.contentOnly;
  let arg = Object.assign(libMetadata.fromRequest(req, url), {
    pwa: pwa,
    title: 'PWA Directory: ' + pwa.name,
    description: 'PWA Directory: ' + pwa.name + ' - ' + pwa.description,
    backlink: true,
    contentOnly: contentOnly
  });
  return render(res, 'pwas/view-rss.hbs', arg);
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

class RssWriter {
  write(req, res, pwas) {
    const feed = new RSS({
      /* eslint-disable camelcase */
      title: 'PWA Directory',
      description: 'A Directory of Progressive Web Apps',
      feed_url: 'https://pwa-directory.appspot.com/api/pwa/?format=rss',
      site_url: 'https://pwa-directory.appspot.com/',
      image_url: 'https://pwa-directory.appspot.com/favicons/android-chrome-144x144.png',
      pubDate: new Date(),
      custom_namespaces: {
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        l: 'http://purl.org/rss/1.0/modules/link/',
        media: 'http://search.yahoo.com/mrss/',
        content: 'http://purl.org/rss/1.0/modules/content/'
      }
    });

    const start = async _ => {
      await asyncForEach(pwas, async pwa => {
        let html = await renderOnePwaRss(pwa, req, res);

        const customElements = [];
        customElements.push({'content:encoded': html});
        customElements.push({'l:link': {_attr: {'l:rel': 'http://purl.org/rss/1.0/modules/link/#alternate',
          'l:type': 'application/json',
          'rdf:resource': 'https://pwa-directory.appspot.com/api/pwa/' + pwa.id}}});
        if (pwa.iconUrl128) {
          customElements.push({'media:thumbnail': {_attr: {url: pwa.iconUrl128,
            height: '128', width: '128'}}});
        }

        feed.item({
          title: pwa.displayName,
          url: 'https://pwa-directory.appspot.com/pwas/' + pwa.id,
          description: html,
          guid: pwa.id,
          date: pwa.created,
          custom_elements: customElements
        });
      });
      res.setHeader('Content-Type', 'application/rss+xml');
      res.status(200).send(feed.xml());
    };
    start();
    /* eslint-enable camelcase */
  }
}

const csvWriter = new CsvWriter();
const jsonWriter = new JsonWriter();
const rssWriter = new RssWriter();

/**
 * GET /api/pwa
 *
  * Returns all PWAs as JSON, ?format=csv for CSV or ?format=rss for RSS feed
 */
router.get('/:id*?', (req, res) => {
  let format = req.query.format || 'json';
  let sort = req.query.sort || 'newest';
  let skip = parseInt(req.query.skip, 10);
  let limit = parseInt(req.query.limit, 10) || 100;
  res.setHeader('Cache-Control', 'public, max-age=' + CACHE_CONTROL_EXPIRES);

  let queryPromise = req.params.id ? pwaLib.find(req.params.id) : pwaLib.list(skip, limit, sort);
  queryPromise
  .then(result => {
    result = result.pwas ? result : {pwas: [result]};
    switch (format) {
      case 'csv': {
        csvWriter.write(res, result.pwas);
        break;
      }
      case 'rss': {
        rssWriter.write(req, res, result.pwas);
        break;
      }
      default: {
        jsonWriter.write(res, result.pwas);
      }
    }
  })
  .catch(err => {
    console.log(err);
    let code = err.code || 500;
    res.status(code);
    res.json(err);
  });
});

router.post('/add', bodyParser.json(), (req, res) => {
  const idToken = req.body.idToken;

  if (!idToken) {
    res.sendStatus(401, JSON.stringify({error: 'user not logged in'}));
    return;
  }

  const manifestUrl = req.body.manifestUrl;
  if (!manifestUrl) {
    res.sendStatus(400, JSON.stringify({error: 'no manifest provided'}));
    return;
  }

  (async () => {
    try {
      const pwa = new Pwa(manifestUrl);
      const user = await verifyIdToken.verifyIdToken(idToken);
      pwa.setUser(user);
      const savedPwa = await pwaLib.createOrUpdatePwa(pwa);
      res.json({
        id: savedPwa.id
      });
    } catch (e) {
      res.sendStatus(400, JSON.stringify({error: e}));
    }
  })();
});

module.exports = router;
