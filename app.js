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

const path = require('path');
const express = require('express');
const config = require('./config/config');
const hbs = require('hbs');
const helpers = require('./views/helpers');
const app = express();
const bodyParser = require('body-parser');
const serveStatic = require('serve-static');

app.disable('x-powered-by');
app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('trust proxy', true);
hbs.registerPartials(path.join(__dirname, '/views/includes/'));
helpers.registerHelpers(hbs);

// Make variables available to *all* templates
hbs.localsAsTemplateData(app);
app.locals.configstring = JSON.stringify({
  /* eslint-disable camelcase */
  client_id: config.get('CLIENT_ID'),
  ga_id: config.get('GOOGLE_ANALYTICS')
  /* eslint-enable camelcase */
});

app.use(bodyParser.urlencoded({extended: true}));

// Static files
app.use(serveStatic(path.resolve('./public'), {
  setHeaders: setCustomCacheControl
}));
function setCustomCacheControl(res, path) {
  let mime = serveStatic.mime.lookup(path);
  if (mime.match('image*')) {
    res.setHeader('Cache-Control', 'public, max-age=1d');
  }
}

// Middlewares
app.use(require('./middlewares'));

// Controllers
app.use(require('./controllers'));

// If no route has matched, return 404
app.use((req, res) => {
  res.status(404).render('404.hbs', {nonce1: req.nonce1, nonce2: req.nonce2});
});

// Basic error handler
app.use((err, req, res, _) => {
  console.error(err);
  if (err.status === 404) {
    res.status(404).render('404.hbs', {nonce1: req.nonce1, nonce2: req.nonce2});
  } else {
    // If our routes specified a specific response, then send that. Otherwise,
    // send a generic message so as not to leak anything.
    res.status(500).send(err || 'Something broke!');
  }
});

if (module === require.main) {
  // Start the server
  const server = app.listen(config.get('PORT'), () => {
    const port = server.address().port;
    console.log('App listening on port %s', port);
  });
}

module.exports = app;
