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

const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap

router.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html');

  /* eslint-disable quotes */
  res.setHeader('content-security-policy', [
    `default-src 'self' https://accounts.google.com https://apis.google.com https://fcm.googleapis.com`,
    `script-src 'self' 'unsafe-eval' https://apis.google.com https://www.google-analytics.com https://www.gstatic.com`,
    `style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com/ajax/libs/font-awesome/ https://www.gstatic.com`,
    `font-src 'self' https://cdnjs.cloudflare.com/ajax/libs/font-awesome/`,
    `img-src 'self' https://storage.googleapis.com https://www.google-analytics.com`
  ].join('; '));
  /* eslint-enable quotes */
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-dns-prefetch-control', 'off');
  res.setHeader('x-download-options', 'noopen');
  res.setHeader('x-frame-options', 'SAMEORIGIN');
  res.setHeader('x-xss-protection', '1; mode=block');
  next();
});

module.exports = router;
